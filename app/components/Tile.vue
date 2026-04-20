<script setup lang="ts">
import * as OTPAuth from "otpauth";
import { toast } from "@steveyuowo/vue-hot-toast";
import Edit from "./Edit.vue";
import Share from "./Share.vue";

const overlay = useOverlay();

const editModal = overlay.create(Edit);
const shareModal = overlay.create(Share);

const props = defineProps<{
  account: Account;
}>();

const OTP =
  props.account.type === "TOTP"
    ? new OTPAuth.TOTP(props.account)
    : new OTPAuth.HOTP(props.account);

const token = ref("0");

const intervel = ref<NodeJS.Timeout>();

const percentage = ref(0);

const deleteConfirmation = ref(false);

const options = ref(null);

const showOptions = ref(false);

const close = () => {
  showOptions.value = false;
  deleteConfirmation.value = false;
};

onClickOutside(options, close);

const optionsToggleHandler = () => {
  if (!showOptions.value) showOptions.value = true;
  else close();
};

const copyToken = () => {
  navigator.clipboard.writeText(token.value);
  toast.success("Copied to clipboard");
};

const updateToken = () => {
  const period = props.account.period;
  const remainingSeconds = period * (1 - ((Date.now() / 1000 / period) % 1));
  percentage.value = Math.round(
    (remainingSeconds / props.account.period) * 280
  );
  if (remainingSeconds < 2 || remainingSeconds > period - 2)
    token.value = OTP.generate();
};

const openEdit = () => {
  editModal.open({ account: props.account, accountId: props.account.id });
  close();
};

const openShare = () => {
  shareModal.open({ uri: OTP.toString() });
  close();
};

const deleteAccount = async () => {
  const toastid = toast.loading("loading...");
  $fetch("/api/accounts", {
    method: "DELETE",
    query: { id: props.account.id },
  })
    .then(async (res) => {
      toast.update(toastid, {
        message: res.message,
        type: "success",
      });
      await refreshNuxtData("accounts");
    })
    .catch((err) => {
      console.error(err);
      toast.update(toastid, {
        message: err?.data?.message ?? err,
        type: "error",
      });
    });
};

onMounted(() => {
  token.value = OTP.generate();
  if (props.account.type == "TOTP")
    intervel.value = setInterval(updateToken, 1000);
});

onUnmounted(() => {
  clearInterval(intervel.value);
});
</script>

<template>
  <UCard :ui="{ body: '!p-0' }">
    <div class="flex items-center w-full h-full min-h-[6.375rem] p-2 relative">
      <div class="logo flex-none h-full w-[4.5rem] flex-center">
        <div
          class="h-[4.5rem] w-full rounded-full overflow-hidden z-[2] relative"
        >
          <svg
            viewBox="0 0 100 100"
            class="stroke-(--ui-primary) rounded-full -rotate-90"
          >
            <circle
              :style="{ strokeDashoffset: `${percentage}px` }"
              class="stroke-[5px] [stroke-dashoffset:280px] transition-all duration-1000 ease-linear [stroke-dasharray:280px] [stroke-linecap:round] fill-neutral-100 dark:fill-black"
              cx="50"
              cy="50"
              r="45"
            />
          </svg>
          <div
            class="h-full fill-black dark:fill-white w-full inset-0 absolute flex-center"
          >
            <UIcon
              :name="account.icon"
              class="text-neutral-800 dark:text-neutral-200 size-8"
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
              class="text-3xl text-neutral-800 dark:text-neutral-100 font-medium tracking-wide"
              @click="copyToken"
              >{{ token }}</span
            >
          </UTooltip>
        </div>
      </div>
      <div class="h-full flex items-center ml-auto">
        <UIcon
          class="cursor-pointer h-6 w-6 text-neutral-400 duration-300"
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
            v-show="showOptions"
            ref="options"
            class="w-60 h-full bg-white dark:bg-neutral-900 overflow-hidden rounded-[calc(var(--ui-radius)*2)] pl-5 pr-4"
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
                    size="md"
                    @click="openEdit"
                  />
                  <span>Edit</span>
                </div>
                <div class="flex-center flex-col space-y-2 p-2">
                  <UButton
                    icon="i-heroicons-qr-code-solid"
                    variant="soft"
                    size="md"
                    @click="openShare"
                  />
                  <span>Share</span>
                </div>
                <div class="flex-center flex-col space-y-2 p-2">
                  <UButton
                    icon="i-heroicons-trash-20-solid"
                    variant="soft"
                    size="md"
                    color="error"
                    @click="deleteConfirmation = true"
                  />
                  <span>Delete</span>
                </div>
              </div>
              <div
                v-else
                class="h-full w-full flex-center space-x-4 text-sm font-semibold"
              >
                <span>Are you sure ?</span>
                <UButton
                  icon="i-entypo-cross"
                  variant="soft"
                  size="md"
                  @click="deleteConfirmation = false"
                />
                <UButton
                  icon="i-heroicons-trash-20-solid"
                  variant="soft"
                  size="md"
                  color="error"
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
