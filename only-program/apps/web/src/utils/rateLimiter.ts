/**
 * Client-Side Rate Limiter
 * Prevents spam and abuse of admin operations
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  /**
   * Check if action is allowed
   */
  check(
    key: string,
    config: RateLimitConfig,
  ): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No entry or window expired
    if (!entry || now >= entry.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return { allowed: true };
    }

    // Within window, check count
    if (entry.count < config.maxAttempts) {
      entry.count++;
      return { allowed: true };
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Predefined rate limits for common operations
export const RATE_LIMITS = {
  IMAGE_UPLOAD: { maxAttempts: 10, windowMs: 60000 }, // 10 uploads per minute
  COUPON_CREATE: { maxAttempts: 20, windowMs: 60000 }, // 20 coupons per minute
  USER_PROMOTE: { maxAttempts: 5, windowMs: 60000 }, // 5 promotions per minute
  CMS_SAVE: { maxAttempts: 30, windowMs: 60000 }, // 30 saves per minute
  MEDIA_DELETE: { maxAttempts: 20, windowMs: 60000 }, // 20 deletions per minute
};

/**
 * Check if action is rate limited
 */
export function checkRateLimit(
  action: keyof typeof RATE_LIMITS,
  userId?: string,
): { allowed: boolean; retryAfter?: number } {
  const key = userId ? `${action}:${userId}` : action;
  return rateLimiter.check(key, RATE_LIMITS[action]);
}

/**
 * Reset rate limit for an action
 */
export function resetRateLimit(
  action: keyof typeof RATE_LIMITS,
  userId?: string,
): void {
  const key = userId ? `${action}:${userId}` : action;
  rateLimiter.reset(key);
}

/**
 * Higher-order function to wrap async functions with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  action: keyof typeof RATE_LIMITS,
  getUserId?: () => string | undefined,
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const userId = getUserId?.();
    const { allowed, retryAfter } = checkRateLimit(action, userId);

    if (!allowed) {
      throw new Error(
        `Demasiados intentos. Por favor espera ${retryAfter} segundos antes de intentar de nuevo.`,
      );
    }

    return fn(...args);
  }) as T;
}
