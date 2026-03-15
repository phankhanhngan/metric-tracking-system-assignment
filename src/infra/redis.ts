import Redis from "ioredis";
import { env } from "@/common/utils/envConfig";

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return client;
}

export async function connectRedis(): Promise<void> {
  const redis = getRedisClient();
  await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
