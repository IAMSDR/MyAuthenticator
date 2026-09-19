import * as OTPAuth from "otpauth";
import { Payload, type Payload_OtpParameters } from "./proto/google";
import {
  findCachedIconMatch,
  getCachedIconSearch,
  setCachedIconSearch,
} from "./iconCache";
import { defaultIcon } from "./constants";
import {
  accountSchema,
  algorithmSchema,
  otpSchema,
  type Account,
  type Accounts,
} from "../types";

export interface SkippedAccount {
  line: number;
  label: string;
  reason: string;
  uri?: string;
}

export interface ExtractResult {
  accounts: Account[];
  skipped: SkippedAccount[];
}

export type ExtractProgressCallback = (progress: {
  current: number;
  total: number;
  account?: Account;
  skipped?: SkippedAccount;
}) => void | Promise<void>;

export const maskUriSecret = (uri: string): string => {
  return uri.replace(/([?&])secret=[^&]+/i, "$1secret=***");
};

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

export const extractAccountsFromUriList = async (
  uriList: string[],
  onProgress?: ExtractProgressCallback
): Promise<ExtractResult> => {
  const accounts: Account[] = [];
  const skipped: SkippedAccount[] = [];
  const total = uriList.length;

  for (let i = 0; i < uriList.length; i++) {
    const rawLine = uriList[i];
    const lineNum = i + 1;
    const trimmed = rawLine ? rawLine.trim() : "";

    // Skip blank lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    if (!trimmed.startsWith("otpauth://")) {
      const skippedItem: SkippedAccount = {
        line: lineNum,
        label: trimmed.slice(0, 30),
        reason: "Not an otpauth:// URI",
        uri: maskUriSecret(trimmed),
      };
      skipped.push(skippedItem);
      if (onProgress) {
        await onProgress({
          current: lineNum,
          total,
          skipped: skippedItem,
        });
      }
      continue;
    }

    // Lenient preprocessing for common authenticators' formatting variations
    const cleanUri = trimmed
      // Normalize sha-1, SHA-256, etc.
      .replace(/([?&]algorithm=)sha-?(\d+)/gi, "$1SHA$2")
      // Remove spaces, dashes, or pluses from secret parameter (handling URL encoding like %20)
      .replace(/([?&]secret=)([^&]+)/i, (_, prefix, val) => {
        try {
          return prefix + decodeURIComponent(val).replace(/[\s\-_+]/g, "");
        } catch {
          return prefix + val.replace(/[\s\-_+]/g, "");
        }
      });

    let otpObj: OTPAuth.HOTP | OTPAuth.TOTP;
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(cleanUri);
      otpObj = OTPAuth.URI.parse(cleanUri);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Malformed OTPAuth URI";
      const skippedItem: SkippedAccount = {
        line: lineNum,
        label: cleanUri.slice(0, 40),
        reason,
        uri: maskUriSecret(cleanUri),
      };
      skipped.push(skippedItem);
      if (onProgress) {
        await onProgress({
          current: lineNum,
          total,
          skipped: skippedItem,
        });
      }
      continue;
    }

    const periodStr = parsedUrl.searchParams.get("period") ?? "30";
    const counterStr = parsedUrl.searchParams.get("counter") ?? "0";
    const period = parseInt(periodStr, 10);
    const counter = parseInt(counterStr, 10);

    let alg: "SHA1" | "SHA256" | "SHA512" = "SHA1";
    const algParsed = algorithmSchema.safeParse(otpObj.algorithm?.toUpperCase());
    if (algParsed.success) {
      alg = algParsed.data;
    }

    const iconQuery = otpObj.issuer || otpObj.label || "";
    const icon = await matchIcon(iconQuery);

    const isHotp = otpObj instanceof OTPAuth.HOTP || cleanUri.startsWith("otpauth://hotp/");
    const candidate: Account = {
      type: isHotp ? otpSchema.enum.HOTP : otpSchema.enum.TOTP,
      issuer: otpObj.issuer || "",
      label: otpObj.label || "Unnamed",
      icon,
      secret: otpObj.secret?.base32 || "",
      algorithm: alg,
      digits: otpObj.digits,
      period: isNaN(period) ? 30 : period,
      counter: isNaN(counter) ? 0 : counter,
    };

    const validation = accountSchema.safeParse(candidate);
    if (!validation.success) {
      const reason = validation.error.issues.map((iss) => iss.message).join(", ") || "Validation failed";
      const skippedItem: SkippedAccount = {
        line: lineNum,
        label: candidate.label || candidate.issuer || `Line ${lineNum}`,
        reason,
        uri: maskUriSecret(cleanUri),
      };
      skipped.push(skippedItem);
      if (onProgress) {
        await onProgress({
          current: lineNum,
          total,
          skipped: skippedItem,
        });
      }
      continue;
    }

    accounts.push(validation.data);
    if (onProgress) {
      await onProgress({
        current: lineNum,
        total,
        account: validation.data,
      });
    }
  }

  return { accounts, skipped };
};

export const extractAccountsFromGoogleUri = async (uri: string) => {
  const url = new URL(uri);
  const data = url.searchParams.get("data");
  if (!data) return;
  let otpParameters: Payload_OtpParameters[];
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
          ? otpSchema.enum.HOTP
          : otpSchema.enum.TOTP
        : undefined;
    const algorithm = otp.algorithm
      ? {
          [-1]: undefined,
          0: undefined,
          1: algorithmSchema.enum.SHA1,
          2: algorithmSchema.enum.SHA256,
          3: algorithmSchema.enum.SHA512,
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
