'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DevelopmentEvent, DevelopmentRunStatus } from '@/types'

interface ExecutionFeedPanelProps {
  projectId: string
  projectStatus: string
}

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
}

interface RunsResponse {
  runs: DevelopmentRunSummary[]
}

type VerbosityMode = 'summary' | 'technical'

const RUN_STATUS_LABELS: Record<DevelopmentRunStatus, string> = {
  QUEUED: 'Na fila',
  RUNNING: 'Executando',
  WAITING_CHECKPOINT: 'Aguardando ação',
  FAILED: 'Falhou',
  CANCELED: 'Cancelado',
  SUCCEEDED: 'Concluído',
}

const RUN_STATUS_STYLES: Record<DevelopmentRunStatus, string> = {
  QUEUED: 'bg-slate-100 text-slate-700',
  RUNNING: 'bg-blue-100 text-blue-700',
  WAITING_CHECKPOINT: 'bg-amber-100 text-amber-800',
  FAILED: 'bg-red-100 text-red-700',
  CANCELED: 'bg-zinc-100 text-zinc-700',
  SUCCEEDED: 'bg-emerald-100 text-emerald-700',
}

function formatTime(iso: string | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatGateEvent(event: DevelopmentEvent): string {
  const payload = event.payload ?? {}
  const gateType = typeof payload.gateType === 'string' ? payload.gateType : 'GATE'
  const passed = payload.passed === true
  const skipped = payload.skipped === true

  if (skipped) {
    return `${gateType} pulado`
  }

  return `${gateType} ${passed ? 'aprovado' : 'falhou'}`
}

function formatAgentTaskEvent(event: DevelopmentEvent): string {
  const payload = event.payload ?? {}
  const status = typeof payload.status === 'string' ? payload.status : null
  const agentName = typeof payload.agentName === 'string' ? payload.agentName : 'Agente'
  const filePath = typeof payload.filePath === 'string' ? payload.filePath : null

  if (filePath) {
    if (status === 'RUNNING') return `Gerando arquivo: ${filePath}`
    if (status === 'SUCCEEDED') return `Arquivo gerado: ${filePath}`
    if (status === 'FAILED') return `Falha ao gerar arquivo: ${filePath}`
    return `Arquivo: ${filePath}`
  }

  if (status === 'RUNNING') return `${agentName} em execução`
  if (status === 'SUCCEEDED') return `${agentName} concluído`
  if (status === 'FAILED') return `${agentName} falhou`

  return event.message ?? `${agentName}`
}

function formatRunStatusEvent(event: DevelopmentEvent): string {
  const payload = event.payload ?? {}
  const status = typeof payload.status === 'string' ? payload.status : null
  if (!status) return event.message ?? 'Status da run atualizado'

  const statusLabel = RUN_STATUS_LABELS[status as DevelopmentRunStatus]
  return statusLabel ? `Run: ${statusLabel.toLowerCase()}` : `Run: ${status}`
}

function formatIterationEvent(event: DevelopmentEvent): string {
  const payload = event.payload ?? {}
  const iterationIndex =
    typeof payload.iterationIndex === 'number' ? payload.iterationIndex : null
  const status = typeof payload.status === 'string' ? payload.status : null

  if (iterationIndex === null && !status) {
    return event.message ?? 'Iteração atualizada'
  }

  const statusLabel = status ? status.toLowerCase() : 'atualizada'
  const iterationLabel = iterationIndex !== null ? `Iteração ${iterationIndex}` : 'Iteração'
  return `${iterationLabel}: ${statusLabel}`
}

function formatDeployEvent(event: DevelopmentEvent): string {
  const payload = event.payload ?? {}
  const status = typeof payload.status === 'string' ? payload.status : null
  if (!status) return event.message ?? 'Deploy atualizado'
  return `Deploy: ${status.toLowerCase()}`
}

function formatEventLine(event: DevelopmentEvent): string {
  switch (event.eventType) {
    case 'run_status':
      return formatRunStatusEvent(event)
    case 'iteration_status':
      return formatIterationEvent(event)
    case 'agent_task':
      return formatAgentTaskEvent(event)
    case 'quality_gate':
      return formatGateEvent(event)
    case 'deploy_status':
      return formatDeployEvent(event)
    case 'error':
      return event.message ?? 'Erro na execução'
    case 'info':
      return event.message ?? 'Atualização de execução'
    default:
      return event.message ?? 'Evento de execução'
  }
}

function getEventToneClasses(event: DevelopmentEvent): string {
  if (event.eventType === 'error') return 'border-red-200 bg-red-50'
  if (event.eventType === 'quality_gate') {
    const passed = event.payload?.passed === true
    return passed ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
  }
  if (event.eventType === 'agent_task') return 'border-blue-200 bg-blue-50'
  return 'border-slate-200 bg-white'
}

function isSummaryEvent(event: DevelopmentEvent): boolean {
  if (event.eventType === 'run_status') return true
  if (event.eventType === 'iteration_status') return true
  if (event.eventType === 'quality_gate') return true
  if (event.eventType === 'deploy_status') return true
  if (event.eventType === 'error') return true

  if (event.eventType === 'agent_task') {
    const payload = event.payload ?? {}
    const status = typeof payload.status === 'string' ? payload.status : null
    const filePath = typeof payload.filePath === 'string' ? payload.filePath : null
    const agentName = typeof payload.agentName === 'string' ? payload.agentName : ''

    if (filePath) return true
    if (status === 'FAILED' || status === 'RUNNING') return true
    if (agentName === 'SpecAgent' || agentName === 'TestAgent' || agentName === 'CodeAgent' || agentName === 'ReviewAgent') {
      return true
    }
  }

  return false
}

function extractCurrentActivity(events: DevelopmentEvent[], run: DevelopmentRunSummary | null): string {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i]
    if (event.eventType !== 'agent_task') continue

    const payload = event.payload ?? {}
    const status = typeof payload.status === 'string' ? payload.status : null
    if (status !== 'RUNNING') continue

    const filePath = typeof payload.filePath === 'string' ? payload.filePath : null
    if (filePath) return `Gerando ${filePath}`

    const agentName = typeof payload.agentName === 'string' ? payload.agentName : 'Agente'
    return `${agentName} em execução`
  }

  if (!run) return 'Aguardando execução'
  return `Run ${RUN_STATUS_LABELS[run.status].toLowerCase()}`
}

function pickRun(runs: DevelopmentRunSummary[]): DevelopmentRunSummary | null {
  if (runs.length === 0) return null
  return (
    runs.find((run) => run.status === 'RUNNING') ??
    runs.find((run) => run.status === 'QUEUED') ??
    runs.find((run) => run.status === 'WAITING_CHECKPOINT') ??
    runs[0]
  )
}

export function ExecutionFeedPanel({ projectId, projectStatus }: ExecutionFeedPanelProps) {
  const [activeRun, setActiveRun] = useState<DevelopmentRunSummary | null>(null)
  const [events, setEvents] = useState<DevelopmentEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [verbosity, setVerbosity] = useState<VerbosityMode>('summary')
  const [reconnectNonce, setReconnectNonce] = useState(0)
  const lastSequenceRef = useRef(0)

  const fetchRuns = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/development/runs`)
      if (!response.ok) {
        throw new Error('Falha ao carregar runs')
      }

      const data = (await response.json()) as RunsResponse
      const nextRun = pickRun(data.runs || [])

      setActiveRun((current) => {
        if (!current || !nextRun || current.id !== nextRun.id) {
          lastSequenceRef.current = 0
          setEvents([])
          setReconnectNonce(0)
        }
        return nextRun
      })

      setLoadError(null)
    } catch {
      setLoadError('Não foi possível carregar o feed de execução.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void fetchRuns()
  }, [fetchRuns])

  useEffect(() => {
    const shouldPoll =
      projectStatus === 'GENERATING' ||
      projectStatus === 'DEPLOYING' ||
      activeRun?.status === 'RUNNING' ||
      activeRun?.status === 'QUEUED'

    if (!shouldPoll) return

    const timer = setInterval(() => {
      void fetchRuns()
    }, 5000)

    return () => clearInterval(timer)
  }, [activeRun?.status, fetchRuns, projectStatus])

  useEffect(() => {
    if (!activeRun?.id) return

    const source = new EventSource(
      `/api/projects/${projectId}/development/runs/${activeRun.id}/events?after=${lastSequenceRef.current}`
    )

    const handleIncoming = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as DevelopmentEvent
        if (typeof parsed.sequence !== 'number') return
        if (parsed.sequence <= lastSequenceRef.current) return

        lastSequenceRef.current = parsed.sequence

        setEvents((prev) => {
          const next = [...prev, parsed]
          return next.slice(-200)
        })
      } catch {
        // Ignore malformed event payloads
      }
    }

    const eventNames: Array<DevelopmentEvent['eventType'] | 'done'> = [
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
      source.addEventListener(eventName, handleIncoming)
    }

    source.onerror = () => {
      source.close()
      setReconnectNonce((current) => current + 1)
    }

    return () => {
      source.close()
    }
  }, [activeRun?.id, projectId, reconnectNonce])

  const visibleEvents = useMemo(() => {
    const base = verbosity === 'technical' ? events : events.filter(isSummaryEvent)
    return [...base].reverse()
  }, [events, verbosity])

  const currentActivity = useMemo(
    () => extractCurrentActivity(events, activeRun),
    [events, activeRun]
  )

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-slate-600">
        Carregando execução...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {loadError}
      </div>
    )
  }

  if (!activeRun) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        Nenhuma execução ativa no momento.
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${RUN_STATUS_STYLES[activeRun.status]}`}
          >
            {RUN_STATUS_LABELS[activeRun.status]}
          </span>
          <span className="text-xs text-slate-500">
            Iteração {Math.max(activeRun.currentIteration, 1)} de {Math.max(activeRun.totalIterations, 1)}
          </span>
        </div>
        <div data-testid="execution-current-activity" className="text-sm text-slate-800">
          <span className="font-medium">Agora:</span>{' '}
          {currentActivity}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVerbosity('summary')}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              verbosity === 'summary'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            Resumo
          </button>
          <button
            type="button"
            onClick={() => setVerbosity('technical')}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              verbosity === 'technical'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            Técnico
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1" aria-live="polite">
        {visibleEvents.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-500">
            Aguardando primeiros eventos da execução...
          </div>
        ) : (
          <div className="space-y-2">
            {visibleEvents.map((event) => (
              <div
                key={`${event.runId}-${event.sequence}`}
                data-testid="execution-event-row"
                className={`rounded-md border p-2.5 ${getEventToneClasses(event)}`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {event.eventType.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {formatTime(event.createdAt)}
                  </span>
                </div>
                <div className="text-sm text-slate-800">
                  {formatEventLine(event)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
