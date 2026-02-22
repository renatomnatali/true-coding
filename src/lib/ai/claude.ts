import Anthropic from '@anthropic-ai/sdk'
import { MODEL_CONFIG, type ModelPhase } from './config'

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  }
  return new Anthropic({ apiKey })
}

// PR2: Content block with optional cache_control
export interface ContentBlock {
  type: 'text'
  text: string
  cache_control?: { type: 'ephemeral' }
}

export interface Message {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

// PR2: Build messages with optional caching for long prompts
export interface BuildMessagesOptions {
  cacheSystemPrompt?: boolean
  cacheThreshold?: number // minimum chars to trigger caching
}

export function buildMessagesWithCache(
  messages: Message[],
  options: BuildMessagesOptions = {}
): Message[] {
  const { cacheSystemPrompt = false, cacheThreshold = 4000 } = options

  return messages.map((msg) => {
    // Already content blocks - return as-is
    if (Array.isArray(msg.content)) {
      return msg
    }

    // String content - check if we should cache
    if (cacheSystemPrompt && msg.content.length >= cacheThreshold) {
      const blocks: ContentBlock[] = [
        {
          type: 'text',
          text: msg.content,
          cache_control: { type: 'ephemeral' },
        },
      ]
      return { ...msg, content: blocks }
    }

    // Regular string - return as-is
    return msg
  })
}

export interface StreamChatOptions {
  phase: ModelPhase
  systemPrompt: string
  messages: Message[]
}

export async function* streamChat(
  options: StreamChatOptions
): AsyncGenerator<string> {
  const config = MODEL_CONFIG[options.phase]
  const anthropic = getAnthropicClient()

  const stream = await anthropic.messages.stream({
    model: config.model,
    max_tokens: config.maxTokens,
    system: options.systemPrompt,
    messages: options.messages,
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }
}

export interface ChatResult {
  text: string
  stopReason: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export async function chat(options: StreamChatOptions): Promise<ChatResult> {
  const config = MODEL_CONFIG[options.phase]
  const anthropic = getAnthropicClient()

  const response = await anthropic.messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    system: options.systemPrompt,
    messages: options.messages,
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  return {
    text: textBlock?.type === 'text' ? textBlock.text : '',
    stopReason: response.stop_reason ?? 'end_turn',
    usage: {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    },
  }
}
