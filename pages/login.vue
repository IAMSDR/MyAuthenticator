<template>
  <div class="h-dvh overflow-hidden flex flex-center">
    <UCard
      :ui="{
        body: {
          padding: 'px-3 md:px-5 xl:px-8 py-3',
          base: '',
        },
      }"
    >
      <UForm
        :schema="LoginSchema"
        :state="state"
        @submit="loginUser"
        @error="onError"
        class="flex flex-col items-center"
      >
        <span className="text-lg xs:text-xl font-semibold uppercase mb-2"
          >Login</span
        >
        <UFormGroup label="Username" size="lg">
          <UInput
            v-model="state.username"
            placeholder="John"
            icon="i-heroicons-user-circle"
            name="username"
            required
          />
        </UFormGroup>
        <UFormGroup label="Password" size="lg">
          <UInput
            v-model="state.password"
            placeholder="password"
            icon="i-heroicons-key"
            name="password"
            type="password"
            required
          />
        </UFormGroup>
        <div class="flex flex-center mt-4 p-2 relative">
          <UButton
            :disabled="showSpinner"
            type="submit"
            variant="soft"
            size="lg"
            >Submit</UButton
          >
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent, FormErrorEvent } from "#ui/types";
import { type Login, LoginSchema } from "../types";
import { toast } from "@steveyuowo/vue-hot-toast";

const { fetch: refreshSession } = useUserSession();

const route = useRoute();

const state = reactive({
  username: "",
  password: "",
});

const showSpinner = ref(false);

const loginUser = async (event: FormSubmitEvent<Login>) => {
  showSpinner.value = true;
  const toastId = toast.loading("Loading...");
  await $fetch("/api/auth/login", {
    method: "POST",
    body: state,
  })
    .then(async (data) => {
      await refreshSession();
      navigateTo("/");
      toast.update(toastId, {
        type: "success",
        message: "Login successful",
      });
    })
    .catch((err: Error) => {
      console.log(err);
      toast.update(toastId, { type: "error", message: "Invalid Credentials" });
    });
  showSpinner.value = false;
};

const onError = (event: FormErrorEvent) => {
  toast.error("Invalid Credentials");
};
</script>
