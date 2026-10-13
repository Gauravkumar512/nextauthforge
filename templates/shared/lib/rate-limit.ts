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
    for (const [key, times] of hits) {
      if (times.length === 0 || now - times[times.length - 1] >= windowMs) hits.delete(key);
    }
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

// Kept on globalThis so dev hot reloads don't reset the counters.
const globalForLimiters = globalThis as typeof globalThis & {
  _authRateLimiters?: Record<keyof typeof authConfig.rateLimit, RateLimiter>;
};

export const limiters = (globalForLimiters._authRateLimiters ??= {
  login: createMemoryRateLimiter(authConfig.rateLimit.login),
  loginIp: createMemoryRateLimiter(authConfig.rateLimit.loginIp),
  signup: createMemoryRateLimiter(authConfig.rateLimit.signup),
  refresh: createMemoryRateLimiter(authConfig.rateLimit.refresh),
});

export function tooManyRequests(result: RateLimitResult): Response {
  return new Response(JSON.stringify({ error: "Too many requests, please try again later" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(result.retryAfterSeconds),
    },
  });
}
