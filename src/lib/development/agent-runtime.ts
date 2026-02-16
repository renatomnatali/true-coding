import { z } from 'zod'
import { chat } from '@/lib/ai/claude'
import { extractJSON } from '@/lib/ai/parsers'
import type { ModelPhase } from '@/lib/ai/config'
import type { AgentExecutionResult } from './types'

export interface ClaudeAgentRunOptions<TSchema extends z.ZodTypeAny> {
  agentName: string
  systemPrompt: string
  userPrompt: string
  schema: TSchema
  phase?: ModelPhase
}

interface AgentUsage {
  inputTokens: number
  outputTokens: number
}

function estimateTokenUsage(rawText: string): number {
  return Math.max(1, Math.ceil(rawText.length / 4))
}

function estimateUsdCost(usage?: AgentUsage): number | undefined {
  if (!usage) return undefined

  // Conservative estimate for Sonnet-class model pricing.
  const inputCost = (usage.inputTokens / 1_000) * 0.003
  const outputCost = (usage.outputTokens / 1_000) * 0.015

  return Number((inputCost + outputCost).toFixed(6))
}

function truncate(text: string, max = 220): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max)}...`
}

export function isClaudeAgentRuntimeEnabled(): boolean {
  return (
    process.env.AUTONOMOUS_DEV_LLM_AGENTS === 'true' &&
    Boolean(process.env.ANTHROPIC_API_KEY)
  )
}

export async function runClaudeAgent<TSchema extends z.ZodTypeAny>(
  options: ClaudeAgentRunOptions<TSchema>
): Promise<AgentExecutionResult<z.infer<TSchema>>> {
  const { text, stopReason, usage } = await chat({
    phase: options.phase ?? 'codegen',
    systemPrompt: options.systemPrompt,
    messages: [{ role: 'user', content: options.userPrompt }],
  })

  if (stopReason === 'max_tokens') {
    throw new Error(`AGENT_RESPONSE_TRUNCATED:${options.agentName}`)
  }

  const { data, repaired } = extractJSON<unknown>(text)

  if (!data) {
    throw new Error(`AGENT_RESPONSE_INVALID_JSON:${options.agentName}`)
  }

  if (repaired) {
    throw new Error(`AGENT_RESPONSE_TRUNCATED:${options.agentName}`)
  }

  const parsed = options.schema.safeParse(data)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const path = issue?.path?.length ? issue.path.join('.') : 'root'
    const reason = issue?.message ?? 'invalid output'
    throw new Error(
      `AGENT_CONTRACT_INVALID:${options.agentName}:${path}:${truncate(reason)}`
    )
  }

  const tokenUsage =
    usage && usage.inputTokens >= 0 && usage.outputTokens >= 0
      ? usage.inputTokens + usage.outputTokens
      : estimateTokenUsage(text)

  return {
    output: parsed.data,
    tokenUsage,
    cost: estimateUsdCost(usage),
  }
}
