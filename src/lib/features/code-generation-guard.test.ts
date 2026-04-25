import { afterEach, describe, expect, it, vi } from 'vitest'

describe('codegenFlagGuard', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unmock('@/config/features')
  })

  it('retorna null quando ENABLE_CODE_GENERATION está ligada', async () => {
    vi.doMock('@/config/features', () => ({
      ENABLE_CODE_GENERATION: true,
    }))

    const { codegenFlagGuard } = await import('./code-generation-guard')

    expect(codegenFlagGuard()).toBeNull()
  })

  it('retorna Response 404 vazio quando ENABLE_CODE_GENERATION está desligada', async () => {
    vi.doMock('@/config/features', () => ({
      ENABLE_CODE_GENERATION: false,
    }))

    const { codegenFlagGuard } = await import('./code-generation-guard')

    const response = codegenFlagGuard()

    expect(response).toBeInstanceOf(Response)
    expect(response?.status).toBe(404)
    expect(await response?.text()).toBe('')
  })
})
