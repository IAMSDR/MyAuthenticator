import { kv } from "hub:kv";

export default defineWebAuthnRegisterEventHandler({
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
  validateUser: (user) => passkeyUser.parseAsync(user),
  async onSuccess(event, { user, credential }) {
    const db = useDrizzle();
    const isDeviceExists = await db.query.credentials.findFirst({
      where: eq(tables.credentials.displayName, user.displayName),
    });
    if (isDeviceExists) {
      throw createError({
        statusCode: 409,
        message: "Device already registered",
      });
    }
    await db.insert(tables.credentials).values({
      displayName: user.displayName,
      user: user.userName,
      id: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      backedUp: credential.backedUp,
      transports: credential.transports,
    });
  },
});
