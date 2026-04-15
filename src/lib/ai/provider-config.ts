import { MODEL_CONFIG, type ModelPhase } from './config'

export type AIProvider = 'anthropic' | 'zai'

export interface ResolvedAIProviderConfig {
  provider: AIProvider
  apiKey: string
  baseURL?: string
  model: string
}

const ZAI_DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic'
const ZAI_DEFAULT_MODEL = 'glm-5'

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function ensureAbsoluteUrl(value: string, envName: string): string {
  try {
    // Throws when URL is invalid.
    new URL(value)
    return value
  } catch {
    throw new Error(`AI_PROVIDER_MISCONFIGURED:${envName}_INVALID`)
  }
}

function getRequiredEnv(envName: string): string {
  const value = normalizeEnvValue(process.env[envName])
  if (!value) {
    throw new Error(`AI_PROVIDER_MISCONFIGURED:${envName}_MISSING`)
  }
  return value
}

export function resolveAIProvider(): AIProvider {
  const configured = normalizeEnvValue(process.env.AI_PROVIDER)

  if (!configured || configured === 'anthropic') {
    return 'anthropic'
  }

  if (configured === 'zai') {
    return 'zai'
  }

  throw new Error(`AI_PROVIDER_MISCONFIGURED:AI_PROVIDER_INVALID:${configured}`)
}

export function resolveAIProviderConfig(
  phase: ModelPhase
): ResolvedAIProviderConfig {
  const provider = resolveAIProvider()

  if (provider === 'anthropic') {
    const apiKey = getRequiredEnv('ANTHROPIC_API_KEY')
    const baseURLRaw = normalizeEnvValue(process.env.ANTHROPIC_BASE_URL)

    return {
      provider,
      apiKey,
      baseURL: baseURLRaw
        ? ensureAbsoluteUrl(baseURLRaw, 'ANTHROPIC_BASE_URL')
        : undefined,
      model: MODEL_CONFIG[phase].model,
    }
  }

  const apiKey = getRequiredEnv('ZAI_API_KEY')
  const zaiBaseUrl = normalizeEnvValue(process.env.ZAI_ANTHROPIC_BASE_URL)
  const baseURL = ensureAbsoluteUrl(
    zaiBaseUrl ?? ZAI_DEFAULT_BASE_URL,
    'ZAI_ANTHROPIC_BASE_URL'
  )

  return {
    provider,
    apiKey,
    baseURL,
    model: normalizeEnvValue(process.env.ZAI_MODEL) ?? ZAI_DEFAULT_MODEL,
  }
}

export function isAIProviderConfigured(): boolean {
  try {
    resolveAIProviderConfig('codegen')
    return true
  } catch {
    return false
  }
}
