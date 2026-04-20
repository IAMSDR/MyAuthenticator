<script setup lang="ts">
import { h } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { toast } from "@steveyuowo/vue-hot-toast";

const UButton = resolveComponent("UButton");

const { register } = useWebAuthn();

const { data: passkeys, status } = await useLazyFetch(
  "/api/webauthn/passkeys",
  {
    key: "passkeys",
    server: false,
  }
);

const columns: TableColumn<Passkey>[] = [
  { header: "Name", accessorKey: "displayName" },
  { header: "Created At", accessorKey: "createdAt" },
  {
    id: "actions",
    cell: ({ row }) =>
      h(UButton, {
        color: "error",
        variant: "soft",
        size: "sm",
        icon: "i-heroicons-trash-16-solid",
        disabled: loading.value,
        onClick: () => deletePasskey(row.original.id),
      }),
  },
];

const passKeyName = ref<string>();

const loading = ref(false);

const addPasskey = async () => {
  loading.value = true;
  await register({
    userName: `${passKeyName.value} - MyAuthenticator`,
    displayName: passKeyName.value,
  })
    .then(async (res) => {
      toast.success("Passkey added successfully");
      await refreshNuxtData("passkeys");
      loading.value = false;
    })
    .catch((err) => {
      toast.error(err?.data?.message ?? err);
      loading.value = false;
      console.error(err);
    });
};

const deletePasskey = async (id: string) => {
  const isSure = confirm(
    "Are you sure? This will permanently delete the passkey from the server, and you won't be able to use it to log in again."
  );
  if (!isSure) return;
  const toastid = toast.loading("loading...");
  $fetch("/api/webauthn/passkeys", {
    method: "DELETE",
    query: { id: id },
  })
    .then(async (res) => {
      toast.update(toastid, {
        message: res.message,
        type: "success",
      });
      await refreshNuxtData("passkeys");
    })
    .catch((err) => {
      console.error(err);
      toast.update(toastid, {
        message: err?.data?.message ?? err,
        type: "error",
      });
    });
};
</script>

<template>
  <UModal
    title="Passkeys"
    :ui="{ close: 'top-2 start-6 end-auto' }"
    close-icon="i-lucide-arrow-left"
    :dismissible="false"
  >
    <template #body>
      <div class="py-4 flex-col">
        <form class="flex justify-end space-x-2" @submit.prevent="addPasskey">
          <UInput
            v-model="passKeyName"
            color="neutral"
            variant="outline"
            placeholder="Passkey Name"
            :ui="{ root: 'w-auto' }"
            required
          />
          <UButton
            type="submit"
            color="primary"
            icon="i-heroicons-plus-16-solid"
            size="sm"
            :disabled="loading"
            >NEW</UButton
          >
        </form>
        <UTable
          :columns="columns"
          :loading="status === 'pending'"
          :data="passkeys"
          class="border border-neutral-300 dark:border-neutral-700 mt-4 rounded-[calc(var(--ui-radius)*2)] flex-1"
        />
      </div>
    </template>
  </UModal>
</template>
