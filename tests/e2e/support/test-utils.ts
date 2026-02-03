/**
 * BDD Test Utilities
 *
 * Helpers para testes baseados em cenários Gherkin.
 * Referência: docs/specifications/discovery.feature
 */

import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

// Types for test context
export interface ProjectState {
  id: string
  name: string
  status: 'IDEATION' | 'PLANNING' | 'CONNECTING' | 'GENERATING' | 'DEPLOYING' | 'LIVE'
  businessPlan: Record<string, unknown> | null
  technicalPlan: Record<string, unknown> | null
  uxPlan: Record<string, unknown> | null
}

export interface ConversationState {
  id: string
  phase: 'DISCOVERY' | 'PLANNING'
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED'
  currentQuestion: number | null
  completedQuestions: number[]
  messages: Array<{
    id: string
    role: 'USER' | 'ASSISTANT'
    content: string
  }>
}

export interface TestContext {
  project: ProjectState
  conversation: ConversationState | null
  user: ReturnType<typeof userEvent.setup>
}

/**
 * Cria um projeto de teste com estado inicial
 */
export function createTestProject(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    id: 'test-project-id',
    name: 'Meu App',
    status: 'IDEATION',
    businessPlan: null,
    technicalPlan: null,
    uxPlan: null,
    ...overrides,
  }
}

/**
 * Cria uma conversação de teste com estado inicial
 */
export function createTestConversation(overrides: Partial<ConversationState> = {}): ConversationState {
  return {
    id: 'test-conversation-id',
    phase: 'DISCOVERY',
    status: 'ACTIVE',
    currentQuestion: null,
    completedQuestions: [],
    messages: [],
    ...overrides,
  }
}

/**
 * Setup de contexto de teste
 */
export function setupTestContext(
  projectOverrides: Partial<ProjectState> = {},
  conversationOverrides: Partial<ConversationState> | null = {}
): TestContext {
  return {
    project: createTestProject(projectOverrides),
    conversation: conversationOverrides ? createTestConversation(conversationOverrides) : null,
    user: userEvent.setup(),
  }
}

/**
 * Helpers para assertions baseadas em Gherkin
 * Nota: Usar com vitest expect, ex: import { expect } from 'vitest'
 */
export const assertions = {
  chatToShow: async (text: string) => {
    const { expect } = await import('vitest')
    await waitFor(() => {
      expect(screen.getByText(text)).toBeInTheDocument()
    })
  },

  chatNotToShow: async (text: string) => {
    const { expect } = await import('vitest')
    await waitFor(() => {
      expect(screen.queryByText(text)).not.toBeInTheDocument()
    })
  },

  quickRepliesToBeVisible: async () => {
    const { expect } = await import('vitest')
    await waitFor(() => {
      expect(screen.getByText('SUGESTÕES RÁPIDAS')).toBeInTheDocument()
    })
  },

  quickRepliesToBeHidden: async () => {
    const { expect } = await import('vitest')
    await waitFor(() => {
      expect(screen.queryByText('SUGESTÕES RÁPIDAS')).not.toBeInTheDocument()
    })
  },

  progressBarToShow: async (_percent: number) => {
    // Implementation depends on how progress bar is rendered
  },
}

/**
 * Mock de fetch para simular API responses
 */
export function mockChatAPI(responses: Array<{ event: string; data: unknown }>) {
  const encoder = new TextEncoder()

  global.fetch = vi.fn().mockImplementation(() => {
    const stream = new ReadableStream({
      start(controller) {
        responses.forEach(({ event, data }) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        })
        controller.close()
      },
    })

    return Promise.resolve({
      ok: true,
      body: stream,
    })
  })
}
