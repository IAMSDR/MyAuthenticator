<script setup lang="ts">
import * as OTPAuth from "otpauth";
import { toast } from "@steveyuowo/vue-hot-toast";
import Edit from "./Edit.vue";
import Share from "./Share.vue";
import { ensureOnline, getWriteErrorMessage, onlineNow } from "~/utils/offline";
import { deleteCachedAccount } from "~/utils/cache";

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

const options = ref<HTMLElement | null>(null);

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
  close();

  const targetId = props.account.id;
  const { data: accountsData } = useNuxtData<CipherAccount[]>("accounts");
  const prevAccount = props.account;
  const prevIndex = accountsData.value ? accountsData.value.findIndex((a) => a.id === targetId) : -1;

  if (accountsData.value) {
    accountsData.value = accountsData.value.filter((a) => a.id !== targetId);
  }

  const toastId = toast.loading("Deleting...");
  $fetch<{ status: number; message: string; version: number }>("/api/accounts", {
    method: "DELETE",
    query: { id: targetId },
  })
    .then(async (res) => {
      toast.update(toastId, {
        message: res.message || "Deleted successfully",
        type: "success",
      });
      await deleteCachedAccount(targetId, res.version);
    })
    .catch(async (err) => {
      toast.update(toastId, {
        message: getWriteErrorMessage(err, "delete this authenticator"),
        type: "error",
      });
      if (accountsData.value && prevAccount && !accountsData.value.some((a) => a.id === targetId)) {
        const next = [...accountsData.value];
        if (prevIndex >= 0 && prevIndex <= next.length) {
          next.splice(prevIndex, 0, prevAccount);
        } else {
          next.push(prevAccount);
        }
        accountsData.value = next;
      }
      if (onlineNow()) await refreshNuxtData("accounts");
    });
};

onMounted(() => {
  token.value = OTP.generate();
  updateToken();
  if (props.account.type === "TOTP")
    interval.value = setInterval(updateToken, 1000);
});

onUnmounted(() => {
  if (interval.value) clearInterval(interval.value);
});
</script>

<template>
  <UCard :ui="{ body: '!p-0' }" class="w-full">
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
          <span class="text-sm uppercase font-semibold text-neutral-900 dark:text-neutral-100 truncate">{{ account.issuer }}</span>
          <span class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">{{ account.label }}</span>
        </div>
        <div class="h-full flex items-center mt-2 pb-1">
          <UTooltip text="Click to copy" class="cursor-pointer">
            <span
              class="text-3xl text-neutral-900 dark:text-neutral-100 font-mono font-medium tracking-wide hover:text-(--ui-primary) transition-colors cursor-pointer"
              @click="copyToken"
              >{{ token }}</span
            >
          </UTooltip>
        </div>
      </div>
      <div class="h-full flex items-center ml-auto">
        <UIcon
          class="cursor-pointer h-6 w-6 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 duration-300"
          :class="showOptions && `rotate-180`"
          name="i-lucide-chevron-right"
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
            class="w-60 h-full bg-white dark:bg-neutral-900 overflow-hidden rounded-r-lg pl-5 pr-4 flex items-center border-l border-neutral-200 dark:border-neutral-800"
          >
            <Transition name="slide2" mode="out-in">
              <div
                v-if="!deleteConfirmation"
                key="options"
                class="flex-center w-full h-full space-x-4 text-xs"
              >
                <div class="flex-center flex-col space-y-2 p-2">
                  <UButton
                    icon="i-lucide-pencil"
                    variant="soft"
                    size="md"
                    color="neutral"
                    aria-label="Edit"
                    @click="openEdit"
                  />
                  <span class="text-neutral-600 dark:text-neutral-400">Edit</span>
                </div>
                <div class="flex-center flex-col space-y-2 p-2">
                  <UButton
                    icon="i-lucide-qr-code"
                    variant="soft"
                    size="md"
                    color="neutral"
                    aria-label="Share"
                    @click="openShare"
                  />
                  <span class="text-neutral-600 dark:text-neutral-400">Share</span>
                </div>
                <div class="flex-center flex-col space-y-2 p-2">
                  <UButton
                    icon="i-lucide-trash-2"
                    variant="soft"
                    size="md"
                    color="error"
                    aria-label="Delete"
                    @click="deleteConfirmation = true"
                  />
                  <span class="text-red-600 dark:text-red-400">Delete</span>
                </div>
              </div>
              <div
                v-else
                key="confirm"
                class="h-full w-full flex-center space-x-4 text-sm font-semibold"
              >
                <span class="text-xs text-neutral-800 dark:text-neutral-200">Are you sure?</span>
                <UButton
                  icon="i-lucide-x"
                  variant="soft"
                  size="md"
                  color="neutral"
                  aria-label="Cancel"
                  @click="deleteConfirmation = false"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  variant="soft"
                  size="md"
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
  </UCard>
</template>
