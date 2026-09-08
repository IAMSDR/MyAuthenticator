import * as OTPAuth from "otpauth";
import { Payload, type Payload_OtpParameters } from "./proto/google";
import {
  findCachedIconMatch,
  getCachedIconSearch,
  setCachedIconSearch,
} from "./iconCache";

const toIconEntry = (icon: string) => {
  const parts = icon.split(":");
  const collection = parts[0];
  const name = parts[1] || "";
  return {
    label: name.replace(/[-_]/g, " "),
    description: collection,
    icon: `i-${collection}-${name}`,
  };
};

export const getIcons = async (query: string) => {
  const clean = query?.trim();
  if (!clean) return [];

  // Offline: no server call — immediately serve IDB/default fallback.
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const cached = await getCachedIconSearch(clean);
    if (cached?.length) return cached;
    return [{ label: clean, icon: defaultIcon }];
  }

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
      // Remember the fallback too so offline searches stay consistent.
      const fallback = [{ label: clean, icon: defaultIcon }];
      await setCachedIconSearch(clean, fallback);
      return fallback;
    }

    const mapped = res.icons.map(toIconEntry);
    // Cache for offline use (previously searched/used icons resolve from IDB).
    await setCachedIconSearch(clean, mapped);
    return mapped;
  } catch {
    // Fetch failure: serve previously cached results for this query when available.
    const cached = await getCachedIconSearch(clean);
    if (cached?.length) return cached;
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

  // Offline: no server call — resolve from IDB directly.
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const cached = await findCachedIconMatch(icon);
    if (cached) return cached;
    return defaultIcon;
  }

  try {
    const res = await $fetch<{ icons: string[] }>(
      "https://api.iconify.design/search",
      {
        query: {
          query: icon,
          collection: "simple-icons",
          limit: 32,
        },
      },
    );

    if (res.icons && res.icons.length > 0) {
      const match =
        res.icons.find((i) => i.startsWith("simple-icons:")) || res.icons[0];
      if (match) {
        const entry = toIconEntry(match);
        await setCachedIconSearch(icon, [entry]);
        return entry.icon;
      }
    }
  } catch {
    // Fetch failure: resolve from previously cached icons.
    const cached = await findCachedIconMatch(icon);
    if (cached) return cached;
    return defaultIcon;
  }

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
