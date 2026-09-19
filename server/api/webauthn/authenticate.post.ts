export default defineWebAuthnAuthenticateEventHandler({
  async storeChallenge(event, challenge, attemptId) {
    const redis = await getRedis(event);
    await redis.set(challengeKey(attemptId), challenge, { ex: 60 });
  },
  async getChallenge(event, attemptId) {
    const redis = await getRedis(event);
    const challenge = await redis.getdel(challengeKey(attemptId));
    if (!challenge) {
      throw createError({
        statusCode: 400,
        message: "Challenge not found or expired",
      });
    }
    return challenge;
  },
  // @ts-expect-error simplewebauthn v13 PRF client extension typing
  async getOptions(event) {
    const redis = await getRedis(event);
    const prfSalt = await redis.get(redisKeys.prfSalt);
    if (prfSalt) {
      // NOTE: `first` MUST be a base64url string here, not an ArrayBuffer.
      // These options are serialized to JSON over HTTP; an ArrayBuffer would
      // become `{}` and browsers reject it with a TypeError
      // ("The provided value is not of type '(ArrayBuffer or ArrayBufferView)'").
      // The client decodes this back into bytes before calling WebAuthn.
      // See: https://w3c.github.io/webauthn/#dom-authenticationextensionsprfvaluesjson-first
      return {
        extensions: {
          prf: {
            eval: {
              first: toBase64URL(prfSalt),
            },
          },
        },
      };
    }
    return {};
  },
  // @ts-expect-error simplewebauthn AuthenticatorTransport typing
  async getCredential(event, credentialID) {
    const redis = await getRedis(event);
    const raw = await redis.hget(redisKeys.passkeys, credentialID);
    if (!raw) {
      throw createError({
        statusCode: 404,
        statusMessage: "Credential not found",
      });
    }
    const credential = JSON.parse(raw) as { id: string; publicKey: string; counter: number; backedUp: boolean; transports: unknown; displayName: string; user: string; createdAt: string };
    return credential as unknown as { id: string; publicKey: string; counter: number; backedUp: boolean; transports: unknown };
  },
  async onSuccess(event, { credential, authenticationInfo }: { credential?: { id?: string }; authenticationInfo?: { newCounter?: number } }) {
    if (credential?.id && authenticationInfo?.newCounter !== undefined) {
      const redis = await getRedis(event);
      const raw = await redis.hget(redisKeys.passkeys, credential.id);
      if (raw) {
        const passkey = JSON.parse(raw);
        passkey.counter = authenticationInfo.newCounter;
        await redis.hset(redisKeys.passkeys, credential.id, JSON.stringify(passkey));
      }
    }
    await setUserSession(event, { user: "ADMIN" });
    // Note: wrappedDEK fetch is done via GET /api/webauthn/wrap?credentialId=...
    // If no wrapper exists, client will show "Passkey has no decrypt wrapper, use password login"
  },
});
