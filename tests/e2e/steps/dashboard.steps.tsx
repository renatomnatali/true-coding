/**
 * @file Dashboard Tests (Sprint 1)
 * @description TDD tests based on mockup: mockups/dashboard/list.html
 *
 * These tests verify dashboard behavior as specified in the mockup:
 * - Stats row with project counts
 * - Filter tabs (Todos, Em progresso, Concluidos, Arquivados)
 * - Project cards with progress dots and phase labels
 * - Quick actions section
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Import components after mocks
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { FilterTabs, FilterType, SortType } from '@/components/dashboard/FilterTabs'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { ToastProvider } from '@/components/ui/toast'

// Helper to wrap component with ToastProvider
function withToastProvider(component: React.ReactNode) {
  return <ToastProvider>{component}</ToastProvider>
}

// Sample projects for testing
const sampleProjects = [
  {
    id: '1',
    name: 'Meu App Delivery',
    description: 'Aplicativo para gerenciar entregas',
    status: 'IDEATION',
    updatedAt: new Date('2026-02-03T10:00:00'),
  },
  {
    id: '2',
    name: 'Portfolio Pessoal',
    description: 'Site pessoal com portfolio',
    status: 'PLANNING',
    updatedAt: new Date('2026-02-02T10:00:00'),
  },
  {
    id: '3',
    name: 'SaaS Dashboard',
    description: 'Painel de metricas',
    status: 'GENERATING',
    updatedAt: new Date('2026-02-03T12:00:00'),
  },
  {
    id: '4',
    name: 'API de Pagamentos',
    description: 'Integracao com gateways',
    status: 'LIVE',
    updatedAt: new Date('2026-01-30T10:00:00'),
  },
]

/**
 * =============================================================================
 * CENARIOS: STATS ROW
 * =============================================================================
 */
describe('Dashboard: Stats Row', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Cenario: Exibir contadores de projetos
   * Dado que tenho 4 projetos (1 LIVE, 3 em progresso)
   * Quando vejo a stats row
   * Entao vejo "4" em Projetos totais
   * E vejo "1" em Online
   * E vejo "3" em Em progresso
   */
  it('Exibe contadores de projetos corretamente', () => {
    const stats = {
      total: 4,
      online: 1,
      inProgress: 3,
      avgTime: '~12h',
    }

    render(<StatsRow stats={stats} />)

    // Verifica os valores
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('~12h')).toBeInTheDocument()

    // Verifica os labels
    expect(screen.getByText(/projetos/i)).toBeInTheDocument()
    expect(screen.getByText(/online/i)).toBeInTheDocument()
    expect(screen.getByText(/em progresso/i)).toBeInTheDocument()
  })
})

/**
 * =============================================================================
 * CENARIOS: FILTER TABS
 * =============================================================================
 */
describe('Dashboard: Filter Tabs', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Cenario: Exibir tabs de filtro com contadores
   */
  it('Exibe tabs de filtro com contadores', () => {
    const counts = { all: 4, inProgress: 3, completed: 1, archived: 0 }

    render(
      <FilterTabs
        activeFilter="all"
        onFilterChange={vi.fn()}
        sortBy="recent"
        onSortChange={vi.fn()}
        counts={counts}
      />
    )

    expect(screen.getByText(/todos/i)).toBeInTheDocument()
    expect(screen.getByText(/em progresso/i)).toBeInTheDocument()
    expect(screen.getByText(/concluidos/i)).toBeInTheDocument()
    expect(screen.getByText(/arquivados/i)).toBeInTheDocument()
  })

  /**
   * Cenario: Mudar filtro ao clicar em tab
   */
  it('Chama onFilterChange ao clicar em tab', async () => {
    const onFilterChange = vi.fn()
    const counts = { all: 4, inProgress: 3, completed: 1, archived: 0 }

    render(
      <FilterTabs
        activeFilter="all"
        onFilterChange={onFilterChange}
        sortBy="recent"
        onSortChange={vi.fn()}
        counts={counts}
      />
    )

    await userEvent.click(screen.getByText(/em progresso/i))
    expect(onFilterChange).toHaveBeenCalledWith('in_progress')
  })

  /**
   * Cenario: Exibir select de ordenacao
   */
  it('Exibe select de ordenacao', () => {
    const counts = { all: 4, inProgress: 3, completed: 1, archived: 0 }

    render(
      <FilterTabs
        activeFilter="all"
        onFilterChange={vi.fn()}
        sortBy="recent"
        onSortChange={vi.fn()}
        counts={counts}
      />
    )

    // Verifica se existe um select ou combobox
    const sortSelect = screen.getByRole('combobox')
    expect(sortSelect).toBeInTheDocument()
  })
})

/**
 * =============================================================================
 * CENARIOS: PROJECT CARD
 * =============================================================================
 */
describe('Dashboard: Project Card', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Cenario: Exibir card de projeto com progress dots
   * Conforme mockup, o card deve ter:
   * - Nome do projeto
   * - Descricao
   * - Progress dots (6 fases)
   * - Label da fase atual
   * - Meta de atualizacao
   */
  it('Exibe card com progress dots e fase', () => {
    render(
      <ProjectCard
        id="1"
        name="Meu App Delivery"
        description="Aplicativo para gerenciar entregas"
        status="IDEATION"
        updatedAt={new Date()}
        onDelete={vi.fn()}
      />
    )

    // Nome e descricao
    expect(screen.getByText('Meu App Delivery')).toBeInTheDocument()
    expect(screen.getByText(/aplicativo para gerenciar/i)).toBeInTheDocument()

    // Fase
    expect(screen.getByText(/fase 1/i)).toBeInTheDocument()

    // Progress bars (6 bars para 6 fases)
    const progressBars = document.querySelectorAll('.h-1.rounded-full')
    expect(progressBars.length).toBe(6)
  })

  /**
   * Cenario: Exibir menu de opcoes (3 pontos)
   */
  it('Exibe botao de menu (3 pontos)', () => {
    render(
      <ProjectCard
        id="1"
        name="Meu App Delivery"
        description="Aplicativo"
        status="IDEATION"
        updatedAt={new Date()}
        onDelete={vi.fn()}
      />
    )

    // Botao de menu deve existir
    const menuButton = screen.getByRole('button', { name: /menu|opcoes|mais/i }) ||
      screen.getByLabelText(/menu/i) ||
      document.querySelector('[aria-label*="menu"], [aria-label*="opções"], button:has(svg)')

    expect(menuButton || screen.getByText('⋮')).toBeTruthy()
  })

  /**
   * Cenario: Card de projeto LIVE mostra todas as fases completas
   */
  it('Projeto LIVE mostra fase 6', () => {
    render(
      <ProjectCard
        id="4"
        name="API de Pagamentos"
        description="Integracao"
        status="LIVE"
        updatedAt={new Date()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByText(/fase 6|online/i)).toBeInTheDocument()
  })
})

/**
 * =============================================================================
 * CENARIOS: QUICK ACTIONS
 * =============================================================================
 */
describe('Dashboard: Quick Actions', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Cenario: Exibir secao de acoes rapidas
   */
  it('Exibe secao de acoes rapidas', () => {
    render(
      <QuickActions
        lastProject={{ id: '1', name: 'Meu App', phase: 'Fase 1: Ideacao' }}
        onCreateNew={vi.fn()}
      />
    )

    expect(screen.getByText(/acoes rapidas/i)).toBeInTheDocument()
  })

  /**
   * Cenario: Exibir botao para continuar ultimo projeto
   */
  it('Exibe botao para continuar ultimo projeto', () => {
    render(
      <QuickActions
        lastProject={{ id: '1', name: 'Meu App', phase: 'Fase 1: Ideacao' }}
        onCreateNew={vi.fn()}
      />
    )

    expect(screen.getByText(/continuar.*meu app/i)).toBeInTheDocument()
  })

  /**
   * Cenario: Nao exibe continuar quando nao ha projeto em progresso
   */
  it('Nao exibe continuar quando nao ha projeto em progresso', () => {
    render(
      <QuickActions
        lastProject={null}
        onCreateNew={vi.fn()}
      />
    )

    expect(screen.queryByText(/continuar/i)).toBeNull()
  })
})

/**
 * =============================================================================
 * CENARIOS: DASHBOARD CONTENT (Integracao)
 * =============================================================================
 */
describe('Dashboard: Content Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Cenario: Exibir dashboard completo com todos os elementos
   */
  it('Exibe dashboard completo com stats, filtros e cards', () => {
    render(withToastProvider(<DashboardContent projects={sampleProjects} />))

    // Titulo
    expect(screen.getByText('Meus Projetos')).toBeInTheDocument()

    // Botao novo projeto
    expect(screen.getByText(/novo projeto/i)).toBeInTheDocument()

    // Stats (4 projetos, 1 online, 3 em progresso)
    expect(screen.getByText('4')).toBeInTheDocument()

    // Filtros
    expect(screen.getByText(/todos/i)).toBeInTheDocument()

    // Cards dos projetos
    expect(screen.getByText('Meu App Delivery')).toBeInTheDocument()
    expect(screen.getByText('Portfolio Pessoal')).toBeInTheDocument()
  })

  /**
   * Cenario: Filtrar projetos por status
   */
  it('Filtra projetos ao clicar em tab', async () => {
    render(withToastProvider(<DashboardContent projects={sampleProjects} />))

    // Inicialmente mostra todos
    expect(screen.getByText('Meu App Delivery')).toBeInTheDocument()
    expect(screen.getByText('API de Pagamentos')).toBeInTheDocument()

    // Clica em "Concluidos"
    await userEvent.click(screen.getByText(/concluidos/i))

    // Agora so mostra o LIVE
    await waitFor(() => {
      expect(screen.getByText('API de Pagamentos')).toBeInTheDocument()
      expect(screen.queryByText('Meu App Delivery')).toBeNull()
    })
  })

  /**
   * Cenario: Exibir estado vazio quando nao ha projetos
   */
  it('Exibe estado vazio quando nao ha projetos', () => {
    render(withToastProvider(<DashboardContent projects={[]} />))

    expect(screen.getByText(/nenhum projeto/i)).toBeInTheDocument()
    expect(screen.getByText(/criar/i)).toBeInTheDocument()
  })
})
