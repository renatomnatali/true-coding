import { describe, expect, it } from 'vitest'
import { isDeterministicGateFailure } from './retry-classification'

describe('isDeterministicGateFailure', () => {
  it('returns true when summaries are identical', () => {
    const summary = "BUILD (Cannot find module '@/lib/foo')"
    expect(isDeterministicGateFailure(summary, summary)).toBe(true)
  })

  it('returns false when summaries differ', () => {
    expect(
      isDeterministicGateFailure(
        "BUILD (Cannot find module '@/lib/foo')",
        "BUILD (Cannot find module '@/lib/bar')"
      )
    ).toBe(false)
  })

  it('returns false when previousSummary is null (first attempt)', () => {
    expect(isDeterministicGateFailure('BUILD (error)', null)).toBe(false)
  })

  it('returns true when summaries differ only in whitespace', () => {
    expect(
      isDeterministicGateFailure(
        "BUILD  (Cannot find   module '@/lib/foo')",
        "BUILD (Cannot find module '@/lib/foo')"
      )
    ).toBe(true)
  })

  it('returns true when summaries have different leading/trailing whitespace', () => {
    expect(
      isDeterministicGateFailure(
        "  BUILD (error)  ",
        "BUILD (error)"
      )
    ).toBe(true)
  })

  it('returns false when currentSummary is empty', () => {
    expect(isDeterministicGateFailure('', 'BUILD (error)')).toBe(false)
  })

  it('returns false when previousSummary is empty', () => {
    expect(isDeterministicGateFailure('BUILD (error)', '')).toBe(false)
  })

  it('returns false when both summaries are empty', () => {
    expect(isDeterministicGateFailure('', '')).toBe(false)
  })

  it('returns false when both summaries are whitespace-only', () => {
    expect(isDeterministicGateFailure('   ', '  ')).toBe(false)
  })
})
