import { z } from 'zod'
import type { BusinessPlan } from '@/types'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const TargetAudienceSchema = z.object({
  primary: z.string().min(1),
  secondary: z.string().optional(),
  painPoints: z.array(z.string()).min(1),
})

const FeatureSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['must-have', 'should-have', 'nice-to-have']),
  complexity: z.enum(['low', 'medium', 'high']),
})

const MonetizationSchema = z.object({
  model: z.enum(['free', 'freemium', 'subscription', 'one-time', 'usage-based']),
  description: z.string().min(1),
  pricing: z.string().optional(),
})

const CompetitorSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional().or(z.literal('')),
  differentiator: z.string().min(1),
})

const SuccessMetricSchema = z.object({
  name: z.string().min(1),
  target: z.string().min(1),
  timeframe: z.string().min(1),
})

/**
 * Schema Zod completo para validação de Business Plan
 * ADR-0001: Discovery Flow Estruturado
 */
export const BusinessPlanSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  problemStatement: z.string().min(1),
  targetAudience: TargetAudienceSchema,
  coreFeatures: z.array(FeatureSchema).min(1),
  niceToHaveFeatures: z.array(FeatureSchema).optional().default([]),
  monetization: MonetizationSchema.optional(),
  competitors: z.array(CompetitorSchema).optional().default([]),
  successMetrics: z.array(SuccessMetricSchema).min(1),
})

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

export function extractJSON<T>(response: string): T | null {
  // Find JSON code block
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/)

  if (!jsonMatch) {
    // Try to find direct JSON
    const directMatch = response.match(/\{[\s\S]*\}/)
    if (directMatch) {
      try {
        return JSON.parse(directMatch[0])
      } catch {
        return null
      }
    }
    return null
  }

  try {
    return JSON.parse(jsonMatch[1])
  } catch {
    return null
  }
}

/**
 * Extrai o número da pergunta do marcador HTML <!--Q:N-->
 * ADR-0002: Database-Enforced Progress Tracking
 *
 * @param content - Conteúdo da resposta da AI
 * @returns Número da pergunta (1-5) ou null se não encontrado
 */
export function extractQuestionNumber(content: string): number | null {
  const match = content.match(/<!--Q:(\d+)-->/)
  if (!match) return null

  const questionNumber = parseInt(match[1], 10)

  // Validar que está no intervalo correto
  if (questionNumber < 1 || questionNumber > 5) {
    console.warn(`[extractQuestionNumber] Número inválido: ${questionNumber}`)
    return null
  }

  return questionNumber
}

/**
 * Verifica se a resposta contém um Business Plan válido
 * Agora usa validação Zod para maior confiabilidade
 *
 * @param response - Resposta da AI
 * @returns true se contém plano válido
 */
export function isPlanReady(response: string): boolean {
  const plan = extractBusinessPlan(response)
  return plan !== null
}

/**
 * Extrai e valida Business Plan da resposta
 * ADR-0001: Validação robusta com Zod
 *
 * @param response - Resposta da AI
 * @returns Business Plan validado ou null
 */
export function extractBusinessPlan(response: string): BusinessPlan | null {
  const rawPlan = extractJSON<BusinessPlan>(response)
  if (!rawPlan) return null

  try {
    // Validar com Zod
    const validatedPlan = BusinessPlanSchema.parse(rawPlan)
    return validatedPlan as BusinessPlan
  } catch (error) {
    console.error('[extractBusinessPlan] Validation failed:', error)
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors)
    }
    return null
  }
}
