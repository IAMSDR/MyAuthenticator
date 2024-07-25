import { LoginSchema } from "~/types";

export default eventHandler(async (event) => {
  const { data, error } = await readValidatedBody(event, (body) =>
    LoginSchema.safeParse(body)
  );
  if (error)
    throw createError({
      statusCode: 400,
      statusMessage: "Validation Failed !!",
      message: error.message,
    });
  const runtimeConfig = useRuntimeConfig(event);
  if (data.username !== runtimeConfig.AUTH_USERNAME)
    throw createError({
      statusCode: 401,
      message: "Login Required",
    });
  if (data.password !== runtimeConfig.AUTH_PASSWORD)
    throw createError({
      statusCode: 401,
      message: "Login Required",
    });
  await setUserSession(event, { user: "ADMIN" });
  return "Login Success";
});
