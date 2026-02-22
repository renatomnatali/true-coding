import { describe, it, expect, vi } from 'vitest'
import { buildMessagesWithCache, type ContentBlock } from './claude'

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn(),
      stream: vi.fn(),
    }
  },
}))

describe('buildMessagesWithCache', () => {
  it('converte string simples para content block sem cache', () => {
    const messages = [{ role: 'user' as const, content: 'Hello' }]

    const result = buildMessagesWithCache(messages)

    expect(result).toEqual([{ role: 'user', content: 'Hello' }])
  })

  it('preserva content blocks com cache_control', () => {
    const messages: Array<{ role: 'user' | 'assistant'; content: string | ContentBlock[] }> = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'System prompt', cache_control: { type: 'ephemeral' } },
          { type: 'text', text: 'User message' },
        ],
      },
    ]

    const result = buildMessagesWithCache(messages)

    expect(result).toEqual(messages)
    expect((result[0].content as ContentBlock[])[0].cache_control).toEqual({ type: 'ephemeral' })
  })

  it('adiciona cache_control em system prompt longo', () => {
    const longPrompt = 'A'.repeat(5000)
    const messages = [{ role: 'user' as const, content: `Context: ${longPrompt}\n\nQuestion: test?` }]

    const result = buildMessagesWithCache(messages, { cacheSystemPrompt: true })

    // Quando cacheSystemPrompt é true, retorna array de content blocks
    expect(Array.isArray(result[0].content)).toBe(true)
    const blocks = result[0].content as ContentBlock[]
    expect(blocks[0].cache_control).toEqual({ type: 'ephemeral' })
  })
})
