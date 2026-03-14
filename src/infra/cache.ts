import { getRedisClient } from "./redis";

const TEN_MINUTES = 600;
const ONE_WEEK = 604800;

/**
 * Cache-aside: returns cached value if present, otherwise calls fetchFn,
 * caches the result, and returns it.
 */
export async function cacheGet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number): Promise<T> {
	const redis = getRedisClient();
	const cached = await redis.get(key);

	if (cached) {
		return JSON.parse(cached) as T;
	}

	const data = await fetchFn();
	await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
	return data;
}

/**
 * Determines TTL based on whether the date range includes "today".
 * Past-only ranges get a long TTL; ranges touching the present get a short one.
 */
export function chooseTTL(filterEnd?: Date): number {
	if (!filterEnd) return TEN_MINUTES;

	const now = new Date();
	const endOfDay = new Date(filterEnd);
	endOfDay.setHours(23, 59, 59, 999);

	return endOfDay >= now ? TEN_MINUTES : ONE_WEEK;
}

/**
 * Invalidates all cache keys matching a pattern (e.g. "metrics:*:userId:type:*").
 * Uses SCAN to avoid blocking Redis.
 */
export async function invalidateByPattern(pattern: string): Promise<void> {
	const redis = getRedisClient();
	let cursor = "0";

	do {
		const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
		cursor = nextCursor;
		if (keys.length > 0) {
			await redis.del(...keys);
		}
	} while (cursor !== "0");
}
