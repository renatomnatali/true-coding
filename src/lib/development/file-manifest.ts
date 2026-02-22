/**
 * Deterministic file manifest builder.
 * Reads technicalPlan.pages/components/apiEndpoints and produces a
 * FileManifest listing every file to generate, in topological order,
 * with estimated output tokens per file.
 */

import type { IterationPlanItem } from '@/types/development'
import type { FileManifest, FileManifestEntry, PlanSnapshot } from './types'

interface TechnicalPlanLike {
  pages?: Array<{ name?: string; path?: string }>
  components?: Array<{ name?: string }>
  apiEndpoints?: Array<{
    category?: string
    endpoints?: Array<{ method?: string; path?: string }>
  }>
  database?: { prismaSchema?: string }
}

function normalizeTechnicalPlan(snapshot: PlanSnapshot): TechnicalPlanLike {
  return (snapshot.technicalPlan ?? {}) as TechnicalPlanLike
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Average output tokens per file kind (conservative estimates). */
const TOKEN_ESTIMATES: Record<FileManifestEntry['kind'], number> = {
  type: 800,
  schema: 1200,
  config: 600,
  component: 1500,
  page: 1800,
  api: 1200,
  test: 1000,
  spec: 800,
}

/**
 * Builds a deterministic FileManifest from the snapshot's technical plan,
 * scoped to the given iteration. No LLM call required.
 *
 * File order is topological: types → schema → config → components → pages → api → tests → spec
 */
export function buildManifestFromSnapshot(
  snapshot: PlanSnapshot,
  iteration: IterationPlanItem
): FileManifest {
  const technical = normalizeTechnicalPlan(snapshot)
  const entries: FileManifestEntry[] = []

  // 1. Shared types file (always first — everything depends on it)
  const typesPath = `src/types/iter-${iteration.index}.ts`
  entries.push({
    path: typesPath,
    kind: 'type',
    dependsOn: [],
    estimatedTokens: TOKEN_ESTIMATES.type,
  })

  // 2. Schema file (if database present)
  if (technical.database?.prismaSchema) {
    entries.push({
      path: `prisma/iter-${iteration.index}.prisma`,
      kind: 'schema',
      dependsOn: [typesPath],
      estimatedTokens: TOKEN_ESTIMATES.schema,
    })
  }

  // 3. Components scoped to this iteration
  const allComponents = technical.components ?? []
  const iterComponents = allComponents.slice(
    (iteration.index - 1) * 3,
    iteration.index * 3
  )
  const componentPaths: string[] = []

  for (const comp of iterComponents) {
    const name = comp.name || 'Component'
    const path = `src/components/${slugify(name)}.tsx`
    componentPaths.push(path)
    entries.push({
      path,
      kind: 'component',
      dependsOn: [typesPath],
      estimatedTokens: TOKEN_ESTIMATES.component,
    })
  }

  // 4. Pages scoped to this iteration
  const allPages = technical.pages ?? []
  const iterPages = allPages.slice(
    (iteration.index - 1) * 2,
    iteration.index * 2
  )

  for (const page of iterPages) {
    const name = page.name || 'Page'
    const path = `src/app/${slugify(name)}/page.tsx`
    entries.push({
      path,
      kind: 'page',
      dependsOn: [typesPath, ...componentPaths],
      estimatedTokens: TOKEN_ESTIMATES.page,
    })
  }

  // 5. API endpoints scoped to this iteration
  const allEndpoints = (technical.apiEndpoints ?? []).flatMap(
    (group) =>
      (group.endpoints ?? []).map((ep) => ({
        method: ep.method || 'GET',
        routePath: ep.path || '/api/resource',
      }))
  )
  const iterEndpoints = allEndpoints.slice(
    (iteration.index - 1) * 3,
    iteration.index * 3
  )

  for (const ep of iterEndpoints) {
    const routeSlug = ep.routePath
      .replace(/^\/api\//, '')
      .replace(/\//g, '-')
      .replace(/[^a-z0-9-]/g, '')
    const path = `src/app/api/${routeSlug || 'resource'}/route.ts`
    entries.push({
      path,
      kind: 'api',
      dependsOn: [typesPath],
      estimatedTokens: TOKEN_ESTIMATES.api,
    })
  }

  // 6. Test files (one per component/page/api)
  const implementationEntries = entries.filter(
    (e) => e.kind === 'component' || e.kind === 'page' || e.kind === 'api'
  )
  for (const impl of implementationEntries) {
    const testPath = impl.path.replace(/\.(ts|tsx)$/, '.test.$1')
    entries.push({
      path: testPath,
      kind: 'test',
      dependsOn: [impl.path],
      estimatedTokens: TOKEN_ESTIMATES.test,
    })
  }

  // 7. Spec file (Gherkin)
  entries.push({
    path: iteration.gherkinPath,
    kind: 'spec',
    dependsOn: [],
    estimatedTokens: TOKEN_ESTIMATES.spec,
  })

  const totalEstimatedTokens = entries.reduce(
    (sum, e) => sum + e.estimatedTokens,
    0
  )

  return { entries, totalEstimatedTokens }
}

/**
 * Threshold below which the single-shot path (existing) is preferred
 * over incremental file-by-file generation.
 */
export const SINGLE_SHOT_THRESHOLD = 4_000

/**
 * Returns true if the manifest is small enough to use the single-shot
 * path instead of file-by-file generation.
 */
export function shouldUseSingleShot(manifest: FileManifest): boolean {
  return manifest.totalEstimatedTokens < SINGLE_SHOT_THRESHOLD
}
