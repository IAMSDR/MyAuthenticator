<template>
  <UCard>
    <div class="flex items-center w-full h-full min-h-[6.375rem] p-2 relative">
      <div class="logo flex-none h-full w-[4.5rem] flex-center">
        <div
          class="h-[4.5rem] w-full rounded-full overflow-hidden z-[2] relative"
        >
          <svg
            viewBox="0 0 100 100"
            class="stroke-primary-500 rounded-full -rotate-90"
          >
            <circle
              :style="{ animationDuration: `${account.period}s` }"
              class="prog-bar fill-gray-100 dark:fill-black"
              cx="50"
              cy="50"
              r="45"
            />
          </svg>
          <div
            class="h-full fill-black dark:fill-white w-full inset-0 p-4 absolute flex-center"
          >
            <AccountIcon
              :isImg="account.icontype !== 'simple'"
              :icon="account.icon"
              class="h-full w-full p-1"
            />
          </div>
        </div>
      </div>
      <div class="flex flex-col h-full ml-5 overflow-hidden">
        <div class="flex flex-col">
          <span class="text-sm uppercase">{{ account.issuer }}</span>
          <span class="text-xs text-slate-400 mt-0.5">{{ account.label }}</span>
        </div>
        <div class="h-full flex items-center mt-2 pb-1">
          <UTooltip text="Click to copy" class="cursor-pointer">
            <span
              @click="copyToken"
              class="text-3xl text-gray-800 dark:text-gray-100 font-medium tracking-wide"
              >{{ token }}</span
            >
          </UTooltip>
        </div>
      </div>
      <div class="h-full flex items-center ml-auto">
        <UIcon
          class="cursor-pointer h-6 w-6 text-gray-400 duration-300"
          :class="showOptions && `rotate-180`"
          name="i-heroicons-chevron-right-16-solid"
          @click="optionsToggleHandler"
        />
      </div>
      <div
        class="h-full absolute inset-y-0 right-0 flex justify-end z-10 transition-all duration-500"
        :class="
          showOptions &&
          `bg-black/10 dark:bg-black/40 backdrop-blur-sm inset-x-0`
        "
      >
        <Transition name="slide">
          <div
            ref="options"
            v-show="showOptions"
            class="w-60 h-full bg-white dark:bg-gray-900 overflow-hidden rounded-md pl-5 pr-4"
          >
            <Transition name="slide2">
              <div
                v-if="!deleteConfirmation"
                class="flex-center w-full h-full space-x-4 text-xs"
              >
                <div class="flex-center flex-col space-y-2 p-2">
                  <UButton
                    icon="i-heroicons-pencil-solid"
                    variant="soft"
                    size="sm"
                    @click="modal.open(Edit, { account: account })"
                  />
                  <span>Edit</span>
                </div>
                <div class="flex-center flex-col space-y-2 p-2">
                  <UButton
                    icon="i-heroicons-qr-code-solid"
                    variant="soft"
                    size="sm"
                    @click="modal.open(Share, { uri: OTP.toString() })"
                  />
                  <span>Share</span>
                </div>
                <div class="flex-center flex-col space-y-2 p-2">
                  <UButton
                    icon="i-heroicons-trash-20-solid"
                    variant="soft"
                    size="sm"
                    color="red"
                    @click="deleteConfirmation = true"
                  />
                  <span>Delete</span>
                </div>
              </div>
              <div
                v-else="deleteConfirmation"
                class="h-full w-full flex-center space-x-4 text-sm font-semibold"
              >
                <span>Are you sure ?</span>
                <UButton
                  icon="i-heroicons-plus-16-solid"
                  :ui="{ icon: { base: 'rotate-45' } }"
                  variant="soft"
                  size="sm"
                  @click="deleteConfirmation = false"
                />
                <UButton
                  icon="i-heroicons-trash-20-solid"
                  color="red"
                  variant="soft"
                  size="sm"
                  @click="deleteAccount"
                />
              </div>
            </Transition>
          </div>
        </Transition>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import * as OTPAuth from "otpauth";
import type { Account } from "~/types";
import { onClickOutside } from "@vueuse/core";
import Edit from "~/components/Edit.vue";
import AccountIcon from "~/components/AccountIcon.vue";
import Share from "~/components/Share.vue";
import { toast } from "@steveyuowo/vue-hot-toast";

const modal = useModal();

const props = defineProps<{
  account: Account;
}>();

const OTP =
  props.account.type === "TOTP"
    ? new OTPAuth.TOTP(props.account)
    : new OTPAuth.HOTP(props.account);

const token = ref("0");

const intervel = ref<NodeJS.Timeout>();

const deleteConfirmation = ref(false);

const options = ref(null);

const showOptions = ref(false);

const copyToken = () => {
  navigator.clipboard.writeText(token.value);
  toast.success("copied to clipboard !");
};

const updateToken = () => {
  token.value = OTP.generate();
  if (intervel.value) clearInterval(intervel.value);
  intervel.value = setInterval(() => {
    updateToken();
  }, props.account.period * 1000);
};

const close = (e?: Event) => {
  showOptions.value = false;
  deleteConfirmation.value = false;
};

const optionsToggleHandler = () => {
  if (!showOptions.value) showOptions.value = true;
  else close();
};

onClickOutside(options, close);

const deleteAccount = async () => {
  const toastId = toast.loading("Loading...");
  await $fetch(`/api/accounts/${props.account.id}`, {
    method: "DELETE",
  })
    .then(async (data) => {
      toast.update(toastId, {
        type: "success",
        message: "Deleted successfully",
      });
      await refreshNuxtData("accounts");
      modal.close();
    })
    .catch((err: Error) => {
      console.log(err);
      toast.update(toastId, { type: "error", message: err.message });
    });
};

onMounted(() => {
  updateToken();
});
</script>

<style scoped>
.prog-bar {
  stroke-width: 5px;
  stroke-linecap: round;
  stroke-dashoffset: 280px;
  stroke-dasharray: 280px;
  animation: progress 0s linear 0s infinite;
}

@keyframes progress {
  0% {
    stroke-dashoffset: 280px;
  }
  100% {
    stroke-dashoffset: 0px;
  }
}

.slide-enter-active,
.slide2-enter-active,
.slide-leave-active,
.slide2-leave-active {
  @apply transition-transform duration-500 ease-in-out;
}

.slide-enter-from,
.slide2-enter-from,
.slide-leave-to {
  @apply translate-x-80;
}
.slide2-leave-to {
  @apply -translate-x-80;
}
.slide-enter-to,
.slide2-enter-to,
.slide-leave-from {
  @apply translate-x-0;
}
.slide2-leave-from {
  @apply -translate-x-0;
}
</style>
