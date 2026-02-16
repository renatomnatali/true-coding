import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const { chatMock } = vi.hoisted(() => ({
  chatMock: vi.fn(),
}))

vi.mock('@/lib/ai/claude', () => ({
  chat: chatMock,
}))

import { isClaudeAgentRuntimeEnabled, runClaudeAgent } from './agent-runtime'

describe('agent runtime', () => {
  const originalLlmFlag = process.env.AUTONOMOUS_DEV_LLM_AGENTS
  const originalApiKey = process.env.ANTHROPIC_API_KEY

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (typeof originalLlmFlag === 'undefined') {
      delete process.env.AUTONOMOUS_DEV_LLM_AGENTS
    } else {
      process.env.AUTONOMOUS_DEV_LLM_AGENTS = originalLlmFlag
    }

    if (typeof originalApiKey === 'undefined') {
      delete process.env.ANTHROPIC_API_KEY
    } else {
      process.env.ANTHROPIC_API_KEY = originalApiKey
    }
  })

  it('enables runtime only when flag and API key are present', () => {
    process.env.AUTONOMOUS_DEV_LLM_AGENTS = 'false'
    process.env.ANTHROPIC_API_KEY = 'key'
    expect(isClaudeAgentRuntimeEnabled()).toBe(false)

    process.env.AUTONOMOUS_DEV_LLM_AGENTS = 'true'
    delete process.env.ANTHROPIC_API_KEY
    expect(isClaudeAgentRuntimeEnabled()).toBe(false)

    process.env.AUTONOMOUS_DEV_LLM_AGENTS = 'true'
    process.env.ANTHROPIC_API_KEY = 'key'
    expect(isClaudeAgentRuntimeEnabled()).toBe(true)
  })

  it('parses and validates JSON payload returned by Claude', async () => {
    chatMock.mockResolvedValue({
      text: '```json\n{"approved":true,"notes":"ok"}\n```',
      stopReason: 'end_turn',
      usage: { inputTokens: 120, outputTokens: 80 },
    })

    const result = await runClaudeAgent({
      agentName: 'ReviewAgent',
      systemPrompt: 'system',
      userPrompt: 'user',
      schema: z.object({
        approved: z.boolean(),
        notes: z.string(),
      }),
    })

    expect(result.output).toEqual({
      approved: true,
      notes: 'ok',
    })
    expect(result.tokenUsage).toBe(200)
    expect(result.cost).toBeGreaterThan(0)
  })

  it('throws truncation error when Claude stops by max_tokens', async () => {
    chatMock.mockResolvedValue({
      text: '```json\n{"approved":true}\n```',
      stopReason: 'max_tokens',
    })

    await expect(
      runClaudeAgent({
        agentName: 'ReviewAgent',
        systemPrompt: 'system',
        userPrompt: 'user',
        schema: z.object({ approved: z.boolean() }),
      })
    ).rejects.toThrow('AGENT_RESPONSE_TRUNCATED:ReviewAgent')
  })

  it('throws contract error when JSON does not match schema', async () => {
    chatMock.mockResolvedValue({
      text: '```json\n{"approved":"yes"}\n```',
      stopReason: 'end_turn',
    })

    await expect(
      runClaudeAgent({
        agentName: 'ReviewAgent',
        systemPrompt: 'system',
        userPrompt: 'user',
        schema: z.object({ approved: z.boolean() }),
      })
    ).rejects.toThrow('AGENT_CONTRACT_INVALID:ReviewAgent')
  })
})
