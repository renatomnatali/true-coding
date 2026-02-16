import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DevelopmentActivityPanel } from './DevelopmentActivityPanel'

vi.mock('@/config/features', () => ({
  FEATURES: {
    AUTONOMOUS_DEVELOPMENT_V1: true,
  },
}))

class MockEventSource {
  static instances: MockEventSource[] = []

  url: string
  onerror: ((this: EventSource, ev: Event) => unknown) | null = null
  private listeners: Record<string, Array<(event: MessageEvent) => void>> = {}

  constructor(url: string) {
    this.url = url
    MockEventSource.instances.push(this)
  }

  addEventListener = vi.fn((eventName: string, handler: (event: MessageEvent) => void) => {
    this.listeners[eventName] ??= []
    this.listeners[eventName].push(handler)
  })
  close = vi.fn()

  emit(eventName: string, payload: Record<string, unknown>) {
    const handlers = this.listeners[eventName] ?? []
    const event = { data: JSON.stringify(payload) } as MessageEvent
    for (const handler of handlers) {
      handler(event)
    }
  }

  static reset() {
    MockEventSource.instances = []
  }

  static latest() {
    return MockEventSource.instances.at(-1) ?? null
  }
}

function runsResponse(runs: Array<Record<string, unknown>>) {
  return {
    ok: true,
    json: async () => ({ runs }),
  } as Response
}

describe('DevelopmentActivityPanel', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    MockEventSource.reset()
    vi.stubGlobal('fetch', mockFetch)
    vi.stubGlobal('EventSource', MockEventSource as unknown as typeof EventSource)
  })

  it('does not auto-start run when project reopens in GENERATING', async () => {
    mockFetch.mockResolvedValueOnce(runsResponse([]))

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Há uma geração pendente para este projeto.')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-1/development/runs')
  })

  it('requires explicit confirmation even when an active run already exists', async () => {
    mockFetch.mockResolvedValueOnce(
      runsResponse([
        {
          id: 'run-active-1',
          status: 'RUNNING',
          currentIteration: 1,
          totalIterations: 3,
          errorSummary: null,
          createdAt: '2026-02-13T15:10:00.000Z',
          startedAt: '2026-02-13T15:00:00.000Z',
          finishedAt: null,
        },
      ])
    )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continuar execução' })).toBeInTheDocument()
    })

    expect(MockEventSource.instances.length).toBe(0)
    expect(screen.queryByText('Executando')).not.toBeInTheDocument()

    const postStartCall = mockFetch.mock.calls.find(
      ([url, init]) =>
        url === '/api/projects/proj-1/development/runs' &&
        (init as { method?: string } | undefined)?.method === 'POST'
    )
    expect(postStartCall).toBeUndefined()
  })

  it('attaches run event stream only after confirming active execution resume', async () => {
    mockFetch
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-active-2',
            status: 'RUNNING',
            currentIteration: 2,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
          },
        ])
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ runId: 'run-active-2', status: 'RUNNING', alreadyProcessing: true }),
      } as Response)
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-active-2',
            status: 'RUNNING',
            currentIteration: 2,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
          },
        ])
      )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continuar execução' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Continuar execução' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/proj-1/development/runs/run-active-2/recover',
        { method: 'POST' }
      )
    })

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1)
    })

    expect(MockEventSource.latest()?.url).toContain('/api/projects/proj-1/development/runs/run-active-2/events?after=0')

    const postStartCall = mockFetch.mock.calls.find(
      ([url, init]) =>
        url === '/api/projects/proj-1/development/runs' &&
        (init as { method?: string } | undefined)?.method === 'POST'
    )
    expect(postStartCall).toBeUndefined()
  })

  it('requests manual recovery when active run is stale before attaching stream', async () => {
    mockFetch
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-stale-1',
            status: 'RUNNING',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
            isStale: true,
          },
        ])
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ runId: 'run-stale-1', status: 'RUNNING', alreadyProcessing: false }),
      } as Response)
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-stale-1',
            status: 'RUNNING',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
            isStale: false,
          },
        ])
      )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Retomar execução' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Retomar execução' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/proj-1/development/runs/run-stale-1/recover',
        { method: 'POST' }
      )
    })

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1)
    })
  })

  it('starts run only after user confirms resume', async () => {
    mockFetch
      .mockResolvedValueOnce(runsResponse([]))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ runId: 'run-1' }),
      } as Response)
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-1',
            status: 'QUEUED',
            currentIteration: 0,
            totalIterations: 0,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: null,
            finishedAt: null,
          },
        ])
      )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Retomar operação' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Retomar operação' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-1/development/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentConfirmed: true }),
      })
    })
  })

  it('shows explicit error when resume fails', async () => {
    mockFetch
      .mockResolvedValueOnce(runsResponse([]))
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Schema não migrado' }),
      } as Response)

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Retomar operação' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Retomar operação' }))

    await waitFor(() => {
      expect(screen.getByText('Schema não migrado')).toBeInTheDocument()
    })
  })

  it('recovers when backend returns RUN_ALREADY_ACTIVE during resume click', async () => {
    mockFetch
      .mockResolvedValueOnce(runsResponse([]))
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'RUN_ALREADY_ACTIVE',
          message: 'Já existe uma execução ativa para este projeto.',
        }),
      } as Response)
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-active-3',
            status: 'RUNNING',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
          },
        ])
      )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Retomar operação' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Retomar operação' }))

    await waitFor(() => {
      expect(screen.getByText('Executando')).toBeInTheDocument()
    })

    expect(
      screen.queryByText('Já existe uma execução ativa para este projeto.')
    ).not.toBeInTheDocument()
  })

  it('shows clear completion status when run is completed', async () => {
    mockFetch.mockResolvedValueOnce(
      runsResponse([
        {
          id: 'run-3',
          status: 'SUCCEEDED',
          currentIteration: 3,
          totalIterations: 3,
          errorSummary: null,
          createdAt: '2026-02-13T15:10:00.000Z',
          startedAt: '2026-02-13T15:00:00.000Z',
          finishedAt: '2026-02-13T15:10:00.000Z',
        },
      ])
    )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="LIVE"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Concluído')).toBeInTheDocument()
    })

    expect(screen.queryByText('Aguardando confirmação')).not.toBeInTheDocument()
  })

  it('does not show waiting confirmation when latest run is terminal even if project status is stale GENERATING', async () => {
    const onProjectStatusChange = vi.fn()

    mockFetch.mockResolvedValueOnce(
      runsResponse([
        {
          id: 'run-terminal-stale',
          status: 'CANCELED',
          currentIteration: 1,
          totalIterations: 3,
          errorSummary: 'Execução anterior cancelada',
          createdAt: '2026-02-13T15:10:00.000Z',
          startedAt: '2026-02-13T15:00:00.000Z',
          finishedAt: '2026-02-13T15:08:00.000Z',
        },
      ])
    )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
        onProjectStatusChange={onProjectStatusChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Iniciar nova run' })).toBeInTheDocument()
    })

    expect(screen.queryByText('Aguardando confirmação')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retomar operação' })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(onProjectStatusChange).toHaveBeenCalledWith('FAILED')
    })
  })

  it('starts a new run from terminal status via explicit action button', async () => {
    mockFetch
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-terminal-1',
            status: 'CANCELED',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: 'Execução anterior cancelada',
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: '2026-02-13T15:08:00.000Z',
          },
        ])
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ runId: 'run-new-1', status: 'QUEUED' }),
      } as Response)
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-new-1',
            status: 'QUEUED',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:20:00.000Z',
            startedAt: null,
            finishedAt: null,
          },
        ])
      )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="FAILED"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Iniciar nova run' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova run' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-1/development/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentConfirmed: true }),
      })
    })
  })

  it('shows only latest agent status and never renders Invalid Date', async () => {
    mockFetch.mockResolvedValueOnce(
      runsResponse([
        {
          id: 'run-4',
          status: 'SUCCEEDED',
          currentIteration: 3,
          totalIterations: 3,
          errorSummary: null,
          createdAt: '2026-02-13T15:10:00.000Z',
          startedAt: '2026-02-13T15:00:00.000Z',
          finishedAt: '2026-02-13T15:10:00.000Z',
        },
      ])
    )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="LIVE"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Concluído')).toBeInTheDocument()
    })

    const source = MockEventSource.latest()
    expect(source).not.toBeNull()

    act(() => {
      source!.emit('agent_task', {
        id: 'evt-running',
        runId: 'run-4',
        sequence: 1,
        eventType: 'agent_task',
        payload: { taskId: 'task-deploy-3', agentName: 'DeployAgent', status: 'RUNNING' },
        createdAt: '2026-02-13T12:56:39.000Z',
      })
    })

    act(() => {
      source!.emit('agent_task', {
        id: 'evt-succeeded',
        runId: 'run-4',
        sequence: 2,
        eventType: 'agent_task',
        payload: { taskId: 'task-deploy-3', agentName: 'DeployAgent', status: 'SUCCEEDED' },
        createdAt: '2026-02-13T12:56:40.000Z',
      })
    })

    act(() => {
      source!.emit('info', {
        id: 'evt-info',
        runId: 'run-4',
        sequence: 3,
        eventType: 'info',
        message: 'Evento sem data válida',
        createdAt: 'not-a-date',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('DeployAgent: SUCCEEDED')).toBeInTheDocument()
    })

    expect(screen.queryByText('DeployAgent: RUNNING')).not.toBeInTheDocument()
    expect(screen.queryByText('Invalid Date')).not.toBeInTheDocument()
  })

  it('renders failure detail for quality gate events', async () => {
    mockFetch
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-5',
            status: 'RUNNING',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
          },
        ])
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ runId: 'run-5', status: 'RUNNING', alreadyProcessing: true }),
      } as Response)
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-5',
            status: 'RUNNING',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
          },
        ])
      )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continuar execução' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Continuar execução' }))

    await waitFor(() => {
      expect(screen.getByText('Executando')).toBeInTheDocument()
    })

    const source = MockEventSource.latest()
    expect(source).not.toBeNull()

    act(() => {
      source!.emit('quality_gate', {
        id: 'evt-gate-fail',
        runId: 'run-5',
        sequence: 1,
        eventType: 'quality_gate',
        payload: {
          gateType: 'BUILD',
          passed: false,
          summary: 'workspace_not_prepared',
        },
        createdAt: '2026-02-13T12:56:39.000Z',
      })
    })

    await waitFor(() => {
      expect(
        screen.getByText('BUILD: FALHOU (workspace_not_prepared)')
      ).toBeInTheDocument()
    })
  })

  it('renders skipped label for dependent quality gates', async () => {
    mockFetch
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-5b',
            status: 'RUNNING',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
          },
        ])
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ runId: 'run-5b', status: 'RUNNING', alreadyProcessing: true }),
      } as Response)
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-5b',
            status: 'RUNNING',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
          },
        ])
      )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continuar execução' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Continuar execução' }))

    await waitFor(() => {
      expect(screen.getByText('Executando')).toBeInTheDocument()
    })

    const source = MockEventSource.latest()
    expect(source).not.toBeNull()

    act(() => {
      source!.emit('quality_gate', {
        id: 'evt-gate-skipped',
        runId: 'run-5b',
        sequence: 1,
        eventType: 'quality_gate',
        payload: {
          gateType: 'UNIT',
          passed: false,
          summary: 'skipped_due_to_previous_failure',
        },
        createdAt: '2026-02-13T12:56:39.000Z',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('UNIT: PULADO (dependência anterior falhou)')).toBeInTheDocument()
    })
  })

  it('renders release checkpoint events with explicit phase/step summary', async () => {
    mockFetch
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-5c',
            status: 'RUNNING',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
          },
        ])
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ runId: 'run-5c', status: 'RUNNING', alreadyProcessing: true }),
      } as Response)
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-5c',
            status: 'RUNNING',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
          },
        ])
      )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continuar execução' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Continuar execução' }))

    await waitFor(() => {
      expect(screen.getByText('Executando')).toBeInTheDocument()
    })

    const source = MockEventSource.latest()
    expect(source).not.toBeNull()

    act(() => {
      source!.emit('info', {
        id: 'evt-release-clone',
        runId: 'run-5c',
        sequence: 1,
        eventType: 'info',
        message: 'Release checkpoint',
        payload: {
          phase: 'release',
          step: 'clone',
          summary: 'ok',
        },
        createdAt: '2026-02-13T12:56:39.000Z',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Release clone: ok')).toBeInTheDocument()
    })
  })

  it('shows recovery actions when run is waiting checkpoint', async () => {
    mockFetch.mockResolvedValueOnce(
      runsResponse([
        {
          id: 'run-6',
          status: 'WAITING_CHECKPOINT',
          currentIteration: 1,
          totalIterations: 3,
          errorSummary: 'Iteration 1 failed after retries',
          createdAt: '2026-02-13T15:10:00.000Z',
          startedAt: '2026-02-13T15:00:00.000Z',
          finishedAt: null,
        },
      ])
    )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="FAILED"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Ação necessária para continuar')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Retomar checkpoint' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente iteração' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar execução' })).toBeInTheDocument()
  })

  it('calls retry endpoint when user clicks retry action', async () => {
    mockFetch
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-7',
            status: 'WAITING_CHECKPOINT',
            currentIteration: 2,
            totalIterations: 3,
            errorSummary: 'Iteration 2 failed after retries',
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
          },
        ])
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ runId: 'run-7', status: 'RUNNING' }),
      } as Response)
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-7',
            status: 'RUNNING',
            currentIteration: 2,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
          },
        ])
      )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="FAILED"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Tentar novamente iteração' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente iteração' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/proj-1/development/runs/run-7/retry',
        {
          method: 'POST',
        }
      )
    })
  })

  it('hides stale events from previous attempt after retry action status event', async () => {
    mockFetch.mockResolvedValueOnce(
      runsResponse([
        {
          id: 'run-8',
          status: 'WAITING_CHECKPOINT',
          currentIteration: 1,
          totalIterations: 3,
          errorSummary: 'Iteration 1 failed after retries',
          createdAt: '2026-02-13T15:10:00.000Z',
          startedAt: '2026-02-13T15:00:00.000Z',
          finishedAt: null,
        },
      ])
    )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="FAILED"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Aguardando checkpoint')).toBeInTheDocument()
    })

    const source = MockEventSource.latest()
    expect(source).not.toBeNull()

    act(() => {
      source!.emit('quality_gate', {
        id: 'evt-old-gate',
        runId: 'run-8',
        sequence: 1,
        eventType: 'quality_gate',
        payload: { gateType: 'BUILD', passed: false },
        createdAt: '2026-02-13T12:56:01.000Z',
      })
    })

    act(() => {
      source!.emit('error', {
        id: 'evt-old-error',
        runId: 'run-8',
        sequence: 2,
        eventType: 'error',
        message: 'Iteration 1 failed after retries',
        createdAt: '2026-02-13T12:56:02.000Z',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('BUILD: FALHOU')).toBeInTheDocument()
      expect(
        screen.getAllByText('Iteration 1 failed after retries').length
      ).toBeGreaterThanOrEqual(1)
    })

    act(() => {
      source!.emit('run_status', {
        id: 'evt-retry',
        runId: 'run-8',
        sequence: 3,
        eventType: 'run_status',
        payload: { status: 'RUNNING', action: 'retry', iterationIndex: 1 },
        createdAt: '2026-02-13T12:57:00.000Z',
      })
    })

    act(() => {
      source!.emit('agent_task', {
        id: 'evt-new-task',
        runId: 'run-8',
        sequence: 4,
        eventType: 'agent_task',
        payload: {
          taskId: 'task-spec-retry',
          agentName: 'SpecAgent',
          status: 'RUNNING',
        },
        createdAt: '2026-02-13T12:57:01.000Z',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Run: RUNNING')).toBeInTheDocument()
      expect(screen.getByText('SpecAgent: RUNNING')).toBeInTheDocument()
    })

    expect(screen.queryByText('BUILD: FALHOU')).not.toBeInTheDocument()
    expect(screen.queryByText('Iteration 1 failed after retries')).not.toBeInTheDocument()
  })

  it('hides stale events when retry status arrives only with retry message', async () => {
    mockFetch.mockResolvedValueOnce(
      runsResponse([
        {
          id: 'run-9',
          status: 'WAITING_CHECKPOINT',
          currentIteration: 1,
          totalIterations: 3,
          errorSummary: 'Iteration 1 failed after retries',
          createdAt: '2026-02-13T15:10:00.000Z',
          startedAt: '2026-02-13T15:00:00.000Z',
          finishedAt: null,
        },
      ])
    )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="FAILED"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Aguardando checkpoint')).toBeInTheDocument()
    })

    const source = MockEventSource.latest()
    expect(source).not.toBeNull()

    act(() => {
      source!.emit('quality_gate', {
        id: 'evt-old-gate-2',
        runId: 'run-9',
        sequence: 1,
        eventType: 'quality_gate',
        payload: { gateType: 'UNIT', passed: false },
        createdAt: '2026-02-13T12:56:01.000Z',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('UNIT: FALHOU')).toBeInTheDocument()
    })

    act(() => {
      source!.emit('run_status', {
        id: 'evt-retry-message-only',
        runId: 'run-9',
        sequence: 2,
        eventType: 'run_status',
        message: 'Run retry requested',
        payload: { status: 'RUNNING', iterationIndex: 1 },
        createdAt: '2026-02-13T12:57:00.000Z',
      })
    })

    act(() => {
      source!.emit('agent_task', {
        id: 'evt-new-task-2',
        runId: 'run-9',
        sequence: 3,
        eventType: 'agent_task',
        payload: {
          taskId: 'task-test-retry',
          agentName: 'TestAgent',
          status: 'RUNNING',
        },
        createdAt: '2026-02-13T12:57:01.000Z',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('TestAgent: RUNNING')).toBeInTheDocument()
    })

    expect(screen.queryByText('UNIT: FALHOU')).not.toBeInTheDocument()
  })

  it('hides stale events when manual resume status arrives from recover action', async () => {
    mockFetch
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-10',
            status: 'RUNNING',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
            isStale: false,
          },
        ])
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ runId: 'run-10', status: 'RUNNING', alreadyProcessing: true }),
      } as Response)
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-10',
            status: 'RUNNING',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
            isStale: false,
          },
        ])
      )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continuar execução' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Continuar execução' }))

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1)
    })

    const source = MockEventSource.latest()
    expect(source).not.toBeNull()

    act(() => {
      source!.emit('quality_gate', {
        id: 'evt-old-gate-manual',
        runId: 'run-10',
        sequence: 100,
        eventType: 'quality_gate',
        payload: { gateType: 'BUILD', passed: false },
        createdAt: '2026-02-13T16:19:40.000Z',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('BUILD: FALHOU')).toBeInTheDocument()
    })

    act(() => {
      source!.emit('run_status', {
        id: 'evt-manual-resume',
        runId: 'run-10',
        sequence: 150,
        eventType: 'run_status',
        message: 'Run manually resumed by user',
        payload: { status: 'RUNNING', action: 'manual_resume' },
        createdAt: '2026-02-13T19:07:56.000Z',
      })
    })

    act(() => {
      source!.emit('agent_task', {
        id: 'evt-new-manual-task',
        runId: 'run-10',
        sequence: 151,
        eventType: 'agent_task',
        payload: {
          taskId: 'task-code-manual',
          agentName: 'CodeAgent',
          status: 'RUNNING',
        },
        createdAt: '2026-02-13T19:07:57.000Z',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('CodeAgent: RUNNING')).toBeInTheDocument()
    })

    expect(screen.queryByText('BUILD: FALHOU')).not.toBeInTheDocument()
  })

  it('hides stale events when RUNNING status arrives after checkpoint without action', async () => {
    mockFetch
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-11',
            status: 'RUNNING',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
            isStale: false,
          },
        ])
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ runId: 'run-11', status: 'RUNNING', alreadyProcessing: true }),
      } as Response)
      .mockResolvedValueOnce(
        runsResponse([
          {
            id: 'run-11',
            status: 'RUNNING',
            currentIteration: 1,
            totalIterations: 3,
            errorSummary: null,
            createdAt: '2026-02-13T15:10:00.000Z',
            startedAt: '2026-02-13T15:00:00.000Z',
            finishedAt: null,
            isStale: false,
          },
        ])
      )

    render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continuar execução' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Continuar execução' }))

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1)
    })

    const source = MockEventSource.latest()
    expect(source).not.toBeNull()

    act(() => {
      source!.emit('quality_gate', {
        id: 'evt-old-build-fail',
        runId: 'run-11',
        sequence: 200,
        eventType: 'quality_gate',
        payload: { gateType: 'BUILD', passed: false },
        createdAt: '2026-02-13T16:19:40.000Z',
      })
    })

    act(() => {
      source!.emit('run_status', {
        id: 'evt-waiting',
        runId: 'run-11',
        sequence: 210,
        eventType: 'run_status',
        message: 'Run waiting checkpoint',
        payload: { status: 'WAITING_CHECKPOINT', iterationIndex: 1 },
        createdAt: '2026-02-13T19:07:55.000Z',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('BUILD: FALHOU')).toBeInTheDocument()
    })

    act(() => {
      source!.emit('run_status', {
        id: 'evt-running-no-action',
        runId: 'run-11',
        sequence: 220,
        eventType: 'run_status',
        message: 'Run resumed from checkpoint',
        payload: { status: 'RUNNING', iterationIndex: 1 },
        createdAt: '2026-02-13T19:07:56.000Z',
      })
    })

    act(() => {
      source!.emit('agent_task', {
        id: 'evt-new-task-no-action',
        runId: 'run-11',
        sequence: 221,
        eventType: 'agent_task',
        payload: {
          taskId: 'task-spec-no-action',
          agentName: 'SpecAgent',
          status: 'RUNNING',
        },
        createdAt: '2026-02-13T19:07:57.000Z',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('SpecAgent: RUNNING')).toBeInTheDocument()
    })

    expect(screen.queryByText('BUILD: FALHOU')).not.toBeInTheDocument()
  })
})
