import { z } from 'zod'
import { chat, type ContentBlock } from '@/lib/ai/claude'
import { extractJSON } from '@/lib/ai/parsers'
import type { ModelPhase } from '@/lib/ai/config'
import { isAIProviderConfigured } from '@/lib/ai/provider-config'
import type { AgentExecutionResult } from './types'

export interface ClaudeAgentRunOptions<TSchema extends z.ZodTypeAny> {
  agentName: string
  systemPrompt: string
  userPrompt: string
  schema: TSchema
  phase?: ModelPhase
}

// PR2: Options for cached agent with content blocks
export interface CachedAgentOptions<TSchema extends z.ZodTypeAny> {
  agentName: string
  systemPrompt: string
  contentBlocks: ContentBlock[]
  schema: TSchema
  phase?: ModelPhase
}

interface AgentUsage {
  inputTokens: number
  outputTokens: number
}

interface TruncationContext {
  agentName: string
  phase: ModelPhase
  stopReason?: string
  provider?: string
  model?: string
  maxTokens?: number
  usage?: AgentUsage
  responseChars: number
  jsonRepaired?: boolean
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

function buildTruncationError(ctx: TruncationContext): Error {
  const details = [
    `phase=${ctx.phase}`,
    `stopReason=${ctx.stopReason ?? 'unknown'}`,
    `provider=${ctx.provider ?? 'unknown'}`,
    `model=${ctx.model ?? 'unknown'}`,
    `maxTokens=${ctx.maxTokens ?? 'unknown'}`,
    `inputTokens=${ctx.usage?.inputTokens ?? 'unknown'}`,
    `outputTokens=${ctx.usage?.outputTokens ?? 'unknown'}`,
    `responseChars=${ctx.responseChars}`,
    `jsonRepaired=${ctx.jsonRepaired ? 'true' : 'false'}`,
  ].join(';')

  console.warn('[agent-runtime] resposta truncada', {
    agentName: ctx.agentName,
    phase: ctx.phase,
    stopReason: ctx.stopReason ?? 'unknown',
    provider: ctx.provider ?? 'unknown',
    model: ctx.model ?? 'unknown',
    maxTokens: ctx.maxTokens ?? 'unknown',
    inputTokens: ctx.usage?.inputTokens ?? null,
    outputTokens: ctx.usage?.outputTokens ?? null,
    responseChars: ctx.responseChars,
    jsonRepaired: Boolean(ctx.jsonRepaired),
  })

  return new Error(`AGENT_RESPONSE_TRUNCATED:${ctx.agentName}:${details}`)
}

export function isClaudeAgentRuntimeEnabled(): boolean {
  return (
    process.env.AUTONOMOUS_DEV_LLM_AGENTS === 'true' &&
    isAIProviderConfigured()
  )
}

export async function runClaudeAgent<TSchema extends z.ZodTypeAny>(
  options: ClaudeAgentRunOptions<TSchema>
): Promise<AgentExecutionResult<z.infer<TSchema>>> {
  const phase = options.phase ?? 'codegen'
  const { text, stopReason, usage, provider, model, maxTokens } = await chat({
    phase,
    systemPrompt: options.systemPrompt,
    messages: [{ role: 'user', content: options.userPrompt }],
  })

  if (stopReason === 'max_tokens') {
    throw buildTruncationError({
      agentName: options.agentName,
      phase,
      stopReason,
      provider,
      model,
      maxTokens,
      usage,
      responseChars: text.length,
      jsonRepaired: false,
    })
  }

  const { data, repaired } = extractJSON<unknown>(text)

  if (!data) {
    throw new Error(`AGENT_RESPONSE_INVALID_JSON:${options.agentName}`)
  }

  if (repaired) {
    throw buildTruncationError({
      agentName: options.agentName,
      phase,
      stopReason,
      provider,
      model,
      maxTokens,
      usage,
      responseChars: text.length,
      jsonRepaired: true,
    })
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

// PR2: Run Claude agent with content blocks supporting cache_control
export async function runClaudeAgentWithCache<TSchema extends z.ZodTypeAny>(
  options: CachedAgentOptions<TSchema>
): Promise<AgentExecutionResult<z.infer<TSchema>>> {
  const phase = options.phase ?? 'codegen'
  const { text, stopReason, usage, provider, model, maxTokens } = await chat({
    phase,
    systemPrompt: options.systemPrompt,
    messages: [{ role: 'user', content: options.contentBlocks }],
  })

  if (stopReason === 'max_tokens') {
    throw buildTruncationError({
      agentName: options.agentName,
      phase,
      stopReason,
      provider,
      model,
      maxTokens,
      usage,
      responseChars: text.length,
      jsonRepaired: false,
    })
  }

  const { data, repaired } = extractJSON<unknown>(text)

  if (!data) {
    throw new Error(`AGENT_RESPONSE_INVALID_JSON:${options.agentName}`)
  }

  if (repaired) {
    throw buildTruncationError({
      agentName: options.agentName,
      phase,
      stopReason,
      provider,
      model,
      maxTokens,
      usage,
      responseChars: text.length,
      jsonRepaired: true,
    })
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
