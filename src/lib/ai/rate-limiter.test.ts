import { describe, it, expect, vi, afterEach } from 'vitest'
import { OutputTokenRateLimiter } from './rate-limiter'

describe('OutputTokenRateLimiter', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with full budget', () => {
    const limiter = new OutputTokenRateLimiter({ maxOutputTokensPerMinute: 8000 })
    expect(limiter.getRemainingTokens()).toBe(8000)
    expect(limiter.getUsedTokens()).toBe(0)
  })

  it('tracks recorded usage', () => {
    const limiter = new OutputTokenRateLimiter({ maxOutputTokensPerMinute: 8000 })
    const now = Date.now()

    limiter.recordUsage(3000, now)
    expect(limiter.getUsedTokens(now)).toBe(3000)
    expect(limiter.getRemainingTokens(now)).toBe(5000)
  })

  it('prunes expired records outside the window', () => {
    const limiter = new OutputTokenRateLimiter({
      maxOutputTokensPerMinute: 8000,
      windowMs: 60_000,
    })
    const now = Date.now()

    limiter.recordUsage(5000, now - 70_000) // 70s ago — expired
    limiter.recordUsage(2000, now - 10_000) // 10s ago — still valid

    expect(limiter.getUsedTokens(now)).toBe(2000)
    expect(limiter.getRemainingTokens(now)).toBe(6000)
  })

  it('returns 0 wait when budget is sufficient', () => {
    const limiter = new OutputTokenRateLimiter({ maxOutputTokensPerMinute: 8000 })
    const now = Date.now()

    limiter.recordUsage(3000, now)
    expect(limiter.getWaitMs(4000, now)).toBe(0)
  })

  it('returns positive wait when budget is insufficient', () => {
    const limiter = new OutputTokenRateLimiter({
      maxOutputTokensPerMinute: 8000,
      windowMs: 60_000,
    })
    const now = Date.now()

    limiter.recordUsage(5000, now - 30_000) // 30s ago
    limiter.recordUsage(2000, now - 10_000) // 10s ago

    // Used = 7000, need 2000 => over by 1000
    // Oldest record (5000 at -30s) expires at now+30s => frees 5000
    const waitMs = limiter.getWaitMs(2000, now)
    expect(waitMs).toBeGreaterThan(0)
    expect(waitMs).toBeLessThanOrEqual(30_000)
  })

  it('waitForCapacity resolves immediately when there is budget', async () => {
    const limiter = new OutputTokenRateLimiter({ maxOutputTokensPerMinute: 8000 })
    const start = Date.now()
    await limiter.waitForCapacity(1000)
    expect(Date.now() - start).toBeLessThan(50)
  })

  it('waitForCapacity delays when budget is exhausted', async () => {
    const limiter = new OutputTokenRateLimiter({
      maxOutputTokensPerMinute: 100,
      windowMs: 200,
    })
    const now = Date.now()

    limiter.recordUsage(100, now) // fully consumed

    const start = Date.now()
    await limiter.waitForCapacity(50)
    expect(Date.now() - start).toBeGreaterThanOrEqual(150)
  })

  it('accumulates multiple records correctly', () => {
    const limiter = new OutputTokenRateLimiter({ maxOutputTokensPerMinute: 8000 })
    const now = Date.now()

    limiter.recordUsage(1000, now)
    limiter.recordUsage(2000, now)
    limiter.recordUsage(3000, now)

    expect(limiter.getUsedTokens(now)).toBe(6000)
    expect(limiter.getRemainingTokens(now)).toBe(2000)
  })

  it('getRemainingTokens never returns negative', () => {
    const limiter = new OutputTokenRateLimiter({ maxOutputTokensPerMinute: 100 })
    const now = Date.now()

    limiter.recordUsage(200, now) // over budget
    expect(limiter.getRemainingTokens(now)).toBe(0)
  })
})
