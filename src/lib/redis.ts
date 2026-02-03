import Redis from 'ioredis'

const globalForRedis = global as unknown as { redis: Redis }

export const redis =
    globalForRedis.redis ||
    new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const data = await redis.get(key)
        if (data) return JSON.parse(data)
        return null
    } catch (error) {
        return null
    }
}

export async function setCache(key: string, data: any, ttlSeconds: number = 60) {
    try {
        await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds)
    } catch (error) {
        // Ignore cache errors
    }
}

export async function invalidateCache(pattern: string) {
    try {
        const keys = await redis.keys(pattern)
        if (keys.length > 0) await redis.del(keys)
    } catch (error) { }
}
