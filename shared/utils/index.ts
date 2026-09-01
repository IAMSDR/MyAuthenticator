import * as OTPAuth from "otpauth";
import { Payload, type Payload_OtpParameters } from "./proto/google";

export const getIcons = async (query: string) => {
  const clean = query?.trim();
  if (!clean) return [];

  try {
    const res = await $fetch<{ icons: string[] }>(
      "https://api.iconify.design/search",
      {
        query: {
          query: clean,
          limit: 30,
        },
      },
    );

    if (!res.icons || !res.icons.length) {
      return [
        {
          label: clean,
          icon: defaultIcon,
        },
      ];
    }

    return res.icons.map((icon) => {
      const parts = icon.split(":");
      const collection = parts[0];
      const name = parts[1] || "";
      return {
        label: name.replace(/[-_]/g, " "),
        description: collection,
        icon: `i-${collection}-${name}`,
      };
    });
  } catch {
    return [
      {
        label: clean,
        icon: defaultIcon,
      },
    ];
  }
};

export const matchIcon = async (query: string) => {
  const icon = query?.toLowerCase().trim();
  if (!icon) return defaultIcon;

  try {
    const res = await $fetch<{ icons: string[] }>(
      "https://api.iconify.design/search",
      {
        query: {
          query: icon,
          collection: "simple-icons",
          limit: 10,
        },
      },
    );

    if (res.icons && res.icons.length > 0) {
      const match =
        res.icons.find((i) => i.startsWith("simple-icons:")) || res.icons[0];
      if (match) {
        return `i-${match.replace(":", "-")}`;
      }
    }
  } catch {}

  return defaultIcon;
};

export const extractAccountsFromUriList = async (uriList: string[]) => {
  const accounts: Accounts = [];
  for (const uri of uriList) {
    let account: OTPAuth.HOTP | OTPAuth.TOTP;
    try {
      account = OTPAuth.URI.parse(uri);
    } catch {
      return;
    }
    const url = new URL(uri);
    const period = url.searchParams.get("period") ?? "30";
    const counter = url.searchParams.get("counter") ?? "0";
    accounts.push({
      type: uri.includes("totp")
        ? otpSchema.Values.TOTP
        : otpSchema.Values.HOTP,
      issuer: account.issuer,
      label: account.label,
      icon: await matchIcon(account.issuer),
      secret: account.secret.base32,
      algorithm: algorithmSchema.parse(account.algorithm),
      digits: account.digits,
      period: parseInt(period),
      counter: parseInt(counter),
    });
  }
  return accounts;
};

export const extractAccountsFromGoogleUri = async (uri: string) => {
  const url = new URL(uri);
  const data = url.searchParams.get("data");
  if (!data) return;
  let otpParameters: Payload_OtpParameters[] = [];
  try {
    const payload = Payload.decode(
      Uint8Array.from(atob(data), (c) => c.charCodeAt(0)),
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
      icon: await matchIcon(otp.issuer),
      secret: new OTPAuth.Secret({
        buffer: otp.secret.buffer.slice(
          otp.secret.byteOffset,
          otp.secret.byteOffset + otp.secret.byteLength,
        ),
      }).base32,
      algorithm: algorithm,
      digits: digits,
      period: 30,
      counter: otp.counter ?? 0,
    });
  }
  return accounts;
};

export const getAccountsUriList = async (accounts: Accounts) => {
  const uriList: string[] = [];
  for (const account of accounts) {
    const OTP =
      account.type === "TOTP"
        ? new OTPAuth.TOTP(account)
        : new OTPAuth.HOTP(account);
    uriList.push(OTP.toString());
  }
  return uriList;
};

export const readFileContent = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error("File reading failed"));
      }
    };
    reader.onerror = () => {
      reject(new Error("File reading failed"));
    };
    reader.readAsText(file);
  });
};
