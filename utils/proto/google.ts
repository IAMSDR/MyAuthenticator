// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.178.0
//   protoc               v3.12.4
// source: https://github.com/dim13/otpauth/blob/master/migration/migration.proto

/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface Payload {
  otpParameters: Payload_OtpParameters[];
  version: number;
  batchSize: number;
  batchIndex: number;
  batchId: number;
}

export interface Payload_OtpParameters {
  secret: Uint8Array;
  name: string;
  issuer: string;
  algorithm: Payload_OtpParameters_Algorithm;
  digits: Payload_OtpParameters_DigitCount;
  type: Payload_OtpParameters_OtpType;
  counter: number;
}

export enum Payload_OtpParameters_Algorithm {
  ALGORITHM_UNSPECIFIED = 0,
  ALGORITHM_SHA1 = 1,
  ALGORITHM_SHA256 = 2,
  ALGORITHM_SHA512 = 3,
  ALGORITHM_MD5 = 4,
  UNRECOGNIZED = -1,
}

export function payload_OtpParameters_AlgorithmFromJSON(
  object: any
): Payload_OtpParameters_Algorithm {
  switch (object) {
    case 0:
    case "ALGORITHM_UNSPECIFIED":
      return Payload_OtpParameters_Algorithm.ALGORITHM_UNSPECIFIED;
    case 1:
    case "ALGORITHM_SHA1":
      return Payload_OtpParameters_Algorithm.ALGORITHM_SHA1;
    case 2:
    case "ALGORITHM_SHA256":
      return Payload_OtpParameters_Algorithm.ALGORITHM_SHA256;
    case 3:
    case "ALGORITHM_SHA512":
      return Payload_OtpParameters_Algorithm.ALGORITHM_SHA512;
    case 4:
    case "ALGORITHM_MD5":
      return Payload_OtpParameters_Algorithm.ALGORITHM_MD5;
    case -1:
    case "UNRECOGNIZED":
    default:
      return Payload_OtpParameters_Algorithm.UNRECOGNIZED;
  }
}

export function payload_OtpParameters_AlgorithmToJSON(
  object: Payload_OtpParameters_Algorithm
): string {
  switch (object) {
    case Payload_OtpParameters_Algorithm.ALGORITHM_UNSPECIFIED:
      return "ALGORITHM_UNSPECIFIED";
    case Payload_OtpParameters_Algorithm.ALGORITHM_SHA1:
      return "ALGORITHM_SHA1";
    case Payload_OtpParameters_Algorithm.ALGORITHM_SHA256:
      return "ALGORITHM_SHA256";
    case Payload_OtpParameters_Algorithm.ALGORITHM_SHA512:
      return "ALGORITHM_SHA512";
    case Payload_OtpParameters_Algorithm.ALGORITHM_MD5:
      return "ALGORITHM_MD5";
    case Payload_OtpParameters_Algorithm.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export enum Payload_OtpParameters_DigitCount {
  DIGIT_COUNT_UNSPECIFIED = 0,
  DIGIT_COUNT_SIX = 1,
  DIGIT_COUNT_EIGHT = 2,
  UNRECOGNIZED = -1,
}

export function payload_OtpParameters_DigitCountFromJSON(
  object: any
): Payload_OtpParameters_DigitCount {
  switch (object) {
    case 0:
    case "DIGIT_COUNT_UNSPECIFIED":
      return Payload_OtpParameters_DigitCount.DIGIT_COUNT_UNSPECIFIED;
    case 1:
    case "DIGIT_COUNT_SIX":
      return Payload_OtpParameters_DigitCount.DIGIT_COUNT_SIX;
    case 2:
    case "DIGIT_COUNT_EIGHT":
      return Payload_OtpParameters_DigitCount.DIGIT_COUNT_EIGHT;
    case -1:
    case "UNRECOGNIZED":
    default:
      return Payload_OtpParameters_DigitCount.UNRECOGNIZED;
  }
}

export function payload_OtpParameters_DigitCountToJSON(
  object: Payload_OtpParameters_DigitCount
): string {
  switch (object) {
    case Payload_OtpParameters_DigitCount.DIGIT_COUNT_UNSPECIFIED:
      return "DIGIT_COUNT_UNSPECIFIED";
    case Payload_OtpParameters_DigitCount.DIGIT_COUNT_SIX:
      return "DIGIT_COUNT_SIX";
    case Payload_OtpParameters_DigitCount.DIGIT_COUNT_EIGHT:
      return "DIGIT_COUNT_EIGHT";
    case Payload_OtpParameters_DigitCount.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export enum Payload_OtpParameters_OtpType {
  OTP_TYPE_UNSPECIFIED = 0,
  OTP_TYPE_HOTP = 1,
  OTP_TYPE_TOTP = 2,
  UNRECOGNIZED = -1,
}

export function payload_OtpParameters_OtpTypeFromJSON(
  object: any
): Payload_OtpParameters_OtpType {
  switch (object) {
    case 0:
    case "OTP_TYPE_UNSPECIFIED":
      return Payload_OtpParameters_OtpType.OTP_TYPE_UNSPECIFIED;
    case 1:
    case "OTP_TYPE_HOTP":
      return Payload_OtpParameters_OtpType.OTP_TYPE_HOTP;
    case 2:
    case "OTP_TYPE_TOTP":
      return Payload_OtpParameters_OtpType.OTP_TYPE_TOTP;
    case -1:
    case "UNRECOGNIZED":
    default:
      return Payload_OtpParameters_OtpType.UNRECOGNIZED;
  }
}

export function payload_OtpParameters_OtpTypeToJSON(
  object: Payload_OtpParameters_OtpType
): string {
  switch (object) {
    case Payload_OtpParameters_OtpType.OTP_TYPE_UNSPECIFIED:
      return "OTP_TYPE_UNSPECIFIED";
    case Payload_OtpParameters_OtpType.OTP_TYPE_HOTP:
      return "OTP_TYPE_HOTP";
    case Payload_OtpParameters_OtpType.OTP_TYPE_TOTP:
      return "OTP_TYPE_TOTP";
    case Payload_OtpParameters_OtpType.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

function createBasePayload(): Payload {
  return {
    otpParameters: [],
    version: 0,
    batchSize: 0,
    batchIndex: 0,
    batchId: 0,
  };
}

export const Payload = {
  encode(
    message: Payload,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.otpParameters) {
      Payload_OtpParameters.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.version !== 0) {
      writer.uint32(16).int32(message.version);
    }
    if (message.batchSize !== 0) {
      writer.uint32(24).int32(message.batchSize);
    }
    if (message.batchIndex !== 0) {
      writer.uint32(32).int32(message.batchIndex);
    }
    if (message.batchId !== 0) {
      writer.uint32(40).int32(message.batchId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Payload {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePayload();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.otpParameters.push(
            Payload_OtpParameters.decode(reader, reader.uint32())
          );
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.version = reader.int32();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.batchSize = reader.int32();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.batchIndex = reader.int32();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.batchId = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Payload {
    return {
      otpParameters: globalThis.Array.isArray(object?.otpParameters)
        ? object.otpParameters.map((e: any) =>
            Payload_OtpParameters.fromJSON(e)
          )
        : [],
      version: isSet(object.version) ? globalThis.Number(object.version) : 0,
      batchSize: isSet(object.batchSize)
        ? globalThis.Number(object.batchSize)
        : 0,
      batchIndex: isSet(object.batchIndex)
        ? globalThis.Number(object.batchIndex)
        : 0,
      batchId: isSet(object.batchId) ? globalThis.Number(object.batchId) : 0,
    };
  },

  toJSON(message: Payload): unknown {
    const obj: any = {};
    if (message.otpParameters?.length) {
      obj.otpParameters = message.otpParameters.map((e) =>
        Payload_OtpParameters.toJSON(e)
      );
    }
    if (message.version !== 0) {
      obj.version = Math.round(message.version);
    }
    if (message.batchSize !== 0) {
      obj.batchSize = Math.round(message.batchSize);
    }
    if (message.batchIndex !== 0) {
      obj.batchIndex = Math.round(message.batchIndex);
    }
    if (message.batchId !== 0) {
      obj.batchId = Math.round(message.batchId);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Payload>, I>>(base?: I): Payload {
    return Payload.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Payload>, I>>(object: I): Payload {
    const message = createBasePayload();
    message.otpParameters =
      object.otpParameters?.map((e) => Payload_OtpParameters.fromPartial(e)) ||
      [];
    message.version = object.version ?? 0;
    message.batchSize = object.batchSize ?? 0;
    message.batchIndex = object.batchIndex ?? 0;
    message.batchId = object.batchId ?? 0;
    return message;
  },
};

function createBasePayload_OtpParameters(): Payload_OtpParameters {
  return {
    secret: new Uint8Array(0),
    name: "",
    issuer: "",
    algorithm: 0,
    digits: 0,
    type: 0,
    counter: 0,
  };
}

export const Payload_OtpParameters = {
  encode(
    message: Payload_OtpParameters,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.secret.length !== 0) {
      writer.uint32(10).bytes(message.secret);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.issuer !== "") {
      writer.uint32(26).string(message.issuer);
    }
    if (message.algorithm !== 0) {
      writer.uint32(32).int32(message.algorithm);
    }
    if (message.digits !== 0) {
      writer.uint32(40).int32(message.digits);
    }
    if (message.type !== 0) {
      writer.uint32(48).int32(message.type);
    }
    if (message.counter !== 0) {
      writer.uint32(56).uint64(message.counter);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): Payload_OtpParameters {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePayload_OtpParameters();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.secret = reader.bytes();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.issuer = reader.string();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.algorithm = reader.int32() as any;
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.digits = reader.int32() as any;
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.type = reader.int32() as any;
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.counter = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Payload_OtpParameters {
    return {
      secret: isSet(object.secret)
        ? bytesFromBase64(object.secret)
        : new Uint8Array(0),
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      issuer: isSet(object.issuer) ? globalThis.String(object.issuer) : "",
      algorithm: isSet(object.algorithm)
        ? payload_OtpParameters_AlgorithmFromJSON(object.algorithm)
        : 0,
      digits: isSet(object.digits)
        ? payload_OtpParameters_DigitCountFromJSON(object.digits)
        : 0,
      type: isSet(object.type)
        ? payload_OtpParameters_OtpTypeFromJSON(object.type)
        : 0,
      counter: isSet(object.counter) ? globalThis.Number(object.counter) : 0,
    };
  },

  toJSON(message: Payload_OtpParameters): unknown {
    const obj: any = {};
    if (message.secret.length !== 0) {
      obj.secret = base64FromBytes(message.secret);
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.issuer !== "") {
      obj.issuer = message.issuer;
    }
    if (message.algorithm !== 0) {
      obj.algorithm = payload_OtpParameters_AlgorithmToJSON(message.algorithm);
    }
    if (message.digits !== 0) {
      obj.digits = payload_OtpParameters_DigitCountToJSON(message.digits);
    }
    if (message.type !== 0) {
      obj.type = payload_OtpParameters_OtpTypeToJSON(message.type);
    }
    if (message.counter !== 0) {
      obj.counter = Math.round(message.counter);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Payload_OtpParameters>, I>>(
    base?: I
  ): Payload_OtpParameters {
    return Payload_OtpParameters.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Payload_OtpParameters>, I>>(
    object: I
  ): Payload_OtpParameters {
    const message = createBasePayload_OtpParameters();
    message.secret = object.secret ?? new Uint8Array(0);
    message.name = object.name ?? "";
    message.issuer = object.issuer ?? "";
    message.algorithm = object.algorithm ?? 0;
    message.digits = object.digits ?? 0;
    message.type = object.type ?? 0;
    message.counter = object.counter ?? 0;
    return message;
  },
};

function bytesFromBase64(b64: string): Uint8Array {
  if ((globalThis as any).Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if ((globalThis as any).Buffer) {
    return globalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(globalThis.String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(""));
  }
}

type Builtin =
  | Date
  | Function
  | Uint8Array
  | string
  | number
  | boolean
  | undefined;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends globalThis.Array<infer U>
  ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & {
      [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
    };

function longToNumber(long: Long): number {
  if (long.gt(globalThis.Number.MAX_SAFE_INTEGER)) {
    throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  if (long.lt(globalThis.Number.MIN_SAFE_INTEGER)) {
    throw new globalThis.Error("Value is smaller than Number.MIN_SAFE_INTEGER");
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
