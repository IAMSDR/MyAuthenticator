import { z } from "zod";

export const otpSchema = z.enum(["TOTP", "HOTP"]);
export const icontypeSchema = z.enum(["normal", "simple"]);
export const algorithmSchema = z.enum(["SHA1", "SHA256", "SHA512"]);

export const AccountSchema = z.object({
  id: z.number().optional(),
  type: otpSchema,
  issuer: z.string(),
  label: z.string().min(1),
  icon: z.string(),
  icontype: icontypeSchema,
  secret: z
    .string()
    .trim()
    .min(1)
    .refine((s) => !s.includes(" "), "Key must not contain spaces !!"),
  algorithm: algorithmSchema,
  digits: z.number().min(6).max(8),
  period: z.number().min(5).max(60),
  counter: z.number().min(0).max(3000),
});

export const AccountsSchema = z.array(AccountSchema);

export const AccountEditSchema = AccountSchema.pick({
  label: true,
  issuer: true,
  icon: true,
  icontype: true,
});

export const LoginSchema = z.object({
  username: z.string().trim().min(5),
  password: z
    .string()
    .trim()
    .min(8)
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=(.*?[#?!@$%^&*-]){2,}).{8,}$/
    ),
});

export const IconsQueryObjectSchema = z.object({
  query: z.string(),
  type: icontypeSchema,
});

export type Account = z.infer<typeof AccountSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type IconsQueryObject = z.infer<typeof IconsQueryObjectSchema>;

export type Icontype = z.infer<typeof icontypeSchema>;
