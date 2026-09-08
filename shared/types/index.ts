import { z } from "zod";

export const otpSchema = z.enum(["TOTP", "HOTP"]);
export const algorithmSchema = z.enum(["SHA1", "SHA256", "SHA512"]);

export const accountSchema = z.object({
  id: z.string().uuid().optional(),
  type: otpSchema,
  issuer: z.string(),
  label: z.string().nonempty("label is required"),
  icon: z.string(),
  secret: z.string().regex(/^[A-Z2-7=]+$/, "Invalid secret key"),
  algorithm: algorithmSchema,
  digits: z.number().min(6).max(8),
  period: z.number().min(5).max(60),
  counter: z.number().min(0),
  createdAt: z.string().optional(),
  folderId: z.string().optional(),
});

export const cipherAccountSchema = z.object({
  id: z.string().uuid(),
  type: otpSchema,
  issuer: z.string(),
  label: z.string().nonempty("label is required"),
  icon: z.string(),
  secret: z.string().nonempty("ciphertext required"),
  algorithm: algorithmSchema,
  digits: z.number().min(6).max(8),
  period: z.number().min(5).max(60),
  counter: z.number().min(0),
  createdAt: z.string(),
  folderId: z.string().optional(),
});

export const accountsSchema = z.array(accountSchema);
export const cipherAccountsSchema = z.array(cipherAccountSchema);

export const accountEditSchema = accountSchema.pick({
  label: true,
  issuer: true,
  icon: true,
});

export const passwordSchema = z.object({
  password: z
    .string()
    .trim()
    .min(8)
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      "Password must contain 1 uppercase, 1 lowercase, 1 digit and 1 special character"
    ),
});

export const setupSchema = z.object({
  password: z
    .string()
    .trim()
    .min(8)
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      "Password must contain 1 uppercase, 1 lowercase, 1 digit and 1 special character"
    ),
  wrappedDEK: z.string().nonempty(),
});

export const loginSchema = passwordSchema;

export const changePasswordSchema = z.object({
  newWrappedDEK: z.string().nonempty(),
  password: z
    .string()
    .trim()
    .min(8)
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      "Password must contain 1 uppercase, 1 lowercase, 1 digit and 1 special character"
    ),
  oldPassword: z.string().min(8, "Current password is required"),
});

export const accountsMetaSchema = z.object({
  version: z.number().int().min(0),
  updatedAt: z.string(),
  count: z.number().int().min(0),
});

export const folderSchema = z.object({
  id: z.string(),
  name: z.string().nonempty(),
  color: z.string().optional(),
  createdAt: z.string(),
});

export const foldersSchema = z.array(folderSchema);

export const cacheSchema = z.object({
  version: z.number(),
  updatedAt: z.string(),
  map: z.record(z.string(), cipherAccountSchema),
  order: z.array(z.string()).optional(),
});

export const iconSchema = z.object({
  label: z.string(),
  icon: z.string(),
  description: z.string().optional(),
});

export const passkeyUser = z.object({
  userName: z.string().nonempty(),
  displayName: z.string().nonempty(),
});

export const passkeyTableSchema = z.object({
  id: z.string().nonempty(),
  displayName: z.string().nonempty(),
  createdAt: z.string().nonempty(),
});

// TYPES
export type Account = z.infer<typeof accountSchema>;
export type CipherAccount = z.infer<typeof cipherAccountSchema>;
export type Accounts = z.infer<typeof accountsSchema>;
export type CipherAccounts = z.infer<typeof cipherAccountsSchema>;
export type AccountEdit = z.infer<typeof accountEditSchema>;
export type Login = z.infer<typeof loginSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
export type SetupInput = z.infer<typeof setupSchema>;
export type AccountsMeta = z.infer<typeof accountsMetaSchema>;
export type Folder = z.infer<typeof folderSchema>;
export type Cache = z.infer<typeof cacheSchema>;
export type Icon = z.infer<typeof iconSchema>;
export type PasskeyUser = z.infer<typeof passkeyUser>;
export type Passkey = z.infer<typeof passkeyTableSchema>;
