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

    expect(screen.getByText(/Aguardando geração do plano/)).toBeInTheDocument()
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
   * @business-plan @aprovado @readonly
   * Cenário: Business Plan aprovado fica somente leitura
   */
  it('Exibe badge "Aprovado" e esconde botões quando aprovado', () => {
    render(
      <WorkspacePanel
        projectId="test-project"
        projectName="Meu App Delivery"
        status="PLANNING"
        businessPlan={sampleBusinessPlan}
        businessPlanApproved={true}
      />
    )

    // Então vejo o badge "Aprovado" no cabeçalho
    expect(screen.getByText(/Aprovado/i)).toBeInTheDocument()

    // E NÃO vejo o botão "Editar Plano"
    expect(screen.queryByRole('button', { name: /Editar Plano/i })).not.toBeInTheDocument()

    // E NÃO vejo o botão "Aprovar e Continuar"
    expect(screen.queryByRole('button', { name: /Aprovar e Continuar/i })).not.toBeInTheDocument()
  })
})
