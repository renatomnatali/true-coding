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
   * Pipeline V2 (File-by-File Generation)
   *
   * When enabled: CodeAgent generates files one-by-one using file-generator
   * When disabled: CodeAgent uses single-shot generation (legacy)
   *
   * Benefits: Avoids truncation, respects rate limits, uses prompt caching
   */
  PIPELINE_V2: process.env.PIPELINE_V2 === 'true',

  /**
   * Code Generation Pipeline (TRC-05.1, ADR-008 + ADR-026)
   *
   * Master switch para toda a pipeline de Code Generation (assessment,
   * iterações, geração de arquivos, gates, release). MVP do True Coding
   * pivotou para Spec-as-a-Service em 2026-04-14 — entregamos download de
   * spec.md + manifest.json, sem executar Generation.
   *
   * O código permanece dormente para retomada v2 via MCP delegation.
   *
   * Default: false (desativado em produção quando a env var não estiver
   * setada). Ambientes de dev/test podem habilitar via env var.
   *
   * Quando OFF:
   * - Componentes de Generation retornam null (não renderizam).
   * - Rotas /api/projects/[id]/development/* retornam 404.
   */
  ENABLE_CODE_GENERATION:
    process.env.NEXT_PUBLIC_ENABLE_CODE_GENERATION === 'true',
} as const

/**
 * Atalho top-level para a flag de Code Generation (TRC-05.1).
 *
 * Existe como nomeada para uso direto em rotas/serviços que não
 * dependem do objeto FEATURES inteiro:
 *
 *   import { ENABLE_CODE_GENERATION } from '@/config/features'
 *
 * Tem o mesmo valor de FEATURES.ENABLE_CODE_GENERATION.
 */
export const ENABLE_CODE_GENERATION = FEATURES.ENABLE_CODE_GENERATION

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
