import { describe, it, expect } from 'vitest'
import {
  buildManifestFromSnapshot,
  shouldUseSingleShot,
  SINGLE_SHOT_THRESHOLD,
} from './file-manifest'
import type { PlanSnapshot } from './types'

const makeSnapshot = (overrides: Partial<PlanSnapshot> = {}): PlanSnapshot => ({
  businessPlan: { name: 'Test App' },
  technicalPlan: {
    pages: [
      { name: 'Home', path: '/' },
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Settings', path: '/settings' },
    ],
    components: [
      { name: 'Header' },
      { name: 'Card' },
      { name: 'Form' },
      { name: 'Sidebar' },
    ],
    apiEndpoints: [
      {
        category: 'Core',
        endpoints: [
          { method: 'GET', path: '/api/users' },
          { method: 'POST', path: '/api/users' },
          { method: 'GET', path: '/api/orders' },
          { method: 'POST', path: '/api/orders' },
        ],
      },
    ],
    database: { prismaSchema: 'model User { id String @id }' },
  },
  uxPlan: {},
  ...overrides,
})

const makeIteration = (index = 1) => ({
  index,
  name: 'Core Features',
  slug: 'core-features',
  scope: {
    goals: ['Implementar fluxo principal'],
    featureTags: ['@core-features'],
    risks: ['Complexidade'],
  },
  gherkinPath: `docs/specifications/generated/iter-${index}-core-features.feature`,
})

describe('buildManifestFromSnapshot', () => {
  it('produces entries in topological order: types → schema → components → pages → api → tests → spec', () => {
    const snapshot = makeSnapshot()
    const manifest = buildManifestFromSnapshot(snapshot, makeIteration(1))

    const kinds = manifest.entries.map((e) => e.kind)

    // Types come first
    expect(kinds[0]).toBe('type')

    // Schema comes after types (if present)
    const schemaIdx = kinds.indexOf('schema')
    expect(schemaIdx).toBeGreaterThan(0)

    // Components come after schema
    const firstComponentIdx = kinds.indexOf('component')
    expect(firstComponentIdx).toBeGreaterThan(schemaIdx)

    // Pages after components
    const firstPageIdx = kinds.indexOf('page')
    if (firstPageIdx >= 0) {
      expect(firstPageIdx).toBeGreaterThan(firstComponentIdx)
    }

    // Spec is last
    expect(kinds[kinds.length - 1]).toBe('spec')
  })

  it('always includes a types file as the first entry', () => {
    const snapshot = makeSnapshot()
    const manifest = buildManifestFromSnapshot(snapshot, makeIteration(1))

    expect(manifest.entries[0].kind).toBe('type')
    expect(manifest.entries[0].path).toBe('src/types/iter-1.ts')
    expect(manifest.entries[0].dependsOn).toEqual([])
  })

  it('includes schema entry when database is present', () => {
    const snapshot = makeSnapshot()
    const manifest = buildManifestFromSnapshot(snapshot, makeIteration(1))

    const schema = manifest.entries.find((e) => e.kind === 'schema')
    expect(schema).toBeDefined()
    expect(schema!.dependsOn).toContain('src/types/iter-1.ts')
  })

  it('excludes schema entry when no database', () => {
    const snapshot = makeSnapshot({
      technicalPlan: {
        pages: [{ name: 'Home' }],
        components: [],
        apiEndpoints: [],
      },
    })
    const manifest = buildManifestFromSnapshot(snapshot, makeIteration(1))

    expect(manifest.entries.find((e) => e.kind === 'schema')).toBeUndefined()
  })

  it('scopes components to the iteration index', () => {
    const snapshot = makeSnapshot()

    // Iteration 1 gets components 0..2 (Header, Card, Form)
    const m1 = buildManifestFromSnapshot(snapshot, makeIteration(1))
    const c1 = m1.entries.filter((e) => e.kind === 'component')
    expect(c1).toHaveLength(3)
    expect(c1[0].path).toContain('header')

    // Iteration 2 gets components 3..5 (Sidebar only, since there are 4 total)
    const m2 = buildManifestFromSnapshot(snapshot, makeIteration(2))
    const c2 = m2.entries.filter((e) => e.kind === 'component')
    expect(c2).toHaveLength(1)
    expect(c2[0].path).toContain('sidebar')
  })

  it('scopes pages to the iteration index', () => {
    const snapshot = makeSnapshot()

    const m1 = buildManifestFromSnapshot(snapshot, makeIteration(1))
    const pages1 = m1.entries.filter((e) => e.kind === 'page')
    expect(pages1).toHaveLength(2)

    const m2 = buildManifestFromSnapshot(snapshot, makeIteration(2))
    const pages2 = m2.entries.filter((e) => e.kind === 'page')
    expect(pages2).toHaveLength(1)
  })

  it('scopes API endpoints to the iteration index', () => {
    const snapshot = makeSnapshot()

    const m1 = buildManifestFromSnapshot(snapshot, makeIteration(1))
    const apis1 = m1.entries.filter((e) => e.kind === 'api')
    expect(apis1).toHaveLength(3)

    const m2 = buildManifestFromSnapshot(snapshot, makeIteration(2))
    const apis2 = m2.entries.filter((e) => e.kind === 'api')
    expect(apis2).toHaveLength(1)
  })

  it('generates test entries for implementation files', () => {
    const snapshot = makeSnapshot()
    const manifest = buildManifestFromSnapshot(snapshot, makeIteration(1))

    const tests = manifest.entries.filter((e) => e.kind === 'test')
    const implementations = manifest.entries.filter(
      (e) => e.kind === 'component' || e.kind === 'page' || e.kind === 'api'
    )

    expect(tests).toHaveLength(implementations.length)

    // Each test depends on its implementation file
    for (const test of tests) {
      expect(test.dependsOn).toHaveLength(1)
      const implPath = test.dependsOn[0]
      expect(implementations.map((i) => i.path)).toContain(implPath)
    }
  })

  it('always includes spec entry (Gherkin) as last', () => {
    const snapshot = makeSnapshot()
    const manifest = buildManifestFromSnapshot(snapshot, makeIteration(1))

    const last = manifest.entries[manifest.entries.length - 1]
    expect(last.kind).toBe('spec')
    expect(last.path).toBe('docs/specifications/generated/iter-1-core-features.feature')
  })

  it('computes totalEstimatedTokens as sum of all entries', () => {
    const snapshot = makeSnapshot()
    const manifest = buildManifestFromSnapshot(snapshot, makeIteration(1))

    const sum = manifest.entries.reduce((acc, e) => acc + e.estimatedTokens, 0)
    expect(manifest.totalEstimatedTokens).toBe(sum)
    expect(manifest.totalEstimatedTokens).toBeGreaterThan(0)
  })

  it('pages depend on components of the same iteration', () => {
    const snapshot = makeSnapshot()
    const manifest = buildManifestFromSnapshot(snapshot, makeIteration(1))

    const pages = manifest.entries.filter((e) => e.kind === 'page')
    const componentPaths = manifest.entries
      .filter((e) => e.kind === 'component')
      .map((e) => e.path)

    for (const page of pages) {
      for (const compPath of componentPaths) {
        expect(page.dependsOn).toContain(compPath)
      }
    }
  })

  it('handles empty technical plan', () => {
    const snapshot = makeSnapshot({ technicalPlan: {} })
    const manifest = buildManifestFromSnapshot(snapshot, makeIteration(1))

    // Should still have types + spec
    expect(manifest.entries.length).toBeGreaterThanOrEqual(2)
    expect(manifest.entries[0].kind).toBe('type')
    expect(manifest.entries[manifest.entries.length - 1].kind).toBe('spec')
  })
})

describe('shouldUseSingleShot', () => {
  it('returns true when totalEstimatedTokens is below threshold', () => {
    expect(shouldUseSingleShot({ entries: [], totalEstimatedTokens: 2000 })).toBe(true)
    expect(shouldUseSingleShot({ entries: [], totalEstimatedTokens: SINGLE_SHOT_THRESHOLD - 1 })).toBe(true)
  })

  it('returns false when totalEstimatedTokens is at or above threshold', () => {
    expect(shouldUseSingleShot({ entries: [], totalEstimatedTokens: SINGLE_SHOT_THRESHOLD })).toBe(false)
    expect(shouldUseSingleShot({ entries: [], totalEstimatedTokens: 10_000 })).toBe(false)
  })
})
