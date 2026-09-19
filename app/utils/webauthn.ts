import { base64URLStringToBuffer } from "@simplewebauthn/browser";

type PrfEvalInputs = { first?: unknown; second?: unknown; [key: string]: unknown };
type OptionsWithExtensions = {
  extensions?: { prf?: { eval?: PrfEvalInputs; [key: string]: unknown }; [key: string]: unknown };
  [key: string]: unknown;
};

/** Coerce a value that should represent bytes into a Uint8Array. */
function toBytes(value: unknown): Uint8Array | undefined {
  if (value == null) return undefined;
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  // Defensive: some passkey providers may hand back a base64url string.
  if (typeof value === "string") return base64URLStringToBuffer(value);
  return undefined;
}

/**
 * WebAuthn JSON options must carry binary extension values as base64url strings
 * (`AuthenticationExtensionsPRFValuesJSON.first`). However, `@simplewebauthn/browser`'s
 * `startRegistration`/`startAuthentication` spread `extensions` through untouched,
 * so it reaches `navigator.credentials.create()/get()` exactly as received.
 *
 * The WebAuthn API requires `prf.eval.first` to be a BufferSource, so we decode the
 * base64url string back into a Uint8Array here.
 *
 * Also tolerates options that already contain a BufferSource, so it is safe to call
 * regardless of how the server serialized the salt.
 */
export function normalizePrfExtension<T extends OptionsWithExtensions | undefined>(options: T): T {
  if (!options) return options;
  const prf = options.extensions?.prf;
  const evalValues = prf?.eval;
  if (!prf || !evalValues) return options;

  const first = toBytes(evalValues.first);
  const second = toBytes(evalValues.second);

  return {
    ...options,
    extensions: {
      ...options.extensions,
      prf: {
        ...prf,
        eval: {
          ...evalValues,
          ...(first ? { first } : {}),
          ...(second ? { second } : {}),
        },
      },
    },
  } as T;
}

/**
 * Extract the raw PRF secret returned by the authenticator from
 * `clientExtensionResults.prf.results.first`, tolerant of the different
 * shapes a platform/browser extension may return.
 */
export function getPrfResultBytes(clientExtensionResults: unknown): Uint8Array | undefined {
  const results = (clientExtensionResults as { prf?: { results?: { first?: unknown } } } | undefined)
    ?.prf?.results;
  return toBytes(results?.first);
}
