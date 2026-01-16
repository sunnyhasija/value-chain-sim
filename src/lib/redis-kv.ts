import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;

async function getClient(): Promise<RedisClient> {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
    });
    client.on('error', (error) => {
      console.error('Redis client error:', error);
    });
  }

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

function serialize(value: unknown): string {
  return JSON.stringify(value);
}

function deserialize<T>(value: string | null): T | null {
  if (value === null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

export const redisKv = {
  async get<T>(key: string): Promise<T | null> {
    const redis = await getClient();
    const value = await redis.get(key);
    return deserialize<T>(value);
  },
  async set(key: string, value: unknown): Promise<void> {
    const redis = await getClient();
    await redis.set(key, serialize(value));
  },
  async sadd(key: string, member: string): Promise<number> {
    const redis = await getClient();
    return await redis.sAdd(key, member);
  },
  async smembers(key: string): Promise<string[]> {
    const redis = await getClient();
    return await redis.sMembers(key);
  },
  async rpush(key: string, member: string): Promise<number> {
    const redis = await getClient();
    return await redis.rPush(key, member);
  },
  async lrange(key: string, start: number, end: number): Promise<string[]> {
    const redis = await getClient();
    return await redis.lRange(key, start, end);
  },
};
