import { kv } from "hub:kv";

export default defineWebAuthnAuthenticateEventHandler({
  async storeChallenge(event, challenge, attemptId) {
    await kv.set(`auth:challenge:${attemptId}`, challenge, { ttl: 60 });
  },
  async getChallenge(event, attemptId) {
    const challenge = await kv.get<string>(`auth:challenge:${attemptId}`);
    if (!challenge) {
      throw createError({
        statusCode: 400,
        message: "Challenge not found or expired",
      });
    }
    await kv.del(`auth:challenge:${attemptId}`);
    return challenge;
  },
  async getCredential(event, credentialID) {
    const credential = await useDrizzle().query.credentials.findFirst({
      where: eq(tables.credentials.id, credentialID),
    });
    if (!credential) {
      throw createError({
        statusCode: 404,
        statusMessage: "Credential not found",
      });
    }
    return credential;
  },
  async onSuccess(event, { credential }) {
    await setUserSession(event, {
      user: "ADMIN",
    });
  },
});
