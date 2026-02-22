import { describe, it, expect } from 'vitest'
import {
  extractExports,
  buildInterfaceMap,
  serializeInterfaceMap,
} from './interface-map'

describe('extractExports', () => {
  it('extracts exported interfaces', () => {
    const source = `
      export interface User {
        id: string
        name: string
      }
      export interface Role {
        name: string
      }
    `
    expect(extractExports(source)).toEqual(['interface User', 'interface Role'])
  })

  it('extracts exported types', () => {
    const source = `
      export type Status = 'active' | 'inactive'
      export type UserRole = 'admin' | 'user'
    `
    expect(extractExports(source)).toEqual(['type Status', 'type UserRole'])
  })

  it('extracts exported functions with params', () => {
    const source = `
      export function createUser(name: string, role: UserRole): User {
        return { id: '1', name }
      }
      export async function deleteUser(id: string): Promise<void> {}
    `
    const exports = extractExports(source)
    expect(exports).toContain('function createUser(name: string, role: UserRole)')
    expect(exports).toContain('function deleteUser(id: string)')
  })

  it('extracts exported consts', () => {
    const source = `
      export const MAX_RETRIES = 3
      export const DEFAULT_TIMEOUT = 5000
    `
    expect(extractExports(source)).toEqual(['const MAX_RETRIES', 'const DEFAULT_TIMEOUT'])
  })

  it('ignores non-exported symbols', () => {
    const source = `
      interface InternalThing { x: number }
      function helperFn() {}
      const secret = 42
      export interface PublicThing { y: string }
    `
    expect(extractExports(source)).toEqual(['interface PublicThing'])
  })

  it('deduplicates symbols', () => {
    const source = `
      export const foo = 1
      export const foo = 2
    `
    expect(extractExports(source)).toEqual(['const foo'])
  })

  it('returns empty array for source with no exports', () => {
    expect(extractExports('const x = 1')).toEqual([])
    expect(extractExports('')).toEqual([])
  })
})

describe('buildInterfaceMap', () => {
  it('builds map from list of files', () => {
    const files = [
      {
        path: 'src/types/user.ts',
        content: 'export interface User { id: string }\nexport type Role = "admin"',
      },
      {
        path: 'src/lib/api.ts',
        content: 'export function getUser(id: string): User {}',
      },
      {
        path: 'src/styles/main.css',
        content: '.container { display: flex; }',
      },
    ]

    const map = buildInterfaceMap(files)
    expect(map).toHaveLength(2)
    expect(map[0].path).toBe('src/types/user.ts')
    expect(map[0].exports).toContain('interface User')
    expect(map[0].exports).toContain('type Role')
    expect(map[1].path).toBe('src/lib/api.ts')
    expect(map[1].exports).toContain('function getUser(id: string)')
  })

  it('skips non-TS files', () => {
    const files = [
      { path: 'README.md', content: 'export interface Fake {}' },
      { path: 'data.json', content: '{}' },
    ]
    expect(buildInterfaceMap(files)).toEqual([])
  })

  it('skips TS files with no exports', () => {
    const files = [
      { path: 'src/internal.ts', content: 'const x = 1' },
    ]
    expect(buildInterfaceMap(files)).toEqual([])
  })

  it('handles .tsx files', () => {
    const files = [
      {
        path: 'src/components/Button.tsx',
        content: 'export interface ButtonProps { label: string }',
      },
    ]
    const map = buildInterfaceMap(files)
    expect(map).toHaveLength(1)
    expect(map[0].exports).toContain('interface ButtonProps')
  })
})

describe('serializeInterfaceMap', () => {
  it('serializes to compact format', () => {
    const map = [
      {
        path: 'src/types/user.ts',
        exports: ['interface User', 'type Role'],
      },
      {
        path: 'src/lib/api.ts',
        exports: ['function getUser(id: string)'],
      },
    ]

    const result = serializeInterfaceMap(map)
    expect(result).toContain('// src/types/user.ts')
    expect(result).toContain('interface User')
    expect(result).toContain('type Role')
    expect(result).toContain('// src/lib/api.ts')
    expect(result).toContain('function getUser(id: string)')
  })

  it('returns empty string for empty map', () => {
    expect(serializeInterfaceMap([])).toBe('')
  })
})
