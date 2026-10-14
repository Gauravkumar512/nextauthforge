import { authConfig } from "./auth-config";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  /** Counts one attempt for `key` and says whether it is allowed. */
  check(key: string): Promise<RateLimitResult>;
  /** Forgets `key` (e.g. after a successful login). */
  reset(key: string): Promise<void>;
}

/**
 * Sliding-window limiter held in process memory.
 *
 * NOTE: state is per server instance. With several instances or serverless
 * functions each one counts separately, so swap this for a shared store
 * (Redis / Upstash) by implementing `RateLimiter` against it.
 */
export function createMemoryRateLimiter(options: {
  limit: number;
  windowSeconds: number;
}): RateLimiter {
  const windowMs = options.windowSeconds * 1000;
  const hits = new Map<string, number[]>();

  function prune(now: number) {
    // forEach (not for...of): Next 13/14 projects compile with target ES5.
    hits.forEach((times, key) => {
      if (times.length === 0 || now - times[times.length - 1] >= windowMs) hits.delete(key);
    });
  }

  return {
    async check(key) {
      const now = Date.now();
      if (hits.size > 10_000) prune(now);

      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= options.limit) {
        hits.set(key, recent);
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)),
        };
      }
      recent.push(now);
      hits.set(key, recent);
      return { allowed: true, retryAfterSeconds: 0 };
    },
    async reset(key) {
      hits.delete(key);
    },
  };
}

type LimiterName = keyof typeof authConfig.rateLimit;

function createLimiters(): Record<LimiterName, RateLimiter> {
  return Object.fromEntries(
    Object.entries(authConfig.rateLimit).map(([name, options]) => [
      name,
      createMemoryRateLimiter(options),
    ])
  ) as Record<LimiterName, RateLimiter>;
}

// Kept on globalThis so dev hot reloads don't reset the counters (limiters
// added to the config later are created next to the existing ones).
const globalForLimiters = globalThis as typeof globalThis & {
  _authRateLimiters?: Partial<Record<LimiterName, RateLimiter>>;
};

export const limiters: Record<LimiterName, RateLimiter> = (globalForLimiters._authRateLimiters = {
  ...createLimiters(),
  ...globalForLimiters._authRateLimiters,
}) as Record<LimiterName, RateLimiter>;

export function tooManyRequests(result: RateLimitResult): Response {
  return new Response(JSON.stringify({ error: "Too many requests, please try again later" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(result.retryAfterSeconds),
    },
  });
}
