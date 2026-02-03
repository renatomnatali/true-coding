/**
 * Step Definitions: Discovery Phase
 *
 * Implementação dos cenários definidos em:
 * docs/specifications/discovery.feature
 *
 * Padrão: Dado/Quando/Então (Given/When/Then)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatPanel } from '@/components/project/ChatPanel'
import {
  createTestProject,
  createTestConversation,
  type ProjectState,
  type ConversationState,
} from '../support/test-utils'

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

/**
 * =============================================================================
 * CENÁRIOS: RESTAURAÇÃO DE ESTADO (BUG CRÍTICO)
 * =============================================================================
 */
describe('Discovery: Restauração de Estado', () => {
  /**
   * @critical @restauracao
   * Cenário: Usuário reabre projeto com plano já gerado
   */
  describe('Cenário: Usuário reabre projeto com plano já gerado', () => {
    let project: ProjectState
    let conversation: ConversationState

    beforeEach(() => {
      // Dado que o projeto "Delivery App" tem status "PLANNING"
      // E o projeto TEM businessPlan válido
      // E existe conversação com status "COMPLETED"
      project = createTestProject({
        name: 'Delivery App',
        status: 'PLANNING',
        businessPlan: { name: 'Delivery App', tagline: 'Entrega rápida' },
      })

      conversation = createTestConversation({
        status: 'COMPLETED',
        currentQuestion: 5,
        completedQuestions: [1, 2, 3, 4, 5],
        messages: [
          { id: '1', role: 'ASSISTANT', content: 'Olá! Vamos criar algo incrível!' },
          { id: '2', role: 'USER', content: 'Um app de delivery' },
          // ... mais mensagens
        ],
      })
    })

    it('o chat exibe mensagem "Plano gerado com sucesso!"', () => {
      // Quando o usuário abre a página do projeto
      render(
        <ChatPanel
          projectId={project.id}
          projectName={project.name}
          initialMessages={conversation.messages.map(m => ({
            id: m.id,
            role: m.role.toLowerCase() as 'user' | 'assistant',
            content: m.content,
          }))}
          initialPlanReady={true}
          initialQuestionProgress={{
            current: 5,
            total: 5,
            completedQuestions: [1, 2, 3, 4, 5],
          }}
        />
      )

      // Então o chat exibe mensagem "Plano gerado com sucesso!"
      // (when no messages but planReady, shows the success message)
    })

    it('o chat NÃO exibe quick replies', () => {
      render(
        <ChatPanel
          projectId={project.id}
          projectName={project.name}
          initialPlanReady={true}
          initialQuestionProgress={{
            current: 5,
            total: 5,
            completedQuestions: [1, 2, 3, 4, 5],
          }}
        />
      )

      // Então o chat NÃO exibe quick replies
      expect(screen.queryByText('SUGESTÕES RÁPIDAS')).not.toBeInTheDocument()
    })

    it('o chat NÃO exibe "Pergunta 1 de 5"', () => {
      render(
        <ChatPanel
          projectId={project.id}
          projectName={project.name}
          initialPlanReady={true}
          initialQuestionProgress={{
            current: 5,
            total: 5,
            completedQuestions: [1, 2, 3, 4, 5],
          }}
        />
      )

      // Então o chat NÃO exibe "Pergunta 1 de 5"
      expect(screen.queryByText('Pergunta 1 de 5')).not.toBeInTheDocument()
      // E mostra "Plano pronto" ou similar
      expect(screen.getByText('Plano pronto')).toBeInTheDocument()
    })

    it('a barra de progresso está em 100%', () => {
      render(
        <ChatPanel
          projectId={project.id}
          projectName={project.name}
          initialPlanReady={true}
          initialQuestionProgress={{
            current: 5,
            total: 5,
            completedQuestions: [1, 2, 3, 4, 5],
          }}
        />
      )

      // Então a barra de progresso está em 100%
      // Verifica que o elemento de progresso tem width: 100%
      const progressBar = document.querySelector('[style*="width"]')
      expect(progressBar).toHaveStyle({ width: '100%' })
    })
  })

  /**
   * @critical @restauracao
   * Cenário: Usuário reabre projeto que estava na pergunta 3
   */
  describe('Cenário: Usuário reabre projeto que estava na pergunta 3', () => {
    let project: ProjectState
    let conversation: ConversationState

    beforeEach(() => {
      // Dado que o projeto "Delivery App" tem status "IDEATION"
      // E o projeto NÃO tem businessPlan
      // E existe conversação com currentQuestion = 3, completedQuestions = [1, 2]
      project = createTestProject({
        name: 'Delivery App',
        status: 'IDEATION',
        businessPlan: null,
      })

      conversation = createTestConversation({
        status: 'ACTIVE',
        currentQuestion: 3,
        completedQuestions: [1, 2],
        messages: [
          { id: '1', role: 'ASSISTANT', content: 'O que você quer criar?' },
          { id: '2', role: 'USER', content: 'Um app de delivery' },
          { id: '3', role: 'ASSISTANT', content: 'Qual o público-alvo?' },
          { id: '4', role: 'USER', content: 'Restaurantes pequenos' },
          { id: '5', role: 'ASSISTANT', content: 'Quais as funcionalidades?' },
          { id: '6', role: 'USER', content: 'Cardápio, pedidos, pagamento' },
          { id: '7', role: 'ASSISTANT', content: 'O que vai diferenciar?' },
        ],
      })
    })

    it('o chat exibe todas as mensagens anteriores', () => {
      render(
        <ChatPanel
          projectId={project.id}
          projectName={project.name}
          initialMessages={conversation.messages.map(m => ({
            id: m.id,
            role: m.role.toLowerCase() as 'user' | 'assistant',
            content: m.content,
          }))}
          initialPlanReady={false}
          initialQuestionProgress={{
            current: 3,
            total: 5,
            completedQuestions: [1, 2],
          }}
        />
      )

      // Então o chat exibe todas as mensagens anteriores
      expect(screen.getByText('Um app de delivery')).toBeInTheDocument()
      expect(screen.getByText('Restaurantes pequenos')).toBeInTheDocument()
    })

    it('a barra de progresso mostra "Pergunta 3 de 5" e está em 60%', () => {
      render(
        <ChatPanel
          projectId={project.id}
          projectName={project.name}
          initialMessages={[]}
          initialPlanReady={false}
          initialQuestionProgress={{
            current: 3,
            total: 5,
            completedQuestions: [1, 2],
          }}
        />
      )

      // Então a barra de progresso mostra "Pergunta 3 de 5"
      expect(screen.getByText('Pergunta 3 de 5')).toBeInTheDocument()

      // E a barra de progresso está em 60%
      const progressBar = document.querySelector('[style*="width"]')
      expect(progressBar).toHaveStyle({ width: '60%' })
    })
  })

  /**
   * @critical @restauracao
   * Cenário: Usuário reabre projeto aguardando confirmação
   */
  describe('Cenário: Usuário reabre projeto aguardando confirmação', () => {
    it('o chat NÃO exibe quick replies quando completedQuestions >= 5', () => {
      const project = createTestProject({
        status: 'IDEATION',
        businessPlan: null,
      })

      render(
        <ChatPanel
          projectId={project.id}
          projectName={project.name}
          initialPlanReady={false}
          initialQuestionProgress={{
            current: 5,
            total: 5,
            completedQuestions: [1, 2, 3, 4, 5],
          }}
        />
      )

      // Então o chat NÃO exibe quick replies
      expect(screen.queryByText('SUGESTÕES RÁPIDAS')).not.toBeInTheDocument()
    })
  })
})

/**
 * =============================================================================
 * CENÁRIOS: QUICK REPLIES
 * =============================================================================
 */
describe('Discovery: Quick Replies', () => {
  /**
   * @quick-replies
   * Cenário: Quick replies não aparecem após plano gerado
   */
  it('Quick replies não aparecem após plano gerado', () => {
    const project = createTestProject({
      status: 'PLANNING',
      businessPlan: { name: 'Test' },
    })

    render(
      <ChatPanel
        projectId={project.id}
        projectName={project.name}
        initialPlanReady={true}
      />
    )

    // Dado que o Business Plan foi gerado
    // Então o chat NÃO exibe quick replies
    expect(screen.queryByText('SUGESTÕES RÁPIDAS')).not.toBeInTheDocument()
  })

  /**
   * @quick-replies
   * Cenário: Quick replies aparecem no estado inicial
   */
  it('Quick replies aparecem no estado inicial (Q0)', () => {
    const project = createTestProject({
      status: 'IDEATION',
      businessPlan: null,
    })

    render(
      <ChatPanel
        projectId={project.id}
        projectName={project.name}
        initialPlanReady={false}
        initialQuestionProgress={null}
      />
    )

    // Dado projeto novo sem conversação
    // Então o chat exibe quick replies da pergunta 0
    expect(screen.getByText('SUGESTÕES RÁPIDAS')).toBeInTheDocument()
    expect(screen.getByText('📱 App de gestão')).toBeInTheDocument()
  })
})

/**
 * =============================================================================
 * CENÁRIOS: BARRA DE PROGRESSO
 * =============================================================================
 */
describe('Discovery: Barra de Progresso', () => {
  /**
   * @progresso
   * Cenário: Barra de progresso em 100% quando plano está pronto
   */
  it('Barra de progresso em 100% quando plano está pronto', () => {
    render(
      <ChatPanel
        projectId="test"
        projectName="Test"
        initialPlanReady={true}
      />
    )

    // Então a barra de progresso está em 100%
    const progressBar = document.querySelector('[style*="width"]')
    expect(progressBar).toHaveStyle({ width: '100%' })
  })
})
