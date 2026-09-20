import { base64URLStringToBuffer } from "@simplewebauthn/browser";

type PrfEvalInputs = { first?: unknown; second?: unknown; [key: string]: unknown };
type OptionsWithExtensions = {
  extensions?: { prf?: { eval?: PrfEvalInputs; [key: string]: unknown }; [key: string]: unknown };
  [key: string]: unknown;
};

// Coerce value to Uint8Array.
function toBytes(value: unknown): Uint8Array | undefined {
  if (value == null) return undefined;
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  // Some providers return base64url string instead of bytes.
  if (typeof value === "string") return base64URLStringToBuffer(value);
  return undefined;
}

// Normalize PRF extension: decode base64url `first`/`second` to Uint8Array for WebAuthn BufferSource.
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

// Extract PRF secret from clientExtensionResults.prf.results.first.
export function getPrfResultBytes(clientExtensionResults: unknown): Uint8Array | undefined {
  const results = (clientExtensionResults as { prf?: { results?: { first?: unknown } } } | undefined)
    ?.prf?.results;
  return toBytes(results?.first);
}
