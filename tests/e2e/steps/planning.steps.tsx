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
    expect(screen.queryByRole('button', { name: /Editar Plano/i })).not.toBeInTheDocument()

    // Technical Plan agora é o ativo
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

// Sample Technical Plan for tests
const sampleTechnicalPlan = JSON.stringify({
  stack: {
    frontend: { name: 'Next.js', version: '15', description: 'React framework com SSR' },
    backend: { name: 'Next.js API Routes', description: 'API serverless' },
    database: { name: 'PostgreSQL', provider: 'Neon', description: 'Banco relacional serverless' },
    deploy: { name: 'Vercel', description: 'Plataforma de deploy' },
  },
  architecture: {
    pattern: 'Monolito modular',
    description: 'Aplicação Next.js com App Router',
  },
  folderStructure: [
    'src/app/',
    'src/components/',
    'src/lib/',
    'prisma/',
  ],
  dataModel: {
    entities: ['User', 'Order', 'Restaurant', 'MenuItem'],
    description: 'Modelo relacional com Prisma ORM',
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
    expect(screen.getByText(/PostgreSQL/i)).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: /Editar Stack/i })).toBeInTheDocument()

    // E vejo o botão "Aprovar e Continuar" (para Technical Plan)
    expect(screen.getByRole('button', { name: /Aprovar/i })).toBeInTheDocument()
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
    expect(screen.queryByRole('button', { name: /Editar Stack/i })).not.toBeInTheDocument()

    // UX Plan agora é o ativo
    expect(screen.getByText(/Personas & Design/i)).toBeInTheDocument()

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
})

// Sample UX Plan for tests
const sampleUxPlan = JSON.stringify({
  personas: [
    {
      name: 'João Restaurante',
      age: 35,
      role: 'Dono de restaurante',
      goals: ['Aumentar vendas', 'Reduzir custos'],
      painPoints: ['Taxas altas', 'Falta de controle'],
    },
  ],
  journeys: [
    {
      name: 'Primeiro pedido',
      steps: ['Acessa app', 'Escolhe restaurante', 'Faz pedido', 'Paga'],
    },
  ],
  wireframes: ['Tela inicial', 'Cardápio', 'Checkout'],
  designTokens: {
    colors: { primary: '#7C3AED', secondary: '#22C55E' },
    typography: { fontFamily: 'Inter', fontSize: { base: '16px' } },
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

    // "Plano de UX" aparece no breadcrumb e no heading
    const uxLabels = screen.getAllByText(/Plano de UX/i)
    expect(uxLabels.length).toBeGreaterThanOrEqual(1)

    // E vejo informações do UX Plan (personas, design tokens)
    expect(screen.getByText('João Restaurante')).toBeInTheDocument()
    const personaLabels = screen.getAllByText(/Personas/i)
    expect(personaLabels.length).toBeGreaterThanOrEqual(1)
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
})
