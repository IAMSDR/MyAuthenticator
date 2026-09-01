export default class IORedisMock {
  constructor() {
    throw new Error("ioredis is not available on Cloudflare Workers. Use UPSTASH_REDIS_REST_URL + TOKEN instead.");
  }
}
