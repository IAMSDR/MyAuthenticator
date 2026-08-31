<script setup lang="ts">
import * as OTPAuth from "otpauth";
import { toast } from "@steveyuowo/vue-hot-toast";
import Edit from "./Edit.vue";
import Share from "./Share.vue";
import { ensureOnline } from "~/utils/offline";

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

const token = ref("000000");

const interval = ref<ReturnType<typeof setInterval>>();

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
  const period = props.account.period ?? 30;
  const remainingSeconds = period * (1 - ((Date.now() / 1000 / period) % 1));
  percentage.value = Math.round(
    (remainingSeconds / period) * 280
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
  if (!ensureOnline("delete this authenticator")) return;
  const toastid = toast.loading("Deleting...");
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
        message: err?.data?.message ?? String(err),
        type: "error",
      });
    });
};

onMounted(() => {
  token.value = OTP.generate();
  if (props.account.type === "TOTP")
    interval.value = setInterval(updateToken, 1000);
});

onUnmounted(() => {
  clearInterval(interval.value);
});
</script>

<template>
  <div class="relative w-full max-w-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
    <div class="flex items-center w-full h-full min-h-[6.375rem] p-3 relative">
      <div class="logo flex-none h-full w-[4.5rem] flex-center">
        <div
          class="h-[4.5rem] w-full rounded-full overflow-hidden z-[2] relative"
        >
          <svg
            viewBox="0 0 100 100"
            class="stroke-primary-500 rounded-full -rotate-90"
          >
            <circle
              :style="{ strokeDashoffset: `${percentage}px` }"
              class="stroke-[5px] [stroke-dashoffset:280px] transition-all duration-1000 ease-linear [stroke-dasharray:280px] [stroke-linecap:round] fill-neutral-50 dark:fill-neutral-950"
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
              class="text-neutral-800 dark:text-neutral-200 size-7"
            />
          </div>
        </div>
      </div>
      <div class="flex flex-col h-full ml-4 overflow-hidden">
        <div class="flex flex-col">
          <span class="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 truncate">{{ account.issuer }}</span>
          <span class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">{{ account.label }}</span>
        </div>
        <div class="h-full flex items-center mt-2 pb-1">
          <UTooltip text="Click to copy" class="cursor-pointer">
            <span
              @click="copyToken"
              class="text-2xl sm:text-3xl text-neutral-900 dark:text-neutral-100 font-semibold tracking-wider cursor-pointer font-mono hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >{{ token }}</span
            >
          </UTooltip>
        </div>
      </div>
      <div class="h-full flex items-center ml-auto">
        <UIcon
          class="cursor-pointer h-6 w-6 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 duration-300"
          :class="showOptions && `rotate-180`"
          name="i-heroicons-chevron-right-16-solid"
          @click="optionsToggleHandler"
        />
      </div>
      <div
        class="h-full absolute inset-y-0 right-0 flex justify-end z-10 transition-all duration-300"
        :class="
          showOptions &&
          `bg-neutral-950/40 backdrop-blur-sm inset-x-0`
        "
      >
        <Transition name="slide">
          <div
            ref="options"
            v-show="showOptions"
            class="w-60 h-full bg-white dark:bg-neutral-900 overflow-hidden rounded-r-lg border-l border-neutral-200 dark:border-neutral-800 pl-4 pr-3 flex items-center"
          >
            <Transition name="slide2">
              <div
                v-if="!deleteConfirmation"
                class="flex-center w-full h-full space-x-3 text-xs"
              >
                <div class="flex-center flex-col space-y-1.5 p-1.5">
                  <UButton
                    icon="i-heroicons-pencil-solid"
                    variant="soft"
                    size="sm"
                    color="neutral"
                    aria-label="Edit"
                    @click="openEdit"
                  />
                  <span class="text-neutral-600 dark:text-neutral-400 font-medium text-[11px]">Edit</span>
                </div>
                <div class="flex-center flex-col space-y-1.5 p-1.5">
                  <UButton
                    icon="i-heroicons-qr-code-solid"
                    variant="soft"
                    size="sm"
                    color="neutral"
                    aria-label="Share"
                    @click="openShare"
                  />
                  <span class="text-neutral-600 dark:text-neutral-400 font-medium text-[11px]">Share</span>
                </div>
                <div class="flex-center flex-col space-y-1.5 p-1.5">
                  <UButton
                    icon="i-heroicons-trash-20-solid"
                    variant="soft"
                    size="sm"
                    color="error"
                    aria-label="Delete"
                    @click="deleteConfirmation = true"
                  />
                  <span class="text-red-600 dark:text-red-400 font-medium text-[11px]">Delete</span>
                </div>
              </div>
              <div
                v-else
                class="h-full w-full flex-center space-x-3 text-xs font-semibold"
              >
                <span class="text-neutral-800 dark:text-neutral-200">Are you sure?</span>
                <UButton
                  icon="i-lucide-x"
                  variant="soft"
                  size="xs"
                  color="neutral"
                  aria-label="Cancel delete"
                  @click="deleteConfirmation = false"
                />
                <UButton
                  icon="i-heroicons-trash-20-solid"
                  variant="soft"
                  size="xs"
                  color="error"
                  aria-label="Confirm delete"
                  @click="deleteAccount"
                />
              </div>
            </Transition>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>


