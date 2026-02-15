import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkspacePanel } from './WorkspacePanel'

// Mock useProjectLayout
vi.mock('./ProjectLayout', () => ({
  useProjectLayout: () => ({
    sidebarOpen: false,
    setSidebarOpen: vi.fn(),
    chatOpen: false,
    setChatOpen: vi.fn(),
  }),
}))

const baseProps = {
  projectId: 'test-1',
  projectName: 'Test Project',
  status: 'PLANNING',
  businessPlanApproved: true,
  technicalPlanApproved: true,
  uxPlanApproved: false,
}

function makeUxPlan(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    personas: [{ name: 'User', initials: 'U', bio: 'Test persona' }],
    informationArchitecture: {
      sitemap: 'Home > Dashboard',
      navigation: [
        { name: 'Sidebar Principal', description: 'Navegação lateral fixa' },
        { name: 'Bottom Tab Bar', description: 'Barra inferior para mobile' },
        { name: 'Tabs Horizontais', description: 'Abas no topo' },
        { name: 'Breadcrumb Trail', description: 'Caminho hierárquico' },
      ],
    },
    wireframes: [
      { name: 'Dashboard', description: 'Tela principal', layout: 'Sidebar fixa + grid de cards' },
      { name: 'Lista de Pedidos', description: 'Listagem', layout: 'List com filtros' },
      { name: 'Formulário', description: 'Cadastro', layout: 'Form centralizado' },
      { name: 'App Mobile', description: 'Versão mobile', layout: 'Mobile app com bottom nav' },
      { name: 'Catálogo', description: 'Grid de itens', layout: 'Grid de cards' },
      { name: 'Genérica', description: 'Tela sem layout', layout: '' },
    ],
    componentLibrary: [
      {
        name: 'Buttons',
        variants: [
          { name: 'Primary', description: 'Ação principal' },
          { name: 'Destructive', description: 'Ação destrutiva' },
          { name: 'Ghost', description: 'Ação sutil' },
        ],
      },
      {
        name: 'Status Badges',
        variants: [
          { name: 'Pendente', description: 'Aguardando' },
          { name: 'Entregue', description: 'Finalizado' },
          { name: 'Cancelado', description: 'Removido' },
        ],
      },
      {
        name: 'Cards',
        variants: [
          { name: 'Default', description: 'Card padrão' },
          { name: 'Highlighted', description: 'Card com destaque' },
        ],
      },
      {
        name: 'Form Inputs',
        variants: [
          { name: 'Default', description: 'Campo padrão' },
          { name: 'Error', description: 'Campo com erro' },
          { name: 'Disabled', description: 'Campo desabilitado' },
        ],
      },
      {
        name: 'Outro Componente',
        variants: [
          { name: 'Variante A', description: 'Genérica' },
        ],
      },
    ],
    ...overrides,
  })
}

describe('WorkspacePanel - UX Plan Visual Previews', () => {
  describe('NavigationPatternCard', () => {
    it('renders sidebar wireframe for navigation with "Sidebar" in name', () => {
      const { container } = render(
        <WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />
      )
      const svgs = container.querySelectorAll('svg[aria-label]')
      const labels = Array.from(svgs).map((s) => s.getAttribute('aria-label'))
      expect(labels).toContain('Wireframe de navegação sidebar')
    })

    it('renders bottom bar wireframe for "Bottom Tab Bar"', () => {
      const { container } = render(
        <WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />
      )
      const svgs = container.querySelectorAll('svg[aria-label]')
      const labels = Array.from(svgs).map((s) => s.getAttribute('aria-label'))
      expect(labels).toContain('Wireframe de navegação bottom bar')
    })

    it('renders tabs wireframe for "Tabs Horizontais"', () => {
      const { container } = render(
        <WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />
      )
      const svgs = container.querySelectorAll('svg[aria-label]')
      const labels = Array.from(svgs).map((s) => s.getAttribute('aria-label'))
      expect(labels).toContain('Wireframe de navegação por tabs')
    })

    it('renders breadcrumb wireframe for "Breadcrumb Trail"', () => {
      const { container } = render(
        <WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />
      )
      const svgs = container.querySelectorAll('svg[aria-label]')
      const labels = Array.from(svgs).map((s) => s.getAttribute('aria-label'))
      expect(labels).toContain('Wireframe de navegação breadcrumb')
    })

    it('renders generic wireframe for unrecognized patterns', () => {
      const uxPlan = makeUxPlan({
        informationArchitecture: {
          navigation: [{ name: 'Padrão Desconhecido', description: 'Teste' }],
        },
      })
      const { container } = render(
        <WorkspacePanel {...baseProps} uxPlan={uxPlan} />
      )
      const svgs = container.querySelectorAll('svg[aria-label="Wireframe de navegação genérica"]')
      expect(svgs.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('WireframeCard', () => {
    it('renders sidebar layout wireframe when layout includes "sidebar"', () => {
      const { container } = render(
        <WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />
      )
      const svgs = container.querySelectorAll('svg[aria-label]')
      const labels = Array.from(svgs).map((s) => s.getAttribute('aria-label'))
      expect(labels).toContain('Wireframe com sidebar')
    })

    it('renders list layout wireframe when layout includes "list"', () => {
      const { container } = render(
        <WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />
      )
      const svgs = container.querySelectorAll('svg[aria-label]')
      const labels = Array.from(svgs).map((s) => s.getAttribute('aria-label'))
      expect(labels).toContain('Wireframe com layout de lista')
    })

    it('renders form layout wireframe when layout includes "form"', () => {
      const { container } = render(
        <WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />
      )
      const svgs = container.querySelectorAll('svg[aria-label]')
      const labels = Array.from(svgs).map((s) => s.getAttribute('aria-label'))
      expect(labels).toContain('Wireframe com layout de formulário')
    })

    it('renders mobile layout wireframe when layout includes "mobile"', () => {
      const { container } = render(
        <WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />
      )
      const svgs = container.querySelectorAll('svg[aria-label]')
      const labels = Array.from(svgs).map((s) => s.getAttribute('aria-label'))
      expect(labels).toContain('Wireframe de layout mobile')
    })

    it('renders grid layout wireframe when layout includes "grid"', () => {
      const { container } = render(
        <WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />
      )
      const svgs = container.querySelectorAll('svg[aria-label]')
      const labels = Array.from(svgs).map((s) => s.getAttribute('aria-label'))
      expect(labels).toContain('Wireframe com grid de cards')
    })

    it('renders generic wireframe for empty layout', () => {
      const { container } = render(
        <WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />
      )
      const svgs = container.querySelectorAll('svg[aria-label="Wireframe de layout genérico"]')
      expect(svgs.length).toBeGreaterThanOrEqual(1)
    })

    it('shows layout label text', () => {
      render(<WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />)
      expect(screen.getByText(/Layout: Sidebar fixa/)).toBeInTheDocument()
      expect(screen.getByText(/Layout: List com filtros/)).toBeInTheDocument()
    })
  })

  describe('ComponentGroupPreview', () => {
    it('renders real buttons for "Buttons" group', () => {
      render(<WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />)
      const buttons = screen.getAllByRole('button')
      const buttonLabels = buttons.map((b) => b.textContent)
      expect(buttonLabels).toContain('Primary')
      expect(buttonLabels).toContain('Destructive')
      expect(buttonLabels).toContain('Ghost')
    })

    it('renders colored badges for "Status Badges" group', () => {
      render(<WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />)
      const pendentes = screen.getAllByText('Pendente')
      const badge = pendentes.find((el) => el.classList.contains('rounded-full'))
      expect(badge).toBeDefined()
      expect(badge!.className).toMatch(/bg-amber/)

      const entregues = screen.getAllByText('Entregue')
      const entBadge = entregues.find((el) => el.classList.contains('rounded-full'))
      expect(entBadge!.className).toMatch(/bg-green/)

      const cancelados = screen.getAllByText('Cancelado')
      const canBadge = cancelados.find((el) => el.classList.contains('rounded-full'))
      expect(canBadge!.className).toMatch(/bg-red/)
    })

    it('renders card variants with differentiated styles', () => {
      render(<WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />)
      expect(screen.getByText('Card padrão')).toBeInTheDocument()
      expect(screen.getByText('Card com destaque')).toBeInTheDocument()
    })

    it('renders input variants with different states', () => {
      render(<WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />)
      const inputs = screen.getAllByRole('textbox')
      const disabledInputs = inputs.filter((i) => i.hasAttribute('disabled'))
      expect(disabledInputs.length).toBeGreaterThanOrEqual(1)
    })

    it('renders default chip-style fallback for unrecognized groups', () => {
      render(<WorkspacePanel {...baseProps} uxPlan={makeUxPlan()} />)
      expect(screen.getByText('Variante A')).toBeInTheDocument()
      // "Genérica" appears both as wireframe description and variant description
      const genericas = screen.getAllByText('Genérica')
      expect(genericas.length).toBeGreaterThanOrEqual(1)
    })
  })
})
