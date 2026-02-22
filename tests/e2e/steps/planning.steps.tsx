/**
 * Step Definitions: Planning Phase
 *
 * Implementação dos cenários definidos em:
 * docs/specifications/planning.feature
 *
 * Padrão: Dado/Quando/Então (Given/When/Then)
 *
 * Sprint 2: Business Plan (visualização, edição, aprovação)
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkspacePanel } from '@/components/project/WorkspacePanel'
import { createTestProject } from '../support/test-utils'

// Mock do useProjectLayout
vi.mock('@/components/project/ProjectLayout', async () => {
  const actual = await vi.importActual('@/components/project/ProjectLayout')
  return {
    ...actual,
    useProjectLayout: () => ({
      isChatOpen: true,
      setChatOpen: vi.fn(),
    }),
  }
})

// Cleanup mocks after each test
afterEach(() => {
  vi.restoreAllMocks()
})

// Sample Business Plan for tests
const sampleBusinessPlan = JSON.stringify({
  name: 'Meu App Delivery',
  tagline: 'Entregas rápidas e seguras',
  description: 'Aplicativo de delivery para restaurantes pequenos',
  problemStatement: 'Restaurantes pequenos têm dificuldade em competir com grandes plataformas',
  targetAudience: {
    primary: 'Restaurantes com até 50 pedidos/dia',
    secondary: 'Clientes que preferem delivery local',
    painPoints: ['Taxas altas das plataformas', 'Pouco controle sobre entregas'],
  },
  coreFeatures: [
    { id: '1', name: 'Cardápio Digital', description: 'Cardápio online personalizável', priority: 'must-have' },
    { id: '2', name: 'Pedidos Online', description: 'Sistema de pedidos integrado', priority: 'must-have' },
    { id: '3', name: 'Pagamento', description: 'Pagamento via PIX e cartão', priority: 'must-have' },
  ],
  monetization: {
    model: 'freemium',
    description: 'Grátis até 50 pedidos/mês, R$99/mês acima',
  },
})

/**
 * =============================================================================
 * CENÁRIOS: BUSINESS PLAN - VISUALIZAÇÃO
 * =============================================================================
 */
describe('Planning: Business Plan - Visualização', () => {
  /**
   * @business-plan @visualizacao
   * Cenário: Visualizar Business Plan gerado
   */
  it('Exibe as seções do Business Plan', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
      />
    )

    // Então vejo a seção "Visão Geral" com nome e tagline
    expect(screen.getByText('Meu App Delivery')).toBeInTheDocument()
    expect(screen.getByText('Entregas rápidas e seguras')).toBeInTheDocument()

    // E vejo a seção "Problema" com problemStatement
    expect(screen.getByText(/Problema/)).toBeInTheDocument()
    expect(screen.getByText(/Restaurantes pequenos têm dificuldade/)).toBeInTheDocument()

    // E vejo a seção "Público-Alvo" com targetAudience
    expect(screen.getByText(/Público-Alvo/)).toBeInTheDocument()
    expect(screen.getByText(/Restaurantes com até 50 pedidos/)).toBeInTheDocument()

    // E vejo a seção "Features Core" com lista de funcionalidades
    expect(screen.getByText(/Funcionalidades/)).toBeInTheDocument()
    expect(screen.getByText('Cardápio Digital')).toBeInTheDocument()
    expect(screen.getByText('Pedidos Online')).toBeInTheDocument()

    // E vejo a seção "Monetização"
    expect(screen.getByText(/Monetização/)).toBeInTheDocument()
    expect(screen.getByText('freemium')).toBeInTheDocument()
  })

  /**
   * @business-plan @acoes
   * Cenário: Botões de ação no Business Plan (não aprovado)
   */
  it('Exibe botões "Editar Plano" e "Aprovar e Continuar" quando não aprovado', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
      />
    )

    // Então vejo o botão "Editar Plano"
    expect(screen.getByRole('button', { name: /Editar Plano/i })).toBeInTheDocument()

    // E vejo o botão "Aprovar e Continuar"
    expect(screen.getByRole('button', { name: /Aprovar e Continuar/i })).toBeInTheDocument()

    // E ambos os botões estão habilitados
    expect(screen.getByRole('button', { name: /Editar Plano/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /Aprovar e Continuar/i })).not.toBeDisabled()
  })

  /**
   * @business-plan @acoes
   * Cenário: Mensagem quando não há plano
   */
  it('Exibe mensagem de aguardando quando não há plano', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={null}
      />
    )

    // Pode haver múltiplas mensagens (business plan + technical plan)
    const messages = screen.getAllByText(/Aguardando geração do plano/)
    expect(messages.length).toBeGreaterThanOrEqual(1)
  })
})

/**
 * =============================================================================
 * CENÁRIOS: BUSINESS PLAN - EDIÇÃO
 * =============================================================================
 */
describe('Planning: Business Plan - Edição', () => {
  /**
   * @business-plan @edicao
   * Cenário: Abrir modo de edição do Business Plan
   */
  it('Entra em modo de edição ao clicar em "Editar Plano"', async () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
      />
    )

    // Quando clico em "Editar Plano"
    const editButton = screen.getByRole('button', { name: /Editar Plano/i })
    await userEvent.click(editButton)

    // Então o workspace entra em modo de edição
    // E vejo o botão "Salvar Alterações"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeInTheDocument()
    })

    // E vejo o botão "Cancelar"
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()

    // E os campos do plano ficam editáveis (tagline é um input/textarea)
    const taglineInput = screen.getByDisplayValue('Entregas rápidas e seguras')
    expect(taglineInput).toBeInTheDocument()
    expect(taglineInput.tagName).toMatch(/INPUT|TEXTAREA/i)
  })

  /**
   * @business-plan @edicao
   * Cenário: Cancelar edição do Business Plan
   */
  it('Cancela edição e volta para visualização', async () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
      />
    )

    // Dado que estou editando o Business Plan
    const editButton = screen.getByRole('button', { name: /Editar Plano/i })
    await userEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
    })

    // E alterei o campo "tagline"
    const taglineInput = screen.getByDisplayValue('Entregas rápidas e seguras')
    await userEvent.clear(taglineInput)
    await userEvent.type(taglineInput, 'Novo tagline alterado')

    // Quando clico em "Cancelar"
    const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
    await userEvent.click(cancelButton)

    // Então as alterações são descartadas
    // E volto para o modo de visualização
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Editar Plano/i })).toBeInTheDocument()
    })

    // E o campo exibe o valor original
    expect(screen.getByText('Entregas rápidas e seguras')).toBeInTheDocument()
    expect(screen.queryByText('Novo tagline alterado')).not.toBeInTheDocument()
  })

  /**
   * @business-plan @edicao @comportamento
   * Cenário: Salvar alterações chama onSavePlan com dados editados
   */
  it('Chama onSavePlan com os dados editados ao salvar', async () => {
    const onSavePlan = vi.fn()

    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        onSavePlan={onSavePlan}
      />
    )

    // Quando clico em "Editar Plano"
    const editButton = screen.getByRole('button', { name: /Editar Plano/i })
    await userEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeInTheDocument()
    })

    // E altero o campo "tagline"
    const taglineInput = screen.getByDisplayValue('Entregas rápidas e seguras')
    await userEvent.clear(taglineInput)
    await userEvent.type(taglineInput, 'Tagline editado pelo usuário')

    // Quando clico em "Salvar Alterações"
    const saveButton = screen.getByRole('button', { name: /Salvar Alterações/i })
    await userEvent.click(saveButton)

    // Então onSavePlan é chamado com o plano editado
    await waitFor(() => {
      expect(onSavePlan).toHaveBeenCalledTimes(1)
      const editedPlan = onSavePlan.mock.calls[0][0]
      expect(editedPlan.tagline).toBe('Tagline editado pelo usuário')
    })
  })
})

/**
 * =============================================================================
 * CENÁRIOS: BUSINESS PLAN - APROVAÇÃO
 * =============================================================================
 */
describe('Planning: Business Plan - Aprovação', () => {
  /**
   * @business-plan @aprovacao
   * Cenário: Callback de aprovação é chamado
   */
  it('Chama onApprove ao clicar em "Aprovar e Continuar"', async () => {
    const onApprove = vi.fn()

    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        onApprove={onApprove}
      />
    )

    // Quando clico em "Aprovar e Continuar"
    const approveButton = screen.getByRole('button', { name: /Aprovar e Continuar/i })
    await userEvent.click(approveButton)

    // Então o callback é chamado
    expect(onApprove).toHaveBeenCalledTimes(1)
  })

  /**
   * @business-plan @aprovacao @loading @comportamento
   * Cenário: isApproving=true exibe overlay de loading e desabilita botão
   */
  it('Exibe overlay "Gerando Plano Técnico..." quando isApproving=true', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        isApproving={true}
      />
    )

    // Então vejo o overlay de loading
    expect(screen.getByText('Gerando Plano Técnico...')).toBeInTheDocument()

    // E o botão "Aprovar e Continuar" está desabilitado
    const approveButton = screen.getByRole('button', { name: /Aprovar e Continuar/i })
    expect(approveButton).toBeDisabled()
  })

  /**
   * @business-plan @aprovado @readonly
   * Cenário: Business Plan aprovado → avança para Technical Plan (sequencial)
   * planning.feature line 86-93
   */
  it('Após aprovar Business Plan, exibe Technical Plan e esconde Business Plan', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
      />
    )

    // Business Plan não está mais visível como conteúdo principal
    // (título "Plano de Negócio" aparece apenas no breadcrumb, não como heading)
    expect(screen.queryByRole('heading', { name: /Plano de Negócio/i })).not.toBeInTheDocument()

    // Technical Plan agora é o ativo - novo título é "Arquitetura Técnica"
    expect(screen.getByText(/Arquitetura Técnica/i)).toBeInTheDocument()
    expect(screen.getByText(/Stack de Tecnologia/i)).toBeInTheDocument()

    // Breadcrumb mostra Business Plan como completed (✓)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  /**
   * @business-plan @aprovado @readonly @comportamento
   * Cenário: Business Plan aprovado não exibe botão "Editar Plano"
   */
  it('Business Plan aprovado não exibe botão Editar quando apenas ele está aprovado', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={null}
      />
    )

    // Business Plan aprovado não exibe botão "Editar Plano"
    // (mas ainda pode estar visível se technical plan não foi gerado)
    expect(screen.queryByRole('button', { name: /Editar Plano/i })).not.toBeInTheDocument()

    // Breadcrumb mostra Business Plan como completed
    expect(screen.getByText('✓')).toBeInTheDocument()
  })
})

// Sample Technical Plan for tests - nova estrutura baseada no mockup
const sampleTechnicalPlan = JSON.stringify({
  stack: {
    categories: [
      { name: 'Frontend', technologies: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS'] },
      { name: 'Backend', technologies: ['Next.js API Routes', 'Prisma ORM', 'PostgreSQL'] },
      { name: 'Autenticação', technologies: ['Clerk'] },
      { name: 'Infraestrutura', technologies: ['Vercel', 'Supabase'] },
    ],
  },
  architecture: {
    pattern: 'Monolito modular com App Router',
    organization: 'Feature-based folders',
    stateManagement: 'Zustand + React Query',
    fileStructure: 'src/\\n├── app/\\n├── components/\\n├── lib/\\n└── types/',
  },
  database: {
    description: 'Schema completo com relacionamentos',
    prismaSchema: 'model User {\\n  id String @id\\n  name String\\n}',
    summary: '4 models, 6 relações, 8 índices',
  },
  apiEndpoints: [
    {
      category: '🔐 Autenticação',
      endpoints: [
        { method: 'POST', path: '/api/auth/register', description: 'Registrar usuário' },
        { method: 'GET', path: '/api/auth/me', description: 'Dados do usuário' },
      ],
    },
    {
      category: '📦 Pedidos',
      endpoints: [
        { method: 'GET', path: '/api/orders', description: 'Listar pedidos' },
        { method: 'POST', path: '/api/orders', description: 'Criar pedido' },
      ],
    },
  ],
  security: {
    authentication: ['Clerk JWT com expiração de 1h', 'RBAC com 4 roles'],
    apiProtection: ['Rate Limiting: 10 req/s', 'Input Validation com Zod'],
    sensitiveData: ['Pagamentos via Stripe (PCI-compliant)'],
    compliance: ['LGPD: Consentimento explícito'],
  },
  performance: {
    caching: [
      { name: 'CDN (Vercel Edge)', description: 'Assets estáticos com cache de 1 ano' },
      { name: 'React Query', description: 'Client-side cache com staleTime de 30s' },
    ],
    database: ['Índices estratégicos em foreign keys'],
    frontend: ['Code splitting com dynamic imports'],
    goals: { fcp: '< 1.8s', lcp: '< 2.5s', tti: '< 3.8s', cls: '< 0.1' },
  },
})

/**
 * =============================================================================
 * CENÁRIOS: TECHNICAL PLAN - VISUALIZAÇÃO
 * =============================================================================
 */
describe('Planning: Technical Plan - Visualização', () => {
  /**
   * @technical-plan @visualizacao
   * Cenário: Visualizar Technical Plan gerado
   */
  it('Exibe as seções do Technical Plan', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
      />
    )

    // "Plano Técnico" aparece no breadcrumb e no heading — ambos devem estar presentes
    const techLabels = screen.getAllByText(/Plano Técnico/i)
    expect(techLabels.length).toBeGreaterThanOrEqual(1)

    // E vejo informações da stack (Next.js aparece nome + descrição)
    const nextJsElements = screen.getAllByText(/Next\.js/i)
    expect(nextJsElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/PostgreSQL/i).length).toBeGreaterThan(0)
  })

  /**
   * @technical-plan @acoes
   * Cenário: Botões de ação no Technical Plan (não aprovado)
   */
  it('Exibe botões "Editar Stack" e "Aprovar e Continuar" quando não aprovado', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
        technicalPlanApproved={false}
      />
    )

    // Então vejo o botão "Editar Stack"
    expect(screen.getByRole('button', { name: /Editar Plano/i })).toBeInTheDocument()

    // E vejo o botão "Aprovar e Continuar" (para Technical Plan)
    expect(screen.getByRole('button', { name: /Aprovar/i })).toBeInTheDocument()
  })
})

/**
 * =============================================================================
 * CENÁRIOS: TECHNICAL PLAN - EDIÇÃO
 * =============================================================================
 */
describe('Planning: Technical Plan - Edição', () => {
  /**
   * @technical-plan @edicao
   * Cenário: Editar plano técnico
   */
  it('Entra em modo de edição ao clicar em "Editar Plano"', async () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
        technicalPlanApproved={false}
      />
    )

    // Quando clico em "Editar Plano"
    const editButton = screen.getByRole('button', { name: /Editar Plano/i })
    await userEvent.click(editButton)

    // Então vejo o título de edição
    await waitFor(() => {
      expect(screen.getByText(/Editando Plano Técnico/i)).toBeInTheDocument()
    })

    // E vejo opções para selecionar tecnologias
    expect(screen.getByText(/Frontend Framework/i)).toBeInTheDocument()
    expect(screen.getByText(/Banco de Dados/i)).toBeInTheDocument()

    // E posso trocar o database
    expect(screen.getByText(/PostgreSQL \(Supabase\)/)).toBeInTheDocument()
    expect(screen.getByText(/MongoDB \(Atlas\)/)).toBeInTheDocument()

    // E vejo o botão "Salvar Alterações"
    expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeInTheDocument()

    // E vejo o botão "Cancelar"
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
  })

  /**
   * @technical-plan @edicao
   * Cenário: Cancelar edição do Technical Plan
   */
  it('Cancelar volta para modo visualização', async () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
        technicalPlanApproved={false}
      />
    )

    // Entra em modo de edição
    await userEvent.click(screen.getByRole('button', { name: /Editar Plano/i }))

    await waitFor(() => {
      expect(screen.getByText(/Editando Plano Técnico/i)).toBeInTheDocument()
    })

    // Quando clico em "Cancelar"
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }))

    // Então volto para o modo de visualização
    await waitFor(() => {
      expect(screen.getByText(/Arquitetura Técnica/i)).toBeInTheDocument()
    })

    // E vejo o botão "Editar Plano" novamente
    expect(screen.getByRole('button', { name: /Editar Plano/i })).toBeInTheDocument()
  })

  /**
   * @technical-plan @edicao
   * Cenário: Salvar alterações chama onSaveTechnicalPlan
   */
  it('Salvar chama onSaveTechnicalPlan com seleções', async () => {
    const onSaveTechnicalPlan = vi.fn()

    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
        technicalPlanApproved={false}
        onSaveTechnicalPlan={onSaveTechnicalPlan}
      />
    )

    // Entra em modo de edição
    await userEvent.click(screen.getByRole('button', { name: /Editar Plano/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeInTheDocument()
    })

    // Quando clico em "Salvar Alterações"
    await userEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }))

    // Então onSaveTechnicalPlan é chamado
    await waitFor(() => {
      expect(onSaveTechnicalPlan).toHaveBeenCalledTimes(1)
    })

    // E volta para modo visualização
    await waitFor(() => {
      expect(screen.getByText(/Arquitetura Técnica/i)).toBeInTheDocument()
    })
  })
})

/**
 * =============================================================================
 * CENÁRIOS: TECHNICAL PLAN - APROVAÇÃO
 * =============================================================================
 */
describe('Planning: Technical Plan - Aprovação', () => {
  /**
   * @technical-plan @aprovado @readonly
   * Cenário: Technical Plan aprovado fica somente leitura
   */
  /**
   * Cenário: Technical Plan aprovado → avança para UX Plan (sequencial)
   * planning.feature line 149-157
   */
  it('Após aprovar Technical Plan, exibe UX Plan e esconde Technical Plan', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
        technicalPlanApproved={true}
        uxPlan={sampleUxPlan}
      />
    )

    // Technical Plan não está mais visível como conteúdo principal
    expect(screen.queryByRole('button', { name: /Editar Plano/i })).not.toBeInTheDocument()

    // UX Plan agora é o ativo
    expect(screen.getByText(/Design de Experiência/i)).toBeInTheDocument()

    // Breadcrumb mostra 2 planos como completed
    const checkmarks = screen.getAllByText('✓')
    expect(checkmarks.length).toBe(2)
  })

  /**
   * @technical-plan @aprovacao
   * Cenário: Callback de aprovação do Technical Plan
   */
  it('Chama onApproveTechnicalPlan ao aprovar', async () => {
    const onApproveTechnicalPlan = vi.fn()

    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
        technicalPlanApproved={false}
        onApproveTechnicalPlan={onApproveTechnicalPlan}
      />
    )

    // Quando clico em "Aprovar" para Technical Plan
    const approveButtons = screen.getAllByRole('button', { name: /Aprovar/i })
    // O botão de aprovar Technical Plan (pode haver múltiplos)
    await userEvent.click(approveButtons[approveButtons.length - 1])

    // Então o callback é chamado
    expect(onApproveTechnicalPlan).toHaveBeenCalledTimes(1)
  })

  /**
   * @technical-plan @aprovacao @loading
   * Cenário: isApproving=true no plano técnico exibe loading do Plano de UX
   */
  it('Exibe overlay "Gerando Plano de UX..." quando technical está em aprovação', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
        technicalPlanApproved={false}
        isApproving={true}
      />
    )

    expect(screen.getByTestId('plan-generation-overlay')).toBeInTheDocument()
    expect(screen.getByText('Gerando Plano de UX...')).toBeInTheDocument()
  })
})

// Sample UX Plan for tests - nova estrutura baseada no mockup 07-ux-plan.html
const sampleUxPlan = JSON.stringify({
  personas: [
    {
      name: 'Maria Clara - Dona de Restaurante',
      initials: 'MC',
      age: 42,
      location: 'São Paulo, SP',
      bio: 'Dona de uma pizzaria de bairro com 8 funcionários.',
      painPoints: ['Comissão de 25% do iFood', 'Sem acesso aos dados dos clientes'],
      goals: ['Reduzir custos em 50%', 'Ter controle total sobre entregas'],
      jobsToBeDone: ['Gerenciar cardápio facilmente', 'Acompanhar entregas em tempo real'],
      triggers: 'Horário de pico de pedidos',
    },
  ],
  informationArchitecture: {
    sitemap: '📁 Dashboard\\n├─ 📊 Visão Geral\\n├─ 📦 Pedidos\\n└─ ⚙️ Configurações',
    navigation: [
      { name: 'Sidebar Fixa (Desktop)', description: 'Sempre visível, colapsável' },
    ],
  },
  journeys: [
    {
      name: 'Cadastro e Primeiro Pedido',
      persona: 'Maria Clara',
      steps: [
        { title: 'Descoberta', description: 'Vê anúncio e acessa landing page', emotion: '😊 Empolgada' },
        { title: 'Cadastro', description: 'Cria conta com Google OAuth', emotion: '🙂 Rápido e simples' },
      ],
    },
  ],
  wireframes: [
    { name: 'Dashboard', description: 'Visão geral com métricas e pedidos ativos', layout: 'Sidebar + cards' },
  ],
  componentLibrary: [
    {
      name: 'Buttons',
      variants: [
        { name: 'Primary', description: 'Ações principais' },
        { name: 'Secondary', description: 'Ações secundárias' },
      ],
    },
  ],
  accessibility: {
    colorContrast: ['Texto normal: contraste mínimo 4.5:1'],
    keyboard: ['Tab: Avançar entre elementos'],
    semantics: ['Tags semânticas: nav, main, aside'],
    aria: ['aria-label em botões de ícone'],
    screenReaders: ['Texto alternativo em todas as imagens'],
  },
  uiStates: {
    loading: ['Skeleton screens para listas'],
    error: ['Toast para erros leves'],
    empty: ['Ilustração + CTA para estados vazios'],
  },
  designTokens: {
    colors: {
      primary: '#2563eb',
      secondary: '#6366f1',
      success: '#22c55e',
      error: '#ef4444',
    },
    typography: [
      { name: 'Display', font: 'Inter 700, 32px' },
      { name: 'Body', font: 'Inter 400, 16px' },
    ],
    spacing: [
      { name: 'space-1', value: '4px' },
      { name: 'space-4', value: '16px' },
    ],
  },
})

/**
 * =============================================================================
 * CENÁRIOS: UX PLAN - VISUALIZAÇÃO
 * =============================================================================
 */
describe('Planning: UX Plan - Visualização', () => {
  /**
   * @ux-plan @visualizacao
   * Cenário: Visualizar UX Plan gerado
   */
  it('Exibe as seções do UX Plan', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
        technicalPlanApproved={true}
        uxPlan={sampleUxPlan}
      />
    )

    // "Plano de UX" aparece no breadcrumb
    const uxLabels = screen.getAllByText(/Plano de UX/i)
    expect(uxLabels.length).toBeGreaterThanOrEqual(1)

    // Seção Personas com dados detalhados
    expect(screen.getByText('Maria Clara - Dona de Restaurante')).toBeInTheDocument()
    expect(screen.getByText('MC')).toBeInTheDocument() // iniciais
    expect(screen.getByText(/42 anos/)).toBeInTheDocument()
    expect(screen.getByText(/Dona de uma pizzaria/)).toBeInTheDocument()
    expect(screen.getByText(/Comissão de 25%/)).toBeInTheDocument()
    expect(screen.getByText(/Reduzir custos em 50%/)).toBeInTheDocument()

    // Seção Jornadas com steps (nome inclui persona entre parênteses)
    expect(screen.getByText(/Cadastro e Primeiro Pedido/)).toBeInTheDocument()
    expect(screen.getByText('Descoberta')).toBeInTheDocument()
    expect(screen.getByText(/Vê anúncio/)).toBeInTheDocument()

    // Seção Design Tokens com paleta
    expect(screen.getByText('Paleta de Cores')).toBeInTheDocument()
    expect(screen.getByText('#2563eb')).toBeInTheDocument()
  })

  /**
   * @ux-plan @acoes
   * Cenário: Botões de ação no UX Plan (não aprovado)
   */
  it('Exibe botão "Aprovar e Continuar" quando UX Plan não aprovado', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
        technicalPlanApproved={true}
        uxPlan={sampleUxPlan}
        uxPlanApproved={false}
      />
    )

    // Então vejo botão "Aprovar" para UX Plan
    const approveButtons = screen.getAllByRole('button', { name: /Aprovar/i })
    expect(approveButtons.length).toBeGreaterThanOrEqual(1)
  })
})

/**
 * =============================================================================
 * CENÁRIOS: UX PLAN - APROVAÇÃO
 * =============================================================================
 */
describe('Planning: UX Plan - Aprovação', () => {
  /**
   * @ux-plan @aprovado @readonly
   * Cenário: UX Plan aprovado fica somente leitura
   */
  /**
   * Cenário: UX Plan aprovado — todos os planos completados
   * planning.feature line 216-221
   */
  it('Exibe badge "Aprovado" no UX Plan e breadcrumb com todos completed', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
        technicalPlanApproved={true}
        uxPlan={sampleUxPlan}
        uxPlanApproved={true}
      />
    )

    // UX Plan card mostra badge "Aprovado"
    expect(screen.getByText(/Aprovado/i)).toBeInTheDocument()

    // Breadcrumb mostra todos os 3 planos como completed (✓)
    const checkmarks = screen.getAllByText('✓')
    expect(checkmarks.length).toBe(3)

    // NÃO há botão "Aprovar" visível
    expect(screen.queryByRole('button', { name: /Aprovar/i })).not.toBeInTheDocument()
  })

  /**
   * @ux-plan @aprovacao
   * Cenário: Callback de aprovação do UX Plan
   */
  it('Chama onApproveUxPlan ao aprovar', async () => {
    const onApproveUxPlan = vi.fn()

    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
        technicalPlanApproved={true}
        uxPlan={sampleUxPlan}
        uxPlanApproved={false}
        onApproveUxPlan={onApproveUxPlan}
      />
    )

    // Quando clico em "Aprovar" para UX Plan
    const approveButtons = screen.getAllByRole('button', { name: /Aprovar/i })
    await userEvent.click(approveButtons[approveButtons.length - 1])

    // Então o callback é chamado
    expect(onApproveUxPlan).toHaveBeenCalledTimes(1)
  })

  /**
   * @ux-plan @aprovacao @loading
   * Cenário: UX em aprovação não exibe loading de geração de plano
   */
  it('Não exibe overlay de geração quando UX está em aprovação', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
        technicalPlan={sampleTechnicalPlan}
        technicalPlanApproved={true}
        uxPlan={sampleUxPlan}
        uxPlanApproved={false}
        isApproving={true}
      />
    )

    expect(
      screen.queryByTestId('plan-generation-overlay')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Gerando Plano de UX...')).not.toBeInTheDocument()
  })
})
