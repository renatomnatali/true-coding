export type DevelopmentRunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'WAITING_CHECKPOINT'
  | 'FAILED'
  | 'CANCELED'
  | 'SUCCEEDED'

export type IterationStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'GATED'
  | 'MERGED'
  | 'DEPLOYED'
  | 'FAILED'

export type QualityGateType =
  | 'BUILD'
  | 'UNIT'
  | 'BDD'
  | 'REVIEW'
  | 'SECURITY'

export interface QualityGateResult {
  gateType: QualityGateType
  passed: boolean
  durationMs: number
  logsRef?: string
  report?: Record<string, unknown>
}

export type DevelopmentEventType =
  | 'run_status'
  | 'iteration_status'
  | 'agent_task'
  | 'quality_gate'
  | 'deploy_status'
  | 'error'
  | 'info'

export interface DevelopmentEvent {
  id: string
  runId: string
  iterationId?: string
  sequence: number
  eventType: DevelopmentEventType
  message?: string
  payload?: Record<string, unknown>
  createdAt: string
}

export interface IterationPlanItem {
  index: number
  name: string
  slug: string
  scope: {
    goals: string[]
    featureTags: string[]
    risks: string[]
  }
  gherkinPath: string
}

export interface AssessmentResult {
  complexityScore: number
  complexityLevel: 'simple' | 'medium' | 'complex'
  factors: Array<{
    name: string
    score: number
    maxScore: number
    detail: string
  }>
  recommendedIterations: number
}
