import normalIcons from "~/assets/json/icons.json";
import {
  type Account,
  otpSchema,
  algorithmSchema,
  icontypeSchema,
} from "~/types";
import { Payload, type Payload_OtpParameters } from "./proto/google";
import * as OTPAuth from "otpauth";

export const handleQrcodeData = (data: string) => {
  if (data.startsWith("otpauth://")) return extractAccountsFromUri(data);
  else if (data.startsWith("otpauth-migration://offline"))
    return extractAccountsFromGoogleUri(data);
  else return;
};

export const matchIcon = (name: string) => {
  const icon = normalIcons.find(
    (ic) => ic.toLocaleLowerCase() === name.toLocaleLowerCase().trim()
  );
  if (!icon) return "default";
  return icon;
};

export function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (_, r, g, b) {
    return r + r + g + g + b + b;
  });
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(
        result[3],
        16
      )}`
    : null;
}

const extractAccountsFromUri = (uri: string) => {
  var data: OTPAuth.HOTP | OTPAuth.TOTP;
  try {
    data = OTPAuth.URI.parse(uri);
  } catch {
    return;
  }
  const accounts: Account[] = [];
  const url = new URL(uri);
  const period = url.searchParams.get("period") ?? "30";
  const counter = url.searchParams.get("counter") ?? "0";
  accounts.push({
    type: uri.includes("totp") ? otpSchema.Values.TOTP : otpSchema.Values.HOTP,
    issuer: data.issuer,
    label: data.label,
    icon: matchIcon(data.issuer),
    icontype: icontypeSchema.Values.normal,
    secret: data.secret.base32,
    algorithm: algorithmSchema.parse(data.algorithm),
    digits: data.digits,
    period: parseInt(period),
    counter: parseInt(counter),
  });
  return accounts;
};

const extractAccountsFromGoogleUri = (uri: string) => {
  const url = new URL(uri);
  const data = url.searchParams.get("data");
  if (!data) return;
  let otpParameters: Payload_OtpParameters[] = [];
  try {
    const payload = Payload.decode(
      Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
    );

    otpParameters = payload.otpParameters;
  } catch {
    return;
  }
  if (!otpParameters.length) return;
  const accounts: Account[] = [];
  for (const otp of otpParameters) {
    const type =
      otp.type > 0
        ? otp.type === 1
          ? otpSchema.Values.HOTP
          : otpSchema.Values.TOTP
        : undefined;
    const algorithm = otp.algorithm
      ? {
          [-1]: undefined,
          0: undefined,
          1: algorithmSchema.Values.SHA1,
          2: algorithmSchema.Values.SHA256,
          3: algorithmSchema.Values.SHA512,
          4: undefined,
        }[otp.algorithm]
      : undefined;
    const digits = otp.digits > 0 ? (otp.digits === 1 ? 6 : 8) : undefined;
    if (!type || !algorithm || !digits || !otp.secret || !otp.name) continue;
    accounts.push({
      type: type,
      issuer: otp.issuer,
      label: otp.name,
      icon: matchIcon(otp.issuer),
      icontype: icontypeSchema.Values.normal,
      secret: new OTPAuth.Secret({ buffer: otp.secret }).base32,
      algorithm: algorithm,
      digits: digits,
      period: 30,
      counter: otp.counter ?? 0,
    });
  }
  return accounts;
};

export const encodeToGoogleAuthenticatorUri = (accounts: Account[]) => {
  const otpParameters: Payload_OtpParameters[] = [];
  for (const account of accounts) {
    const OTP =
      account.type === "TOTP"
        ? new OTPAuth.TOTP(account)
        : new OTPAuth.HOTP(account);
    otpParameters.push({
      name: account.issuer
        ? `${account.issuer}:${account.label}`
        : account.label,
      issuer: OTP.issuer,
      secret: new Uint8Array(OTP.secret.bytes),
      type: account.type === "HOTP" ? 1 : 2,
      algorithm: {
        SHA1: 1,
        SHA256: 2,
        SHA512: 3,
      }[account.algorithm],
      digits: account.digits === 6 ? 1 : 2,
      counter: 0,
    });
  }
  const data = Payload.encode({
    otpParameters: otpParameters,
    version: 1,
    batchSize: 1,
    batchIndex: 0,
    batchId: 0,
  }).finish();
  return btoa(String.fromCharCode(...data));
};
