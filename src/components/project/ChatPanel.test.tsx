import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatPanel } from './ChatPanel'

vi.mock('./ProjectLayout', () => ({
  useProjectLayout: () => ({
    setChatOpen: vi.fn(),
  }),
}))

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { firstName: 'Renato' } }),
}))

vi.mock('@/config/features', () => ({
  FEATURES: {
    QUICK_REPLIES: true,
    PROGRESS_TRACKING: true,
    EXECUTION_CHAT_FEED: false,
    AUTONOMOUS_DEVELOPMENT_V1: false,
    STRUCTURED_DISCOVERY: true,
  },
}))

// ExecutionFeedPanel não deve ser usado pois EXECUTION_CHAT_FEED=false
vi.mock('./ExecutionFeedPanel', () => ({
  ExecutionFeedPanel: () => null,
}))

vi.mock('./PlanGenerationOverlay', () => ({
  PlanGenerationOverlay: () => null,
}))

describe('ChatPanel - @inicio (discovery.feature)', () => {
  beforeEach(() => {
    global.fetch = vi.fn() as unknown as typeof fetch
  })

  it('renderiza mensagem inicial e as 4 quick replies exatas da pergunta 0', () => {
    render(
      <ChatPanel
        projectId="proj-1"
        projectName="Meu Projeto"
        projectStatus="IDEATION"
      />
    )

    // Mensagem inicial da IA (aproximação via strong "O que você gostaria de criar?")
    expect(
      screen.getByText('O que você gostaria de criar?')
    ).toBeInTheDocument()

    // Quick replies exatas de discovery.feature linhas 36-39
    expect(screen.getByText('📱 App de gestão')).toBeInTheDocument()
    expect(screen.getByText('🛒 E-commerce')).toBeInTheDocument()
    expect(screen.getByText('📊 Dashboard')).toBeInTheDocument()
    expect(screen.getByText('🎨 Portfolio')).toBeInTheDocument()
  })

  it('barra de progresso exibe "Pergunta 1 de 5" com width 20%', () => {
    const { container } = render(
      <ChatPanel
        projectId="proj-1"
        projectName="Meu Projeto"
        projectStatus="IDEATION"
      />
    )

    expect(screen.getByText('Pergunta 1 de 5')).toBeInTheDocument()

    const progressFill = container.querySelector('.bg-amber-500') as HTMLElement | null
    expect(progressFill).not.toBeNull()
    expect(progressFill?.style.width).toBe('20%')
  })
})

describe('ChatPanel - @chat @enter / @shift-enter', () => {
  beforeEach(() => {
    // Retorno de stream vazio mas ok
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
        }),
      },
    }) as unknown as typeof fetch
  })

  it('pressionar Enter envia mensagem e limpa o input', async () => {
    const user = userEvent.setup()
    render(
      <ChatPanel
        projectId="proj-1"
        projectName="Meu Projeto"
        projectStatus="IDEATION"
      />
    )

    const textarea = screen.getByPlaceholderText('Digite sua resposta...') as HTMLTextAreaElement
    await user.type(textarea, 'Olá mundo')
    expect(textarea.value).toBe('Olá mundo')

    await user.keyboard('{Enter}')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        method: 'POST',
      })
    )
    expect(textarea.value).toBe('')
  })

  it('Shift+Enter quebra linha e nao envia mensagem', async () => {
    const user = userEvent.setup()
    render(
      <ChatPanel
        projectId="proj-1"
        projectName="Meu Projeto"
        projectStatus="IDEATION"
      />
    )

    const textarea = screen.getByPlaceholderText('Digite sua resposta...') as HTMLTextAreaElement
    await user.type(textarea, 'linha1')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    await user.type(textarea, 'linha2')

    expect(textarea.value).toBe('linha1\nlinha2')
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

describe('ChatPanel - @quick-replies @esconder', () => {
  beforeEach(() => {
    global.fetch = vi.fn() as unknown as typeof fetch
  })

  it('nao exibe quick replies apos Q5 respondida (completedQuestions.length >= 5)', () => {
    render(
      <ChatPanel
        projectId="proj-1"
        projectName="Meu Projeto"
        projectStatus="IDEATION"
        initialQuestionProgress={{
          current: 5,
          total: 5,
          completedQuestions: [1, 2, 3, 4, 5],
        }}
      />
    )

    expect(screen.queryByText('SUGESTÕES RÁPIDAS')).not.toBeInTheDocument()
    expect(screen.queryByText('📱 App de gestão')).not.toBeInTheDocument()
    expect(screen.queryByText('💳 Freemium')).not.toBeInTheDocument()
  })

  it('nao exibe quick replies quando businessPlan ja esta pronto', () => {
    render(
      <ChatPanel
        projectId="proj-1"
        projectName="Meu Projeto"
        projectStatus="IDEATION"
        initialPlanReady
      />
    )

    expect(screen.queryByText('SUGESTÕES RÁPIDAS')).not.toBeInTheDocument()
    expect(screen.queryByText('📱 App de gestão')).not.toBeInTheDocument()
    expect(screen.getByText('Plano pronto')).toBeInTheDocument()
  })
})
