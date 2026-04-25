import type { DevelopmentRunStatus } from '@/types'

export interface DevelopmentRunSummary {
  id: string
  status: DevelopmentRunStatus
  currentIteration: number
  totalIterations: number
  errorSummary: string | null
  createdAt: string
  updatedAt?: string
  startedAt: string | null
  finishedAt: string | null
  isStale?: boolean
}

export interface RunsResponse {
  runs: DevelopmentRunSummary[]
}

export const STATUS_LABELS: Record<DevelopmentRunStatus, string> = {
  QUEUED: 'Na fila',
  RUNNING: 'Executando',
  WAITING_CHECKPOINT: 'Aguardando ação',
  FAILED: 'Falhou',
  CANCELED: 'Cancelado',
  SUCCEEDED: 'Concluído',
}

export const STATUS_STYLES: Record<DevelopmentRunStatus, string> = {
  QUEUED: 'bg-slate-100 text-slate-700',
  RUNNING: 'bg-blue-100 text-blue-700',
  WAITING_CHECKPOINT: 'bg-amber-100 text-amber-800',
  FAILED: 'bg-red-100 text-red-700',
  CANCELED: 'bg-zinc-100 text-zinc-700',
  SUCCEEDED: 'bg-green-100 text-green-700',
}
