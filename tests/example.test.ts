import { describe, it, expect } from 'vitest'

describe('Example', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should verify truthy values', () => {
    expect(true).toBeTruthy()
    expect('hello').toBeTruthy()
  })
})
