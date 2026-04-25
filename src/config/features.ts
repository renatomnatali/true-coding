/**
 * Feature Flags Configuration
 *
 * Controls gradual rollout of features and allows instant rollback.
 * Based on TBD principle: features > 2 days development require flags.
 */

export const FEATURES = {
  /**
   * Structured Discovery Flow (ADR-0001)
   *
   * When enabled: Users go through 5 mandatory questions
   * When disabled: Free-form conversation (original behavior)
   *
   * Rollout plan:
   * - Phase 1: 10% of users (beta testers)
   * - Phase 2: 50% of users (if completion rate > 70%)
   * - Phase 3: 100% of users (if no major issues)
   *
   * Rollback: Set to false to revert all users to V1
   */
  STRUCTURED_DISCOVERY:
    process.env.NEXT_PUBLIC_FEATURE_STRUCTURED_DISCOVERY === 'true',

  /**
   * Quick Reply Buttons
   *
   * Contextual suggestions for each discovery question.
   * Can be disabled independently of structured flow.
   */
  QUICK_REPLIES: process.env.NEXT_PUBLIC_FEATURE_QUICK_REPLIES !== 'false', // default true

  /**
   * Live Progress Tracking
   *
   * Shows "Pergunta X de 5" indicator in chat header.
   * Only relevant when STRUCTURED_DISCOVERY is enabled.
   */
  PROGRESS_TRACKING:
    process.env.NEXT_PUBLIC_FEATURE_PROGRESS_TRACKING !== 'false', // default true

  /**
   * Autonomous Development V1
   *
   * Enables the asynchronous multi-agent development run pipeline.
   * Rollout should be progressive (canary) and monitored.
   */
  AUTONOMOUS_DEVELOPMENT_V1:
    process.env.NEXT_PUBLIC_FEATURE_AUTONOMOUS_DEVELOPMENT_V1 !== 'false',

  /**
   * Execution Chat Feed
   *
   * Enables the "Execução" tab in ChatPanel with real-time
   * run events (SSE) and verbosity filters.
   */
  EXECUTION_CHAT_FEED:
    process.env.NEXT_PUBLIC_FEATURE_EXECUTION_CHAT_FEED !== 'false',

  /**
   * Pipeline V2 (File-by-File Generation)
   *
   * When enabled: CodeAgent generates files one-by-one using file-generator
   * When disabled: CodeAgent uses single-shot generation (legacy)
   *
   * Benefits: Avoids truncation, respects rate limits, uses prompt caching
   */
  PIPELINE_V2: process.env.PIPELINE_V2 === 'true',
} as const

/**
 * Type-safe feature flag checker
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature]
}

/**
 * Get feature flag for logging/analytics
 */
export function getFeatureFlags(): Record<string, boolean> {
  return { ...FEATURES }
}
