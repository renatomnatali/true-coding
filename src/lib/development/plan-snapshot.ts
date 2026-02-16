import type { AssessmentResult, IterationPlanItem } from '@/types/development'
import type { ApprovedDevelopmentPlan, PlanSnapshot } from './types'

export interface TechnicalPlanLike {
  pages?: Array<{
    name?: string
    path?: string
    components?: string[]
  }>
  components?: Array<{
    name?: string
    description?: string
    props?: Record<string, string>
  }>
  dataModel?: {
    entities?: Array<{
      name?: string
      fields?: Array<{
        name?: string
        type?: string
        required?: boolean
        unique?: boolean
        default?: string
      }>
    }>
  }
  database?: {
    prismaSchema?: string
  }
  security?: {
    authentication?: string[]
  }
}

export interface GeneratedWorkspaceFile {
  path: string
  content: string
}

export interface RunContext {
  runId: string
  projectId: string
  snapshot: PlanSnapshot
  sandboxPath: string
}

export function isAssessmentResult(value: unknown): value is AssessmentResult {
  if (!value || typeof value !== 'object') return false

  const assessment = value as Partial<AssessmentResult>
  if (typeof assessment.complexityScore !== 'number') return false
  if (typeof assessment.recommendedIterations !== 'number') return false
  if (!['simple', 'medium', 'complex'].includes(String(assessment.complexityLevel))) return false
  if (!Array.isArray(assessment.factors)) return false

  return assessment.factors.every((factor) => (
    factor &&
    typeof factor === 'object' &&
    typeof factor.name === 'string' &&
    typeof factor.score === 'number' &&
    typeof factor.maxScore === 'number' &&
    typeof factor.detail === 'string'
  ))
}

export function isIterationPlanItem(value: unknown): value is IterationPlanItem {
  if (!value || typeof value !== 'object') return false

  const iteration = value as Partial<IterationPlanItem>
  if (typeof iteration.index !== 'number') return false
  if (typeof iteration.name !== 'string') return false
  if (typeof iteration.slug !== 'string') return false
  if (typeof iteration.gherkinPath !== 'string') return false
  if (!iteration.scope || typeof iteration.scope !== 'object') return false

  const scope = iteration.scope as Partial<IterationPlanItem['scope']>
  return (
    Array.isArray(scope.goals) &&
    scope.goals.every((goal) => typeof goal === 'string') &&
    Array.isArray(scope.featureTags) &&
    scope.featureTags.every((tag) => typeof tag === 'string') &&
    Array.isArray(scope.risks) &&
    scope.risks.every((risk) => typeof risk === 'string')
  )
}

export function getApprovedPlan(snapshot: PlanSnapshot): ApprovedDevelopmentPlan | null {
  if (!isAssessmentResult(snapshot.approvedAssessment)) {
    return null
  }

  if (
    !Array.isArray(snapshot.approvedIterations) ||
    snapshot.approvedIterations.length === 0 ||
    !snapshot.approvedIterations.every((iteration) => isIterationPlanItem(iteration))
  ) {
    return null
  }

  return {
    assessment: snapshot.approvedAssessment,
    iterations: snapshot.approvedIterations,
  }
}

export function normalizeTechnicalPlan(snapshot: PlanSnapshot): TechnicalPlanLike {
  return (snapshot.technicalPlan ?? {}) as TechnicalPlanLike
}

export function resolveProjectName(snapshot: PlanSnapshot): string {
  const nameFromSnapshot =
    typeof snapshot.projectName === 'string' && snapshot.projectName.trim().length > 0
      ? snapshot.projectName.trim()
      : null
  if (nameFromSnapshot) return nameFromSnapshot

  const businessPlan = snapshot.businessPlan
  if (businessPlan && typeof businessPlan === 'object') {
    const candidate = (businessPlan as { name?: unknown }).name
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return 'True Coding App'
}

export function resolveProjectDescription(snapshot: PlanSnapshot): string {
  const descriptionFromSnapshot =
    typeof snapshot.projectDescription === 'string' &&
    snapshot.projectDescription.trim().length > 0
      ? snapshot.projectDescription.trim()
      : null
  if (descriptionFromSnapshot) return descriptionFromSnapshot

  const businessPlan = snapshot.businessPlan
  if (businessPlan && typeof businessPlan === 'object') {
    const candidate = (businessPlan as { description?: unknown }).description
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return 'Aplicação gerada automaticamente pelo pipeline autônomo.'
}
