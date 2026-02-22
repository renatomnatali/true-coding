import type { AssessmentResult, IterationPlanItem } from '@/types/development'

export interface ApprovedDevelopmentPlan {
  assessment: AssessmentResult
  iterations: IterationPlanItem[]
}

export interface PlanSnapshot {
  projectName?: string | null
  projectDescription?: string | null
  businessPlan: unknown
  technicalPlan: unknown
  uxPlan: unknown
  approvedAssessment?: AssessmentResult | null
  approvedIterations?: IterationPlanItem[] | null
}

// PR1: File-by-file generation types
export type FileKind = 'type' | 'schema' | 'config' | 'component' | 'page' | 'api' | 'test' | 'spec'

export interface FileManifestEntry {
  path: string
  kind: FileKind
  estimatedTokens: number
  dependsOn?: string[]
  context?: string
}

export interface FileManifest {
  entries: FileManifestEntry[]
  totalEstimatedTokens: number
}

export interface AgentExecutionContext {
  runId: string
  projectId: string
  iterationId?: string
  iterationIndex?: number
  attempt?: number
  snapshot: PlanSnapshot
}

export interface AgentExecutionResult<T = Record<string, unknown>> {
  output: T
  tokenUsage?: number
  cost?: number
}

export interface GeneratedIterationPlan {
  assessment: AssessmentResult
  iterations: IterationPlanItem[]
}

export interface GateExecutionOptions {
  runId: string
  iterationId: string
  iterationIndex: number
  projectId: string
  workspacePath: string
  featureTags: string[]
}

export interface GateRunOutput {
  gateType: 'BUILD' | 'UNIT' | 'BDD' | 'REVIEW' | 'SECURITY'
  passed: boolean
  durationMs: number
  logsRef?: string
  report?: Record<string, unknown>
}
