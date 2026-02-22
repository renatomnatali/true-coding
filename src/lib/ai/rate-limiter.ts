/**
 * Token-bucket rate limiter with a sliding window of 60s.
 * Tracks output tokens per minute and applies backoff when approaching the limit.
 */

export interface RateLimiterOptions {
  /** Maximum output tokens per minute (default: 8000) */
  maxOutputTokensPerMinute?: number
  /** Sliding window size in ms (default: 60_000) */
  windowMs?: number
}

interface TokenRecord {
  tokens: number
  timestamp: number
}

export class OutputTokenRateLimiter {
  private readonly maxTokens: number
  private readonly windowMs: number
  private readonly records: TokenRecord[] = []

  constructor(options: RateLimiterOptions = {}) {
    this.maxTokens = options.maxOutputTokensPerMinute ?? 8_000
    this.windowMs = options.windowMs ?? 60_000
  }

  private pruneExpired(now: number): void {
    const cutoff = now - this.windowMs
    while (this.records.length > 0 && this.records[0].timestamp < cutoff) {
      this.records.shift()
    }
  }

  /** Returns the total output tokens consumed in the current window. */
  getUsedTokens(now = Date.now()): number {
    this.pruneExpired(now)
    return this.records.reduce((sum, r) => sum + r.tokens, 0)
  }

  /** Returns the remaining output token budget in the current window. */
  getRemainingTokens(now = Date.now()): number {
    return Math.max(0, this.maxTokens - this.getUsedTokens(now))
  }

  /** Records output tokens consumed by a completed call. */
  recordUsage(tokens: number, now = Date.now()): void {
    this.records.push({ tokens, timestamp: now })
  }

  /**
   * Returns the number of milliseconds to wait before the next call
   * can safely consume `requiredTokens` without exceeding the limit.
   * Returns 0 if there is enough budget right now.
   */
  getWaitMs(requiredTokens: number, now = Date.now()): number {
    this.pruneExpired(now)

    const used = this.getUsedTokens(now)
    if (used + requiredTokens <= this.maxTokens) {
      return 0
    }

    // Find the earliest record whose expiry would free enough budget
    let freed = 0
    for (const record of this.records) {
      freed += record.tokens
      if (used - freed + requiredTokens <= this.maxTokens) {
        const waitUntil = record.timestamp + this.windowMs
        return Math.max(0, waitUntil - now)
      }
    }

    // Shouldn't happen if requiredTokens <= maxTokens, but be safe
    return this.windowMs
  }

  /**
   * Waits until there is enough budget, then returns.
   * Use before each LLM call to stay within rate limits.
   */
  async waitForCapacity(requiredTokens: number): Promise<void> {
    const waitMs = this.getWaitMs(requiredTokens)
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
  }
}
