import Anthropic from '@anthropic-ai/sdk'
import { MODEL_CONFIG, type ModelPhase } from './config'

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  }
  return new Anthropic({ apiKey })
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
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

export async function chat(options: StreamChatOptions): Promise<string> {
  const config = MODEL_CONFIG[options.phase]
  const anthropic = getAnthropicClient()

  const response = await anthropic.messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    system: options.systemPrompt,
    messages: options.messages,
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : ''
}
