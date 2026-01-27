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
