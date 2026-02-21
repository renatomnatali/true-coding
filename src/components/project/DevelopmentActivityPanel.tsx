'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FEATURES } from '@/config/features'
import type { DevelopmentEvent, DevelopmentRunStatus } from '@/types'
import { getRetryBoundarySequence } from '@/lib/development/retry-boundary'

interface DevelopmentRunSummary {
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

interface RunsResponse {
  runs: DevelopmentRunSummary[]
}

interface DevelopmentActivityPanelProps {
  projectId: string
  projectStatus: string
  projectName?: string
  onProjectStatusChange?: (status: string) => void
  onJourneyStateChange?: (state: 'awaiting_confirmation' | 'monitoring') => void
}

type RunRecoveryAction = 'resume' | 'retry' | 'cancel'

const ACTIVE_RUN_STATUSES = new Set<DevelopmentRunStatus>([
  'QUEUED',
  'RUNNING',
  'WAITING_CHECKPOINT',
])

const RECOVERABLE_RUN_STATUSES = new Set<DevelopmentRunStatus>([
  'QUEUED',
  'RUNNING',
])

const TERMINAL_RUN_STATUSES = new Set<DevelopmentRunStatus>([
  'FAILED',
  'CANCELED',
  'SUCCEEDED',
])

const STATUS_LABELS: Record<DevelopmentRunStatus, string> = {
  QUEUED: 'Na fila',
  RUNNING: 'Executando',
  WAITING_CHECKPOINT: 'Aguardando checkpoint',
  FAILED: 'Falhou',
  CANCELED: 'Cancelado',
  SUCCEEDED: 'Concluído',
}

const STATUS_STYLES: Record<DevelopmentRunStatus, string> = {
  QUEUED: 'bg-slate-100 text-slate-700',
  RUNNING: 'bg-blue-100 text-blue-700',
  WAITING_CHECKPOINT: 'bg-amber-100 text-amber-800',
  FAILED: 'bg-red-100 text-red-700',
  CANCELED: 'bg-zinc-100 text-zinc-700',
  SUCCEEDED: 'bg-green-100 text-green-700',
}

function getRunStatusPresentation(status: DevelopmentRunStatus) {
  return {
    label: STATUS_LABELS[status],
    styles: STATUS_STYLES[status],
  }
}

// ===== PR2: Pipeline Steps Types =====

type PipelineStepStatus = 'pending' | 'running' | 'done' | 'failed'

interface PipelineStep {
  id: string
  label: string
  status: PipelineStepStatus
  detail?: string
  children?: PipelineStep[]
}

interface PipelineGroup {
  id: string
  label: string
  status: PipelineStepStatus
  count?: string // e.g., "1/6"
  children?: PipelineStep[]
}

// ===== PR2: derivePipelineSteps =====

function derivePipelineSteps(
  events: DevelopmentEvent[],
  activeRun: DevelopmentRunSummary | null
): { preparation: PipelineGroup; iterations: PipelineGroup[]; finalization: PipelineGroup } {
  const hasEvent = (type: string, match?: (p: Record<string, unknown>) => boolean) =>
    events.some((e) => {
      if (e.eventType !== type) return false
      if (!match) return true
      return match((e.payload ?? {}) as Record<string, unknown>)
    })

  const agentStatus = (name: string): PipelineStepStatus => {
    const agentEvents = events.filter(
      (e) => e.eventType === 'agent_task' && (e.payload as Record<string, unknown>)?.agentName === name
    )
    if (agentEvents.length === 0) return 'pending'
    const last = agentEvents[agentEvents.length - 1]
    const status = (last.payload as Record<string, unknown>)?.status
    if (status === 'SUCCEEDED') return 'done'
    if (status === 'FAILED') return 'failed'
    return 'running'
  }

  // 1. Preparação
  const sandboxDone = events.length > 2 || hasEvent('info', (p) =>
    typeof p.message === 'string' && p.message.includes('workspace')
  )
  const prepSteps: PipelineStep[] = [
    { id: 'prep-env', label: 'Preparando ambiente', status: sandboxDone ? 'done' : 'running' },
    { id: 'prep-structure', label: 'Criando estrutura do projeto', status: sandboxDone ? 'done' : 'pending' },
    { id: 'prep-deps', label: 'Instalando dependências', status: sandboxDone ? 'done' : 'pending' },
    { id: 'prep-db', label: 'Configurando banco de dados', status: sandboxDone ? 'done' : 'pending' },
  ]
  const prepDone = prepSteps.every(s => s.status === 'done')
  const prepCount = `${prepSteps.filter(s => s.status === 'done').length}/${prepSteps.length}`

  // 2. Iterações
  const totalIterations = activeRun?.totalIterations ?? 0
  const currentIteration = activeRun?.currentIteration ?? 0
  const iterationGroups: PipelineGroup[] = []

  for (let i = 1; i <= Math.max(totalIterations, 1); i++) {
    const isCurrent = i === currentIteration || (currentIteration === 0 && i === 1)
    const isPast = i < currentIteration

    const iterDone = hasEvent('iteration_status', (p) =>
      p.iterationIndex === i && (p.status === 'MERGED' || p.status === 'DEPLOYED')
    )
    const iterFailed = hasEvent('error', (p) => p.iterationIndex === i) && !iterDone

    // Steps dentro da iteração
    const specStatus = isPast || iterDone ? 'done' : isCurrent ? agentStatus('SpecAgent') : 'pending'
    const testStatus = isPast || iterDone ? 'done' : isCurrent ? agentStatus('TestAgent') : 'pending'
    const codeStatus = isPast || iterDone ? 'done' : isCurrent ? agentStatus('CodeAgent') : 'pending'
    const reviewStatus = isPast || iterDone ? 'done' : isCurrent ? agentStatus('ReviewAgent') : 'pending'

    const gateEvents = events.filter((e) => e.eventType === 'quality_gate')
    const gatesPassed = gateEvents.length > 0 && gateEvents.every((e) => (e.payload as Record<string, unknown>)?.passed === true)
    const gatesFailed = gateEvents.some((e) => (e.payload as Record<string, unknown>)?.passed === false)
    let gatesStatus: PipelineStepStatus = 'pending'
    if (gatesPassed) gatesStatus = 'done'
    else if (gatesFailed) gatesStatus = 'failed'
    else if ((reviewStatus === 'done' || reviewStatus === 'running') && isCurrent) gatesStatus = 'running'

    const releaseDone = hasEvent('iteration_status', (p) => p.iterationIndex === i && p.status === 'MERGED')
    let releaseStatus: PipelineStepStatus = 'pending'
    if (releaseDone) releaseStatus = 'done'
    else if (gatesStatus === 'done' && isCurrent) releaseStatus = 'running'

    const iterSteps: PipelineStep[] = [
      { id: `iter-${i}-spec`, label: 'Escrevendo especificação', status: specStatus },
      { id: `iter-${i}-test`, label: 'Gerando testes', status: testStatus },
      { id: `iter-${i}-code`, label: 'Gerando código', status: codeStatus },
      { id: `iter-${i}-review`, label: 'Revisando código', status: reviewStatus },
      { id: `iter-${i}-gates`, label: 'Verificando qualidade', status: gatesStatus },
      { id: `iter-${i}-release`, label: 'Publicando no Git', status: releaseStatus },
    ]

    const completedCount = iterSteps.filter(s => s.status === 'done').length
    const iterGroupStatus: PipelineStepStatus = iterDone ? 'done' : iterFailed ? 'failed' : isCurrent ? 'running' : 'pending'

    iterationGroups.push({
      id: `iter-${i}`,
      label: `Iteração ${i}`,
      status: iterGroupStatus,
      count: `${completedCount}/${iterSteps.length}`,
      children: iterSteps,
    })
  }

  // 3. Finalização
  const finalDeployRunning = hasEvent('deploy_status', (p) => p.status === 'DEPLOYING')
  const finalDeployDone = activeRun?.status === 'SUCCEEDED'
  const finalDeployFailed = hasEvent('deploy_status', (p) => p.status === 'FAILED')

  let finalStatus: PipelineStepStatus = 'pending'
  if (finalDeployDone) finalStatus = 'done'
  else if (finalDeployFailed) finalStatus = 'failed'
  else if (finalDeployRunning) finalStatus = 'running'

  return {
    preparation: {
      id: 'preparation',
      label: 'Preparação',
      status: prepDone ? 'done' : 'running',
      count: prepCount,
      children: prepSteps,
    },
    iterations: iterationGroups,
    finalization: {
      id: 'finalization',
      label: 'Finalização',
      status: finalStatus,
      children: [
        { id: 'final-deploy', label: 'Publicando na internet (Netlify)', status: finalStatus },
      ],
    },
  }
}

// ===== PR2: Step Status Icons & Styles =====

const STEP_STATUS_ICON: Record<PipelineStepStatus, string> = {
  pending: '○',
  running: '●',
  done: '✓',
  failed: '✗',
}

const STEP_STATUS_STYLES: Record<PipelineStepStatus, string> = {
  pending: 'text-slate-400',
  running: 'text-blue-600 animate-pulse',
  done: 'text-emerald-600',
  failed: 'text-red-600',
}

const STEP_LABEL_STYLES: Record<PipelineStepStatus, string> = {
  pending: 'text-slate-400',
  running: 'text-slate-900 font-medium',
  done: 'text-slate-600',
  failed: 'text-red-700 font-medium',
}

function mapRunStatusToProjectStatus(status: DevelopmentRunStatus): string | null {
  switch (status) {
    case 'QUEUED':
    case 'RUNNING':
      return 'GENERATING'
    case 'WAITING_CHECKPOINT':
      return 'FAILED'
    case 'SUCCEEDED':
      return 'LIVE'
    case 'FAILED':
    case 'CANCELED':
      return 'FAILED'
    default:
      return null
  }
}

function getProgressPercent(run: DevelopmentRunSummary): number {
  if (run.status === 'SUCCEEDED') return 100
  if (run.totalIterations <= 0) return run.status === 'QUEUED' ? 8 : 12

  const ratio = Math.max(0, Math.min(1, run.currentIteration / run.totalIterations))
  if (run.status === 'QUEUED') return Math.max(8, Math.round(ratio * 100 * 0.5))
  if (run.status === 'RUNNING') return Math.max(12, Math.round(ratio * 100))
  if (run.status === 'WAITING_CHECKPOINT') return Math.max(12, Math.round(ratio * 100))
  if (run.status === 'FAILED' || run.status === 'CANCELED') return Math.max(12, Math.round(ratio * 100))

  return Math.round(ratio * 100)
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback
  const data = payload as { message?: unknown; error?: unknown }
  if (typeof data.message === 'string' && data.message.length > 0) return data.message
  if (typeof data.error === 'string' && data.error.length > 0) return data.error
  return fallback
}

export function DevelopmentActivityPanel({
  projectId,
  projectStatus,
  projectName,
  onProjectStatusChange,
  onJourneyStateChange,
}: DevelopmentActivityPanelProps) {
  const [activeRun, setActiveRun] = useState<DevelopmentRunSummary | null>(null)
  const [events, setEvents] = useState<DevelopmentEvent[]>([])
  const [isStartingRun, setIsStartingRun] = useState(false)
  const [isRecoveringRun, setIsRecoveringRun] = useState(false)
  const [startRunError, setStartRunError] = useState<string | null>(null)
  const [resumeDeferred, setResumeDeferred] = useState(false)
  const [resumeExecutionConfirmed, setResumeExecutionConfirmed] = useState(false)
  const [runActionLoading, setRunActionLoading] = useState<RunRecoveryAction | null>(null)
  const [runActionError, setRunActionError] = useState<string | null>(null)
  const [runActionMessage, setRunActionMessage] = useState<string | null>(null)
  const [hasFetchedRuns, setHasFetchedRuns] = useState(false)
  const lastSequenceRef = useRef(0)
  const hasBlockingActiveRun = !activeRun || ACTIVE_RUN_STATUSES.has(activeRun.status)
  const requiresResumeConfirmation =
    projectStatus === 'GENERATING' &&
    !resumeExecutionConfirmed &&
    hasBlockingActiveRun

  const fetchRuns = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/development/runs`)
      if (!response.ok) return null

      const data = (await response.json()) as RunsResponse
      const runs = data.runs || []

      const current =
        runs.find((run) => ACTIVE_RUN_STATUSES.has(run.status)) ??
        runs[0] ??
        null

      setActiveRun(current)
      setHasFetchedRuns(true)
      return current
    } catch {
      // ignore temporary failures
      return null
    }
  }, [projectId])

  useEffect(() => {
    if (!FEATURES.AUTONOMOUS_DEVELOPMENT_V1) return
    void fetchRuns()
  }, [fetchRuns])

  useEffect(() => {
    if (!FEATURES.AUTONOMOUS_DEVELOPMENT_V1) return
    if (requiresResumeConfirmation) return

    const needsPolling =
      projectStatus === 'GENERATING' ||
      projectStatus === 'DEPLOYING' ||
      activeRun?.status === 'RUNNING' ||
      activeRun?.status === 'QUEUED' ||
      activeRun?.status === 'WAITING_CHECKPOINT'

    if (!needsPolling) return

    const timer = setInterval(() => {
      void fetchRuns()
    }, 5000)

    return () => clearInterval(timer)
  }, [fetchRuns, projectStatus, activeRun?.status, requiresResumeConfirmation])

  useEffect(() => {
    if (projectStatus !== 'GENERATING') {
      setResumeDeferred(false)
      setStartRunError(null)
      setResumeExecutionConfirmed(false)
    }
  }, [projectStatus])

  useEffect(() => {
    if (!activeRun) return

    const mappedStatus = mapRunStatusToProjectStatus(activeRun.status)
    if (!mappedStatus || mappedStatus === projectStatus) return

    onProjectStatusChange?.(mappedStatus)
  }, [activeRun, onProjectStatusChange, projectStatus])

  useEffect(() => {
    if (projectStatus !== 'GENERATING') {
      onJourneyStateChange?.('monitoring')
      return
    }

    onJourneyStateChange?.(
      requiresResumeConfirmation ? 'awaiting_confirmation' : 'monitoring'
    )
  }, [onJourneyStateChange, projectStatus, requiresResumeConfirmation])

  useEffect(() => {
    if (activeRun?.status === 'WAITING_CHECKPOINT' || activeRun?.status === 'FAILED') return
    setRunActionError(null)
    setRunActionMessage(null)
    setRunActionLoading(null)
  }, [activeRun?.status])

  const startRun = useCallback(async () => {
    if (isStartingRun) return

    setIsStartingRun(true)
    setStartRunError(null)
    setResumeDeferred(false)

    try {
      const response = await fetch(`/api/projects/${projectId}/development/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentConfirmed: true }),
      })

      if (!response.ok) {
        let message = 'Falha ao retomar geração automática.'
        let payload: Record<string, unknown> = {}
        try {
          payload = await response.json()
          message = extractErrorMessage(payload, message)
        } catch {
          // ignore parse failures
        }

        const isAlreadyActiveConflict =
          response.status === 409 && payload.error === 'RUN_ALREADY_ACTIVE'
        if (isAlreadyActiveConflict) {
          const currentRun = await fetchRuns()
          if (currentRun && ACTIVE_RUN_STATUSES.has(currentRun.status)) {
            return true
          }
        }

        setStartRunError(message)
        return false
      }

      await fetchRuns()
      return true
    } catch {
      setStartRunError('Erro de rede ao retomar a operação. Tente novamente.')
      return false
    } finally {
      setIsStartingRun(false)
    }
  }, [fetchRuns, isStartingRun, projectId])

  const recoverRun = useCallback(async (runId: string) => {
    if (isRecoveringRun) return false

    setIsRecoveringRun(true)
    setStartRunError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/development/runs/${runId}/recover`, {
        method: 'POST',
      })

      if (!response.ok) {
        let message = 'Falha ao retomar a execução pendente.'
        try {
          const payload = await response.json()
          message = extractErrorMessage(payload, message)
        } catch {
          // ignore parse failures
        }
        setStartRunError(message)
        return false
      }

      await fetchRuns()
      return true
    } catch {
      setStartRunError('Erro de rede ao retomar execução pendente. Tente novamente.')
      return false
    } finally {
      setIsRecoveringRun(false)
    }
  }, [fetchRuns, isRecoveringRun, projectId])

  const confirmResume = useCallback(async () => {
    setResumeDeferred(false)
    setStartRunError(null)

    const activeFromState =
      activeRun && ACTIVE_RUN_STATUSES.has(activeRun.status) ? activeRun : null
    if (activeFromState) {
      if (RECOVERABLE_RUN_STATUSES.has(activeFromState.status)) {
        const recovered = await recoverRun(activeFromState.id)
        if (!recovered) return
      }

      setResumeExecutionConfirmed(true)
      return
    }

    let currentRun: DevelopmentRunSummary | null = activeFromState
    if (!hasFetchedRuns) {
      currentRun = await fetchRuns()
    }

    if (currentRun && ACTIVE_RUN_STATUSES.has(currentRun.status)) {
      if (RECOVERABLE_RUN_STATUSES.has(currentRun.status)) {
        const recovered = await recoverRun(currentRun.id)
        if (!recovered) return
      }

      setResumeExecutionConfirmed(true)
      return
    }

    const started = await startRun()
    if (started) {
      setResumeExecutionConfirmed(true)
    }
  }, [activeRun, fetchRuns, hasFetchedRuns, recoverRun, startRun])

  const performRunAction = useCallback(async (action: RunRecoveryAction) => {
    if (!activeRun) return
    if (runActionLoading) return

    setRunActionLoading(action)
    setRunActionError(null)
    setRunActionMessage(null)

    const currentIteration = Math.max(activeRun.currentIteration, 1)

    const requestConfig = (() => {
      if (action === 'retry') {
        return {
          url: `/api/projects/${projectId}/development/runs/${activeRun.id}/retry`,
          fallbackError: 'Falha ao solicitar nova tentativa da iteração.',
          successMessage: 'Nova tentativa iniciada.',
          init: {
            method: 'POST',
          } satisfies RequestInit,
        }
      }

      if (action === 'resume') {
        return {
          url: `/api/projects/${projectId}/development/runs/${activeRun.id}/checkpoints/${currentIteration}`,
          fallbackError: 'Falha ao retomar checkpoint.',
          successMessage: `Checkpoint da iteração ${currentIteration} retomado.`,
          init: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'resume' }),
          } satisfies RequestInit,
        }
      }

      return {
        url: `/api/projects/${projectId}/development/runs/${activeRun.id}/cancel`,
        fallbackError: 'Falha ao cancelar execução.',
        successMessage: 'Execução cancelada.',
        init: {
          method: 'POST',
        } satisfies RequestInit,
      }
    })()

    try {
      const response = await fetch(requestConfig.url, requestConfig.init)
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        setRunActionError(extractErrorMessage(payload, requestConfig.fallbackError))
        return
      }

      if (typeof payload?.status === 'string') {
        const nextStatus = payload.status as DevelopmentRunStatus
        setActiveRun((prev) => (
          prev
            ? {
                ...prev,
                status: nextStatus,
                errorSummary:
                  nextStatus === 'RUNNING' ? null : prev.errorSummary,
              }
            : prev
        ))
        const mapped = mapRunStatusToProjectStatus(nextStatus)
        if (mapped) {
          onProjectStatusChange?.(mapped)
        }
      }

      if (action === 'retry' || action === 'resume') {
        setEvents([])
      }

      setRunActionMessage(requestConfig.successMessage)
      await fetchRuns()
    } catch {
      setRunActionError('Erro de rede ao executar ação da run. Tente novamente.')
    } finally {
      setRunActionLoading(null)
    }
  }, [activeRun, fetchRuns, onProjectStatusChange, projectId, runActionLoading])

  const startFreshRun = useCallback(async () => {
    if (isStartingRun) return

    setRunActionLoading(null)
    setRunActionError(null)
    setRunActionMessage(null)
    setStartRunError(null)

    const started = await startRun()
    if (!started) return

    setEvents([])
    setResumeExecutionConfirmed(true)
    setRunActionMessage('Nova run iniciada.')
    onProjectStatusChange?.('GENERATING')
  }, [isStartingRun, onProjectStatusChange, startRun])

  const activeRunId = activeRun?.id ?? null

  useEffect(() => {
    if (!FEATURES.AUTONOMOUS_DEVELOPMENT_V1) return
    if (requiresResumeConfirmation) return
    if (!activeRunId) return

    setEvents([])
    lastSequenceRef.current = 0

    const eventSource = new EventSource(
      `/api/projects/${projectId}/development/runs/${activeRunId}/events?after=0`
    )

    const handleIncoming = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as DevelopmentEvent
        if (typeof parsed.sequence !== 'number') return
        if (typeof parsed.eventType !== 'string') return
        if (parsed.sequence <= lastSequenceRef.current) return

        lastSequenceRef.current = parsed.sequence

        const normalizedEvent: DevelopmentEvent = {
          ...parsed,
          createdAt:
            typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
        }

        setEvents((prev) => {
          const next = [...prev, normalizedEvent]
          return next.slice(-40)
        })

        if (normalizedEvent.eventType === 'run_status') {
          const status = normalizedEvent.payload?.status
          if (typeof status === 'string') {
            setActiveRun((prev) =>
              prev
                ? {
                    ...prev,
                    status: status as DevelopmentRunStatus,
                    errorSummary:
                      status === 'RUNNING' ? null : prev.errorSummary,
                  }
                : prev
            )

            const mapped = mapRunStatusToProjectStatus(status as DevelopmentRunStatus)
            if (mapped) {
              onProjectStatusChange?.(mapped)
            }
          }
        }
      } catch {
        // ignore malformed events
      }
    }

    const eventNames: Array<
      DevelopmentEvent['eventType'] | 'done'
    > = [
      'run_status',
      'iteration_status',
      'agent_task',
      'quality_gate',
      'deploy_status',
      'error',
      'info',
      'done',
    ]

    for (const eventName of eventNames) {
      eventSource.addEventListener(eventName, handleIncoming)
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [projectId, activeRunId, onProjectStatusChange, requiresResumeConfirmation])

  const runningAgents = useMemo(() => {
    const retryBoundary = getRetryBoundarySequence(events)
    const scopedEvents =
      retryBoundary > 0
        ? events.filter((event) => event.sequence >= retryBoundary)
        : events

    if (activeRun && TERMINAL_RUN_STATUSES.has(activeRun.status)) {
      return []
    }

    const latestByTask = new Map<string, { agentName: string; status: string }>()

    for (const event of scopedEvents) {
      if (event.eventType !== 'agent_task') continue
      const payload = event.payload ?? {}
      const taskId = typeof payload.taskId === 'string' ? payload.taskId : null
      const agentName = typeof payload.agentName === 'string' ? payload.agentName : null
      const status = typeof payload.status === 'string' ? payload.status : null
      if (!taskId || !agentName || !status) continue

      latestByTask.set(taskId, { agentName, status })
    }

    return [...latestByTask.values()]
      .filter((entry) => entry.status === 'RUNNING')
      .map((entry) => entry.agentName)
      .filter((agent, index, list) => list.indexOf(agent) === index)
  }, [events, activeRun])

  const pipelineSteps = useMemo(() => {
    const retryBoundary = getRetryBoundarySequence(events)
    const scopedEvents =
      retryBoundary > 0
        ? events.filter((event) => event.sequence >= retryBoundary)
        : events
    return derivePipelineSteps(scopedEvents, activeRun)
  }, [events, activeRun])

  if (!FEATURES.AUTONOMOUS_DEVELOPMENT_V1) {
    return null
  }

  const shouldRender =
    Boolean(activeRun) ||
    isStartingRun ||
    projectStatus === 'GENERATING' ||
    projectStatus === 'DEPLOYING'

  if (!shouldRender) {
    return null
  }

  const hasPendingResume = requiresResumeConfirmation
  const resumeActionInFlight = isStartingRun || isRecoveringRun
  const progress = activeRun ? getProgressPercent(activeRun) : 8
  const showRecoveryActions =
    activeRun?.status === 'WAITING_CHECKPOINT' || activeRun?.status === 'FAILED'
  const showStartNewRunAction =
    activeRun?.status === 'CANCELED' || activeRun?.status === 'SUCCEEDED'
  const statusPresentation = activeRun ? getRunStatusPresentation(activeRun.status) : null

  return (
    <section className="border-b bg-slate-50/80 p-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {projectName ? `Construindo ${projectName}` : 'Construindo...'}
            </h3>
          </div>

          {requiresResumeConfirmation ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {isStartingRun || isRecoveringRun ? 'Retomando run...' : 'Aguardando confirmação'}
            </span>
          ) : activeRun ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPresentation?.styles ?? 'bg-slate-100 text-slate-700'}`}
            >
              {statusPresentation?.label ?? STATUS_LABELS[activeRun.status]}
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {isStartingRun || isRecoveringRun ? 'Retomando run...' : 'Aguardando confirmação'}
            </span>
          )}
        </div>

        {hasPendingResume && (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <div className="mb-2 font-semibold">
              {activeRun
                ? activeRun.isStale
                  ? 'Existe uma execução pendente sem worker ativo.'
                  : 'Existe uma execução em andamento para este projeto.'
                : 'Há uma geração pendente para este projeto.'}
            </div>
            <p className="mb-3 text-amber-800">
              {activeRun
                ? activeRun.isStale
                  ? 'A última run não está processando no momento. Deseja retomar a execução agora?'
                  : 'Deseja continuar acompanhando e executando a operação atual?'
                : 'Deseja retomar agora a última operação ou manter pausado?'}
            </p>
            {activeRun?.isStale && (
              <p className="mb-3 text-amber-800">
                Última atualização registrada: {formatTime(activeRun.updatedAt ?? activeRun.createdAt)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void confirmResume()}
                disabled={resumeActionInFlight}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {resumeActionInFlight
                  ? 'Retomando...'
                  : activeRun?.isStale
                    ? 'Retomar execução'
                    : activeRun
                    ? 'Continuar execução'
                    : 'Retomar operação'}
              </button>
              <button
                onClick={() => setResumeDeferred(true)}
                className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                Agora não
              </button>
            </div>
            {resumeDeferred && (
              <p className="mt-2 text-amber-800">
                Operação mantida em espera. Você pode retomar quando quiser.
              </p>
            )}
            {startRunError && (
              <p className="mt-2 text-red-700">{startRunError}</p>
            )}
          </div>
        )}

        {activeRun && showRecoveryActions && (
          <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <div className="font-semibold">Ação necessária para continuar</div>
            <p className="mt-1 text-amber-800">
              A run parou na iteração {Math.max(activeRun.currentIteration, 1)}. Escolha como deseja prosseguir.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => void performRunAction('resume')}
                disabled={runActionLoading !== null}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {runActionLoading === 'resume' ? 'Retomando...' : 'Retomar checkpoint'}
              </button>
              <button
                onClick={() => void performRunAction('retry')}
                disabled={runActionLoading !== null}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {runActionLoading === 'retry' ? 'Iniciando retry...' : 'Tentar novamente iteração'}
              </button>
              <button
                onClick={() => void performRunAction('cancel')}
                disabled={runActionLoading !== null}
                className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
              >
                {runActionLoading === 'cancel' ? 'Cancelando...' : 'Cancelar execução'}
              </button>
            </div>
            {runActionMessage && (
              <p className="mt-2 text-emerald-700">{runActionMessage}</p>
            )}
            {runActionError && (
              <p className="mt-2 text-red-700">{runActionError}</p>
            )}
          </div>
        )}

        {activeRun && showStartNewRunAction && (
          <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <div className="font-semibold">Iniciar novo ciclo</div>
            <p className="mt-1 text-blue-800">
              A run anterior terminou com status {statusPresentation?.label?.toLowerCase() ?? 'terminal'}.
              Você pode iniciar uma nova run para continuar o desenvolvimento.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => void startFreshRun()}
                disabled={isStartingRun}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isStartingRun ? 'Iniciando nova run...' : 'Iniciar nova run'}
              </button>
            </div>
            {runActionMessage && (
              <p className="mt-2 text-emerald-700">{runActionMessage}</p>
            )}
            {startRunError && (
              <p className="mt-2 text-red-700">{startRunError}</p>
            )}
          </div>
        )}

        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
            <span>
              {hasPendingResume
                ? 'Aguardando confirmação para retomar'
                : activeRun
                ? `Iteração ${Math.max(activeRun.currentIteration, 1)} de ${Math.max(activeRun.totalIterations, 1)}`
                : 'Aguardando plano de iterações'}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {runningAgents.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-700">Agentes ativos:</span>
            {runningAgents.map((agent) => (
              <span
                key={agent}
                className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm ring-1 ring-slate-200"
              >
                {agent} executando
              </span>
            ))}
          </div>
        )}

        {activeRun?.errorSummary && (
          <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
            {activeRun.errorSummary}
          </div>
        )}

        <div className="rounded-md border bg-white p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Progresso do pipeline
          </div>

          {/* Preparação */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-700">{pipelineSteps.preparation.label}</span>
              <span className="flex-1 border-t border-slate-200"></span>
              <span className="text-[10px] text-slate-400">{pipelineSteps.preparation.count}</span>
            </div>
            <ul className="space-y-0.5">
              {pipelineSteps.preparation.children?.map((step) => (
                <li key={step.id} className="flex items-center gap-2 py-0.5 text-xs">
                  <span className={`w-4 text-center text-[11px] leading-none ${STEP_STATUS_STYLES[step.status]}`}>
                    {STEP_STATUS_ICON[step.status]}
                  </span>
                  <span className={STEP_LABEL_STYLES[step.status]}>{step.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Iterações */}
          {pipelineSteps.iterations.map((iter) => (
            <div key={iter.id} className="mb-2">
              <div className="flex items-center gap-2 py-1">
                <span className={`w-4 text-center text-[11px] leading-none ${STEP_STATUS_STYLES[iter.status]}`}>
                  {STEP_STATUS_ICON[iter.status]}
                </span>
                <span className={`flex-1 text-xs font-medium ${STEP_LABEL_STYLES[iter.status]}`}>
                  {iter.label}
                </span>
                <span className="text-[10px] text-slate-400">{iter.count}</span>
              </div>
              {/* Mostrar steps da iteração ativa ou completas */}
              {(iter.status === 'running' || iter.status === 'done' || iter.status === 'failed') && iter.children && (
                <ul className="ml-5 space-y-0.5 border-l border-slate-200 pl-2">
                  {iter.children.map((step) => (
                    <li key={step.id} className="flex items-center gap-2 py-0.5 text-xs">
                      <span className={`w-4 text-center text-[10px] leading-none ${STEP_STATUS_STYLES[step.status]}`}>
                        {STEP_STATUS_ICON[step.status]}
                      </span>
                      <span className={STEP_LABEL_STYLES[step.status]}>{step.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Finalização */}
          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-700">{pipelineSteps.finalization.label}</span>
              <span className="flex-1 border-t border-slate-200"></span>
            </div>
            <ul className="space-y-0.5">
              {pipelineSteps.finalization.children?.map((step) => (
                <li key={step.id} className="flex items-center gap-2 py-0.5 text-xs">
                  <span className={`w-4 text-center text-[11px] leading-none ${STEP_STATUS_STYLES[step.status]}`}>
                    {STEP_STATUS_ICON[step.status]}
                  </span>
                  <span className={STEP_LABEL_STYLES[step.status]}>{step.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {activeRun && TERMINAL_RUN_STATUSES.has(activeRun.status) && (
          <div className="mt-2 text-xs text-slate-500">
            Run finalizado: {statusPresentation?.label ?? STATUS_LABELS[activeRun.status]}
          </div>
        )}
      </div>
    </section>
  )
}
