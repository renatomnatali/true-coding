import { describe, expect, it } from 'vitest'
import {
  isBabyStepModeEnabledFromEnv,
  shouldPauseForBabyStepCheckpoint,
} from './retry-strategy'

describe('isBabyStepModeEnabledFromEnv', () => {
  it('returns true only when AUTONOMOUS_DEV_BABY_STEPS is "true"', () => {
    expect(isBabyStepModeEnabledFromEnv({ AUTONOMOUS_DEV_BABY_STEPS: 'true' })).toBe(true)
    expect(isBabyStepModeEnabledFromEnv({ AUTONOMOUS_DEV_BABY_STEPS: 'false' })).toBe(false)
    expect(isBabyStepModeEnabledFromEnv({})).toBe(false)
  })
})

describe('shouldPauseForBabyStepCheckpoint', () => {
  it('pauses on first failed attempt when baby-step mode is enabled', () => {
    expect(
      shouldPauseForBabyStepCheckpoint({
        babyStepModeEnabled: true,
        attempt: 1,
        maxAttempts: 3,
      })
    ).toBe(true)
  })

  it('does not pause when baby-step mode is disabled', () => {
    expect(
      shouldPauseForBabyStepCheckpoint({
        babyStepModeEnabled: false,
        attempt: 1,
        maxAttempts: 3,
      })
    ).toBe(false)
  })

  it('does not pause on last automatic attempt boundary', () => {
    expect(
      shouldPauseForBabyStepCheckpoint({
        babyStepModeEnabled: true,
        attempt: 3,
        maxAttempts: 3,
      })
    ).toBe(false)
  })
})
