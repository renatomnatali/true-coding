import { afterEach, describe, expect, it } from 'vitest'
import {
  isAIProviderConfigured,
  resolveAIProvider,
  resolveAIProviderConfig,
} from './provider-config'
import { MODEL_CONFIG } from './config'

const ORIGINAL_ENV = {
  AI_PROVIDER: process.env.AI_PROVIDER,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  ZAI_API_KEY: process.env.ZAI_API_KEY,
  ZAI_ANTHROPIC_BASE_URL: process.env.ZAI_ANTHROPIC_BASE_URL,
}

afterEach(() => {
  if (typeof ORIGINAL_ENV.AI_PROVIDER === 'undefined') {
    delete process.env.AI_PROVIDER
  } else {
    process.env.AI_PROVIDER = ORIGINAL_ENV.AI_PROVIDER
  }

  if (typeof ORIGINAL_ENV.ANTHROPIC_API_KEY === 'undefined') {
    delete process.env.ANTHROPIC_API_KEY
  } else {
    process.env.ANTHROPIC_API_KEY = ORIGINAL_ENV.ANTHROPIC_API_KEY
  }

  if (typeof ORIGINAL_ENV.ANTHROPIC_BASE_URL === 'undefined') {
    delete process.env.ANTHROPIC_BASE_URL
  } else {
    process.env.ANTHROPIC_BASE_URL = ORIGINAL_ENV.ANTHROPIC_BASE_URL
  }

  if (typeof ORIGINAL_ENV.ZAI_API_KEY === 'undefined') {
    delete process.env.ZAI_API_KEY
  } else {
    process.env.ZAI_API_KEY = ORIGINAL_ENV.ZAI_API_KEY
  }

  if (typeof ORIGINAL_ENV.ZAI_ANTHROPIC_BASE_URL === 'undefined') {
    delete process.env.ZAI_ANTHROPIC_BASE_URL
  } else {
    process.env.ZAI_ANTHROPIC_BASE_URL = ORIGINAL_ENV.ZAI_ANTHROPIC_BASE_URL
  }
})

describe('provider-config', () => {
  it('defaults to Anthropic when AI_PROVIDER is missing', () => {
    delete process.env.AI_PROVIDER
    process.env.ANTHROPIC_API_KEY = 'ant-key'
    delete process.env.ZAI_API_KEY

    expect(resolveAIProvider()).toBe('anthropic')

    const config = resolveAIProviderConfig('planning')
    expect(config.provider).toBe('anthropic')
    expect(config.model).toBe(MODEL_CONFIG.planning.model)
    expect(config.baseURL).toBeUndefined()
  })

  it('resolves Z.AI provider with default Anthropic-compatible base URL', () => {
    process.env.AI_PROVIDER = 'zai'
    process.env.ZAI_API_KEY = 'zai-key'
    delete process.env.ZAI_ANTHROPIC_BASE_URL

    const config = resolveAIProviderConfig('discovery')

    expect(config.provider).toBe('zai')
    expect(config.apiKey).toBe('zai-key')
    expect(config.baseURL).toBe('https://api.z.ai/api/anthropic')
    expect(config.model).toBe('glm-4.7')
  })

  it('throws explicit error for invalid provider value', () => {
    process.env.AI_PROVIDER = 'invalid-provider'

    expect(() => resolveAIProvider()).toThrow(
      'AI_PROVIDER_MISCONFIGURED:AI_PROVIDER_INVALID:invalid-provider'
    )
  })

  it('throws explicit error when Z.AI key is missing', () => {
    process.env.AI_PROVIDER = 'zai'
    delete process.env.ZAI_API_KEY

    expect(() => resolveAIProviderConfig('codegen')).toThrow(
      'AI_PROVIDER_MISCONFIGURED:ZAI_API_KEY_MISSING'
    )
  })

  it('returns configured status based on active provider requirements', () => {
    process.env.AI_PROVIDER = 'anthropic'
    delete process.env.ANTHROPIC_API_KEY
    expect(isAIProviderConfigured()).toBe(false)

    process.env.ANTHROPIC_API_KEY = 'ant-key'
    expect(isAIProviderConfigured()).toBe(true)

    process.env.AI_PROVIDER = 'zai'
    delete process.env.ZAI_API_KEY
    expect(isAIProviderConfigured()).toBe(false)

    process.env.ZAI_API_KEY = 'zai-key'
    expect(isAIProviderConfigured()).toBe(true)
  })
})
