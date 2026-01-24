import { describe, it, expect } from 'vitest'
import { validateGeneratedFiles, validateJSON } from './validator'

describe('validateGeneratedFiles', () => {
  it('should pass for valid TypeScript code', async () => {
    const files = [
      {
        path: 'src/app/page.tsx',
        content: `
export default function Home() {
  return <div>Hello</div>
}
`,
      },
    ]

    const result = await validateGeneratedFiles(files)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should pass for non-TypeScript files', async () => {
    const files = [
      {
        path: 'package.json',
        content: '{"name": "test"}',
      },
      {
        path: 'README.md',
        content: '# Test',
      },
    ]

    const result = await validateGeneratedFiles(files)
    expect(result.valid).toBe(true)
  })

  it('should detect unbalanced braces', async () => {
    const files = [
      {
        path: 'src/bad.ts',
        content: `
function test() {
  if (true) {
    console.log('missing closing brace')

}
`,
      },
    ]

    const result = await validateGeneratedFiles(files)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should skip test files', async () => {
    const files = [
      {
        path: 'src/component.test.tsx',
        content: `
// This has unbalanced braces but should be skipped
function test() {
`,
      },
    ]

    const result = await validateGeneratedFiles(files)
    expect(result.valid).toBe(true)
  })

  it('should validate multiple files', async () => {
    const files = [
      {
        path: 'src/utils.ts',
        content: 'export const add = (a: number, b: number) => a + b',
      },
      {
        path: 'src/types.ts',
        content: 'export interface User { id: string; name: string }',
      },
    ]

    const result = await validateGeneratedFiles(files)
    expect(result.valid).toBe(true)
  })
})

describe('validateJSON', () => {
  it('should pass for valid JSON', () => {
    const result = validateJSON('{"key": "value"}')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail for invalid JSON', () => {
    const result = validateJSON('{key: "value"}')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should pass for arrays', () => {
    const result = validateJSON('[1, 2, 3]')
    expect(result.valid).toBe(true)
  })

  it('should pass for nested objects', () => {
    const result = validateJSON('{"nested": {"key": "value"}}')
    expect(result.valid).toBe(true)
  })
})
