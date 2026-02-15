interface EnvLike {
  [key: string]: string | undefined
}

export function isBabyStepModeEnabledFromEnv(env: EnvLike): boolean {
  return env.AUTONOMOUS_DEV_BABY_STEPS === 'true'
}

export function shouldPauseForBabyStepCheckpoint(input: {
  babyStepModeEnabled: boolean
  attempt: number
  maxAttempts: number
}): boolean {
  if (!input.babyStepModeEnabled) return false
  if (input.attempt <= 0) return false
  return input.attempt < input.maxAttempts
}
