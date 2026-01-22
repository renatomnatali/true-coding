export const MODEL_CONFIG = {
  discovery: {
    model: 'claude-3-haiku-20240307' as const,
    maxTokens: 1024,
    temperature: 0.7,
  },
  planning: {
    model: 'claude-sonnet-4-20250514' as const,
    maxTokens: 4096,
    temperature: 0.3,
  },
  codegen: {
    model: 'claude-sonnet-4-20250514' as const,
    maxTokens: 4096,
    temperature: 0.2,
  },
} as const

export type ModelPhase = keyof typeof MODEL_CONFIG
