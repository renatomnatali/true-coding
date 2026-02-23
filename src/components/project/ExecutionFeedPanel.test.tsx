import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExecutionFeedPanel } from './ExecutionFeedPanel'

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

  static latest() {
    return MockEventSource.instances.at(-1) ?? null
  }

  static reset() {
    MockEventSource.instances = []
  }
}

function runsResponse(runs: Array<Record<string, unknown>>) {
  return {
    ok: true,
    json: async () => ({ runs }),
  } as Response
}

describe('ExecutionFeedPanel', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    MockEventSource.reset()
    vi.stubGlobal('fetch', mockFetch)
    vi.stubGlobal('EventSource', MockEventSource as unknown as typeof EventSource)
  })

  it('exibe estado vazio quando não há run para acompanhar', async () => {
    mockFetch.mockResolvedValueOnce(runsResponse([]))

    render(
      <ExecutionFeedPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Nenhuma execução ativa no momento.')).toBeInTheDocument()
    })

    expect(MockEventSource.instances.length).toBe(0)
  })

  it('mostra arquivo atual em tempo real e permite alternar entre resumo e técnico', async () => {
    mockFetch.mockResolvedValueOnce(
      runsResponse([
        {
          id: 'run-1',
          status: 'RUNNING',
          currentIteration: 1,
          totalIterations: 3,
          errorSummary: null,
          createdAt: '2026-02-23T15:00:00.000Z',
          startedAt: '2026-02-23T15:00:00.000Z',
          finishedAt: null,
        },
      ])
    )

    render(
      <ExecutionFeedPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1)
    })

    const source = MockEventSource.latest()
    expect(source).not.toBeNull()

    act(() => {
      source?.emit('info', {
        id: 'evt-info',
        runId: 'run-1',
        sequence: 1,
        eventType: 'info',
        message: 'Detalhe técnico interno',
        createdAt: '2026-02-23T15:00:10.000Z',
      })
      source?.emit('agent_task', {
        id: 'evt-file',
        runId: 'run-1',
        sequence: 2,
        eventType: 'agent_task',
        message: 'FileGen running',
        payload: {
          agentName: 'FileGen',
          status: 'RUNNING',
          filePath: 'src/app/page.tsx',
        },
        createdAt: '2026-02-23T15:00:11.000Z',
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId('execution-current-activity')).toHaveTextContent(
        'Agora: Gerando src/app/page.tsx'
      )
    })

    expect(screen.queryByText('Detalhe técnico interno')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Técnico' }))

    await waitFor(() => {
      expect(screen.getByText('Detalhe técnico interno')).toBeInTheDocument()
    })
  })

  it('mostra diagnóstico de gate no resumo e preflight no modo técnico', async () => {
    mockFetch.mockResolvedValueOnce(
      runsResponse([
        {
          id: 'run-3',
          status: 'RUNNING',
          currentIteration: 1,
          totalIterations: 3,
          errorSummary: null,
          createdAt: '2026-02-23T15:00:00.000Z',
          startedAt: '2026-02-23T15:00:00.000Z',
          finishedAt: null,
        },
      ])
    )

    render(
      <ExecutionFeedPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1)
    })

    const source = MockEventSource.latest()
    expect(source).not.toBeNull()

    act(() => {
      source?.emit('quality_gate', {
        id: 'evt-gate-1',
        runId: 'run-3',
        sequence: 1,
        eventType: 'quality_gate',
        message: 'BUILD gate failed',
        payload: {
          gateType: 'BUILD',
          passed: false,
          reason: 'workspace_not_prepared',
          diagnosticSnippet: 'workspace_not_prepared: package.json não encontrado no sandbox.',
        },
        createdAt: '2026-02-23T15:00:10.000Z',
      })
      source?.emit('info', {
        id: 'evt-info-preflight',
        runId: 'run-3',
        sequence: 2,
        eventType: 'info',
        message: 'Preflight de quality gates concluído',
        payload: {
          phase: 'quality_gate_preflight',
          workspacePath: '/tmp/true-coding-run-3',
          hasPackageJson: false,
          hasNodeModules: false,
        },
        createdAt: '2026-02-23T15:00:11.000Z',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Motivo: workspace_not_prepared')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Trecho técnico: workspace_not_prepared: package.json não encontrado no sandbox.'
        )
      ).toBeInTheDocument()
    })

    expect(screen.queryByText('Preflight dos quality gates')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Técnico' }))

    await waitFor(() => {
      expect(screen.getByText('Preflight dos quality gates')).toBeInTheDocument()
      expect(screen.getByText('Workspace: /tmp/true-coding-run-3')).toBeInTheDocument()
      expect(screen.getByText('package.json: ausente')).toBeInTheDocument()
      expect(screen.getByText('node_modules: ausente')).toBeInTheDocument()
    })
  })

  it('reconecta com cursor after e evita duplicidade por sequence', async () => {
    mockFetch.mockResolvedValueOnce(
      runsResponse([
        {
          id: 'run-2',
          status: 'RUNNING',
          currentIteration: 1,
          totalIterations: 3,
          errorSummary: null,
          createdAt: '2026-02-23T15:00:00.000Z',
          startedAt: '2026-02-23T15:00:00.000Z',
          finishedAt: null,
        },
      ])
    )

    render(
      <ExecutionFeedPanel
        projectId="proj-1"
        projectStatus="GENERATING"
      />
    )

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1)
    })

    const first = MockEventSource.latest()
    expect(first).not.toBeNull()

    act(() => {
      first?.emit('run_status', {
        id: 'evt-1',
        runId: 'run-2',
        sequence: 8,
        eventType: 'run_status',
        payload: { status: 'RUNNING' },
        createdAt: '2026-02-23T15:00:10.000Z',
      })
    })

    act(() => {
      first?.onerror?.call(first as unknown as EventSource, new Event('error'))
    })

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(2)
    })

    const second = MockEventSource.latest()
    expect(second?.url).toContain('/api/projects/proj-1/development/runs/run-2/events?after=8')

    act(() => {
      second?.emit('run_status', {
        id: 'evt-duplicado',
        runId: 'run-2',
        sequence: 8,
        eventType: 'run_status',
        payload: { status: 'RUNNING' },
        createdAt: '2026-02-23T15:00:11.000Z',
      })
      second?.emit('run_status', {
        id: 'evt-novo',
        runId: 'run-2',
        sequence: 9,
        eventType: 'run_status',
        payload: { status: 'WAITING_CHECKPOINT' },
        createdAt: '2026-02-23T15:00:12.000Z',
      })
    })

    await waitFor(() => {
      expect(screen.getAllByTestId('execution-event-row')).toHaveLength(2)
    })
  })
})
