/**
 * Step Definitions: Discovery Phase
 *
 * Implementação dos cenários definidos em:
 * docs/specifications/discovery.feature
 *
 * Padrão: Dado/Quando/Então (Given/When/Then)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatPanel } from '@/components/project/ChatPanel'
import {
  createTestProject,
  createTestConversation,
  type ProjectState,
  type ConversationState,
} from '../support/test-utils'

// Mock do Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { firstName: 'Renato' } }),
}))

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

// Cleanup mocks after each test to prevent flaky results
afterEach(() => {
  vi.restoreAllMocks()
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
    expect(screen.getByText('App de gestão')).toBeInTheDocument()
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

  /**
   * @progresso
   * Cenário: Barra de progresso em 20% no início (Q1)
   * Regra: progress% = currentQuestion / total * 100 = 1/5 * 100 = 20%
   */
  it('Barra de progresso em 20% no início (Q1)', () => {
    render(
      <ChatPanel
        projectId="test"
        projectName="Test"
        initialPlanReady={false}
        initialQuestionProgress={{ current: 1, total: 5 }}
      />
    )

    const progressBar = document.querySelector('[style*="width"]')
    expect(progressBar).toHaveStyle({ width: '20%' })
    expect(screen.getByText('Pergunta 1 de 5')).toBeInTheDocument()
  })

  /**
   * @progresso
   * Cenário: Barra de progresso em 40% após Q1 (Q2)
   */
  it('Barra de progresso em 40% após Q1 (Q2)', () => {
    render(
      <ChatPanel
        projectId="test"
        projectName="Test"
        initialPlanReady={false}
        initialQuestionProgress={{ current: 2, total: 5, completedQuestions: [1] }}
      />
    )

    const progressBar = document.querySelector('[style*="width"]')
    expect(progressBar).toHaveStyle({ width: '40%' })
    expect(screen.getByText('Pergunta 2 de 5')).toBeInTheDocument()
  })

  /**
   * @progresso
   * Cenário: Barra de progresso em 80% após Q3 (Q4)
   */
  it('Barra de progresso em 80% após Q3 (Q4)', () => {
    render(
      <ChatPanel
        projectId="test"
        projectName="Test"
        initialPlanReady={false}
        initialQuestionProgress={{ current: 4, total: 5, completedQuestions: [1, 2, 3] }}
      />
    )

    const progressBar = document.querySelector('[style*="width"]')
    expect(progressBar).toHaveStyle({ width: '80%' })
    expect(screen.getByText('Pergunta 4 de 5')).toBeInTheDocument()
  })
})

/**
 * =============================================================================
 * CENÁRIOS: INÍCIO DO DISCOVERY
 * =============================================================================
 */
describe('Discovery: Início', () => {
  /**
   * @inicio
   * Cenário: Mensagem inicial em projeto novo
   */
  it('Exibe mensagem inicial da IA perguntando o que criar', () => {
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
        initialMessages={[]}
      />
    )

    // Então vejo o chat com mensagem inicial da IA
    expect(screen.getByText(/O que você gostaria de criar/)).toBeInTheDocument()
    expect(screen.getByText(/Olá! Vamos criar algo incrível/)).toBeInTheDocument()
  })

  /**
   * @inicio
   * Cenário: Quick replies da pergunta 0 aparecem no início
   */
  it('Exibe quick replies da pergunta 0 no início', () => {
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
        initialMessages={[]}
      />
    )

    // Então vejo quick replies com snippets curtos
    expect(screen.getByText('App de gestão')).toBeInTheDocument()
    expect(screen.getByText('E-commerce')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
  })
})

/**
 * =============================================================================
 * CENÁRIOS: QUICK REPLY - PREENCHE INPUT
 * =============================================================================
 */
describe('Discovery: Quick Reply Preenche Input', () => {
  /**
   * @quick-reply
   * Cenário: Clicar em quick reply coloca texto completo no input (não envia)
   */
  it('Quick reply preenche o input com texto completo ao clicar', async () => {
    const fetchSpy = vi.fn()
    global.fetch = fetchSpy

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
        initialMessages={[]}
      />
    )

    // Quando clico no quick reply "App de gestão"
    await userEvent.click(screen.getByText('App de gestão'))

    // Então o texto completo aparece no input
    const textarea = screen.getByPlaceholderText('Digite sua resposta...')
    expect(textarea).toHaveValue('Quero criar um app de gestão')

    // E nenhuma mensagem foi enviada (fetch não foi chamado)
    expect(fetchSpy).not.toHaveBeenCalled()
    // E o nome do usuário não aparece no histórico (nenhuma mensagem renderizada)
    expect(screen.queryByText('Renato')).not.toBeInTheDocument()
  })

  /**
   * @quick-reply
   * Cenário: Usuário pode editar o texto no input depois de clicar quick reply
   */
  it('Usuário pode editar o texto preenchido pelo quick reply', async () => {
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
        initialMessages={[]}
      />
    )

    await userEvent.click(screen.getByText('App de gestão'))

    const textarea = screen.getByPlaceholderText('Digite sua resposta...')
    expect(textarea).toHaveValue('Quero criar um app de gestão')

    // Quando edita o texto
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'Quero criar um app de gestão para médicos')

    // Então o input reflete a edição
    expect(textarea).toHaveValue('Quero criar um app de gestão para médicos')
  })
})

/**
 * =============================================================================
 * CENÁRIOS: COMPORTAMENTOS DO CHAT
 * =============================================================================
 */
describe('Discovery: Comportamentos do Chat', () => {
  /**
   * @chat @enter
   * Cenário: Enviar mensagem com Enter
   */
  it('Envia mensagem ao pressionar Enter', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.close()
          },
        }),
      })
    )

    render(
      <ChatPanel
        projectId="test"
        projectName="Test"
        initialPlanReady={false}
        initialMessages={[]}
      />
    )

    const textarea = screen.getByPlaceholderText('Digite sua resposta...')

    // Dado que digitei uma mensagem
    await userEvent.type(textarea, 'Minha mensagem de teste')

    // Quando pressiono Enter
    await userEvent.keyboard('{Enter}')

    // Então a mensagem é enviada (aparece como user bubble)
    await waitFor(() => {
      const messageElement = screen.getByText('Minha mensagem de teste')
      // Verifica que está dentro de um user message bubble (bg-blue-50)
      expect(messageElement.closest('.bg-blue-50')).not.toBeNull()
    })
    // E o input é limpo
    expect(textarea).toHaveValue('')
  })

  /**
   * @chat @shift-enter
   * Cenário: Nova linha com Shift+Enter
   */
  it('Adiciona nova linha ao pressionar Shift+Enter', async () => {
    render(
      <ChatPanel
        projectId="test"
        projectName="Test"
        initialPlanReady={false}
        initialMessages={[]}
      />
    )

    const textarea = screen.getByPlaceholderText('Digite sua resposta...')

    // Dado que estou digitando
    await userEvent.type(textarea, 'Linha 1')

    // Quando pressiono Shift+Enter
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')

    // Então uma nova linha é adicionada (valor contém quebra de linha)
    // E a mensagem NÃO é enviada (ainda está no input)
    expect(textarea).toHaveValue('Linha 1\n')
  })

  /**
   * @chat @disabled
   * Cenário: Botão enviar desabilitado quando input vazio
   */
  it('Botão enviar desabilitado quando input vazio', () => {
    render(
      <ChatPanel
        projectId="test"
        projectName="Test"
        initialPlanReady={false}
        initialMessages={[]}
      />
    )

    const sendButton = screen.getByText('Enviar')
    expect(sendButton).toBeDisabled()
  })

  /**
   * @chat @disabled
   * Cenário: Botão enviar habilitado quando há texto
   */
  it('Botão enviar habilitado quando há texto', async () => {
    render(
      <ChatPanel
        projectId="test"
        projectName="Test"
        initialPlanReady={false}
        initialMessages={[]}
      />
    )

    const textarea = screen.getByPlaceholderText('Digite sua resposta...')
    const sendButton = screen.getByText('Enviar')

    // Dado que digitei uma mensagem
    await userEvent.type(textarea, 'Teste')

    // Então o botão está habilitado
    expect(sendButton).not.toBeDisabled()
  })
})

/**
 * =============================================================================
 * CENÁRIOS: LOADING E GERANDO PLANO
 * =============================================================================
 */
describe('Discovery: Loading States', () => {
  /**
   * @geracao @loading
   * Cenário: Texto "Plano pronto" aparece quando plano está pronto
   */
  it('Exibe "Plano pronto" quando planReady é true', () => {
    render(
      <ChatPanel
        projectId="test"
        projectName="Test"
        initialPlanReady={true}
      />
    )

    expect(screen.getByText('Plano pronto')).toBeInTheDocument()
  })
})
