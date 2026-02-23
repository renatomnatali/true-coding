import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runClaudeAgentWithCache, type CachedAgentOptions } from './agent-runtime'
import type { ContentBlock } from '@/lib/ai/claude'
import { z } from 'zod'

// Mock dependencies
vi.mock('@/lib/ai/claude', () => ({
  chat: vi.fn(),
  buildMessagesWithCache: vi.fn(),
}))

describe('runClaudeAgentWithCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aceita content blocks com cache_control', async () => {
    const mockChat = vi.mocked(await import('@/lib/ai/claude')).chat
    mockChat.mockResolvedValue({
      text: '{"result": "ok"}',
      stopReason: 'end_turn',
      usage: { inputTokens: 100, outputTokens: 50 },
    })

    const contentBlocks: ContentBlock[] = [
      { type: 'text', text: 'System context...', cache_control: { type: 'ephemeral' } },
      { type: 'text', text: 'User prompt' },
    ]

    const options: CachedAgentOptions = {
      agentName: 'TestAgent',
      systemPrompt: 'You are a test agent',
      contentBlocks,
      schema: z.object({ result: z.string() }),
    }

    const result = await runClaudeAgentWithCache(options)

    expect(result.output).toEqual({ result: 'ok' })
    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: contentBlocks }),
        ]),
      })
    )
  })

  it('retorna tokenUsage correto', async () => {
    const mockChat = vi.mocked(await import('@/lib/ai/claude')).chat
    mockChat.mockResolvedValue({
      text: '{"value": 42}',
      stopReason: 'end_turn',
      usage: { inputTokens: 200, outputTokens: 100 },
    })

    const result = await runClaudeAgentWithCache({
      agentName: 'Test',
      systemPrompt: 'Test',
      contentBlocks: [{ type: 'text', text: 'test' }],
      schema: z.object({ value: z.number() }),
    })

    expect(result.tokenUsage).toBe(300)
  })

  it('lança erro quando response truncado', async () => {
    const mockChat = vi.mocked(await import('@/lib/ai/claude')).chat
    mockChat.mockResolvedValue({
      text: '{"partial":',
      stopReason: 'max_tokens',
      usage: { inputTokens: 100, outputTokens: 4000 },
      model: 'glm-5',
      provider: 'zai',
      maxTokens: 4096,
    })

    try {
      await runClaudeAgentWithCache({
        agentName: 'CodeAgent',
        systemPrompt: 'Test',
        contentBlocks: [{ type: 'text', text: 'test' }],
        schema: z.object({}),
      })
      throw new Error('EXPECTED_TRUNCATION')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      expect(message).toContain('AGENT_RESPONSE_TRUNCATED:CodeAgent')
      expect(message).toContain('stopReason=max_tokens')
      expect(message).toContain('provider=zai')
      expect(message).toContain('model=glm-5')
      expect(message).toContain('maxTokens=4096')
    }
  })
})
