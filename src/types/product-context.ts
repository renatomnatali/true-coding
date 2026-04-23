import type {
  AssumptionCategory,
  RiskImpact,
  RiskProbability,
} from '@prisma/client'

/**
 * JTBD (Jobs To Be Done) estruturado no ProductContext.
 * Armazenado como JSON no campo primaryJtbd.
 *
 * Fonte: POLICY-010 Product Context Minimum.
 */
export interface ProductContextJtbd {
  situation: string
  motivation: string
  outcome: string
}

/**
 * Assumption aberta do ProductContext.
 * Armazenada como item do array JSON openAssumptions.
 *
 * Fonte: POLICY-010 Product Context Minimum (>= 3 assumptions).
 */
export interface ProductContextAssumption {
  category: AssumptionCategory
  statement: string
}

/**
 * Bet estratégica do ProductContext.
 * Armazenada como string literal no array JSON strategicBets (1 a 3 bets).
 *
 * Formato canônico: "Estamos apostando que <X>".
 */
export type ProductContextBet = string

/**
 * Risk Level derivado da matriz impacto × probabilidade.
 * Fonte: POLICY-007 Risk Close States (matriz oficial).
 *
 * Não é persistido no schema — calculado em runtime a partir de
 * Risk.impact × Risk.probability.
 */
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

/**
 * Matriz oficial impacto × probabilidade → risk level (POLICY-007).
 *
 *                 BAIXA         MEDIA        ALTA
 *   BAIXO   →     LOW           LOW          MEDIUM
 *   MEDIO   →     LOW           MEDIUM       HIGH
 *   ALTO    →     MEDIUM        HIGH         CRITICAL
 */
export function computeRiskLevel(
  impact: RiskImpact,
  probability: RiskProbability,
): RiskLevel {
  if (impact === 'ALTO' && probability === 'ALTA') return 'CRITICAL'
  if (impact === 'ALTO' && probability === 'MEDIA') return 'HIGH'
  if (impact === 'ALTO' && probability === 'BAIXA') return 'MEDIUM'
  if (impact === 'MEDIO' && probability === 'ALTA') return 'HIGH'
  if (impact === 'MEDIO' && probability === 'MEDIA') return 'MEDIUM'
  if (impact === 'MEDIO' && probability === 'BAIXA') return 'LOW'
  if (impact === 'BAIXO' && probability === 'ALTA') return 'MEDIUM'
  return 'LOW'
}
