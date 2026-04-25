import { describe, it, expect, vi, beforeEach } from 'vitest'

const { runClaudeAgentWithCacheMock, appendRunEventMock } = vi.hoisted(() => ({
  runClaudeAgentWithCacheMock: vi.fn(),
  appendRunEventMock: vi.fn(),
}))

vi.mock('./agent-runtime', () => ({
  runClaudeAgentWithCache: runClaudeAgentWithCacheMock,
}))

vi.mock('./events', () => ({
  appendRunEvent: appendRunEventMock,
}))

import { generateFilesFromManifest, type FileGeneratorOptions } from './file-generator'
import { OutputTokenRateLimiter } from '@/lib/ai/rate-limiter'
import type { FileManifest, PlanSnapshot } from './types'

const makeSnapshot = (): PlanSnapshot => ({
  businessPlan: { name: 'Test' },
  technicalPlan: { pages: [{ name: 'Home' }] },
  uxPlan: {},
})

const makeIteration = () => ({
  index: 1,
  name: 'Core',
  slug: 'core',
  scope: {
    goals: ['Implementar fluxo principal'],
    featureTags: ['@core'],
    risks: [],
  },
  gherkinPath: 'docs/specifications/generated/iter-1-core.feature',
})

const makeManifest = (entries: FileManifest['entries'] = []): FileManifest => ({
  entries,
  totalEstimatedTokens: entries.reduce((s, e) => s + e.estimatedTokens, 0),
})

const makeOptions = (manifest: FileManifest): FileGeneratorOptions => ({
  runId: 'run_1',
  iterationId: 'iter_1',
  projectId: 'proj_1',
  snapshot: makeSnapshot(),
  iteration: makeIteration(),
  manifest,
  rateLimiter: new OutputTokenRateLimiter({ maxOutputTokensPerMinute: 100_000 }),
})

describe('generateFilesFromManifest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    appendRunEventMock.mockResolvedValue(undefined)
  })

  it('generates files in manifest order and returns content', async () => {
    const manifest = makeManifest([
      { path: 'src/types/iter-1.ts', kind: 'type', dependsOn: [], estimatedTokens: 800 },
      { path: 'src/components/header.tsx', kind: 'component', dependsOn: ['src/types/iter-1.ts'], estimatedTokens: 1500 },
    ])

    runClaudeAgentWithCacheMock
      .mockResolvedValueOnce({
        output: { content: 'export interface User { id: string }' },
        tokenUsage: 100,
        cost: 0.001,
      })
      .mockResolvedValueOnce({
        output: { content: 'export function Header() { return <div>Header</div> }' },
        tokenUsage: 150,
        cost: 0.002,
      })

    const result = await generateFilesFromManifest(makeOptions(manifest))

    expect(result.files).toHaveLength(2)
    expect(result.files[0].path).toBe('src/types/iter-1.ts')
    expect(result.files[0].content).toContain('interface User')
    expect(result.files[1].path).toBe('src/components/header.tsx')
    expect(result.files[1].content).toContain('Header')
    expect(result.totalTokensUsed).toBe(250)
  })

  it('accumulates interface map across generated files', async () => {
    const manifest = makeManifest([
      { path: 'src/types/iter-1.ts', kind: 'type', dependsOn: [], estimatedTokens: 800 },
      { path: 'src/components/card.tsx', kind: 'component', dependsOn: ['src/types/iter-1.ts'], estimatedTokens: 1500 },
    ])

    runClaudeAgentWithCacheMock
      .mockResolvedValueOnce({
        output: { content: 'export interface CardProps { title: string }' },
        tokenUsage: 80,
      })
      .mockResolvedValueOnce({
        output: { content: 'export function Card(props: CardProps) { return <div>{props.title}</div> }' },
        tokenUsage: 120,
      })

    const result = await generateFilesFromManifest(makeOptions(manifest))

    expect(result.interfaceMap).toHaveLength(2)
    expect(result.interfaceMap[0].path).toBe('src/types/iter-1.ts')
    expect(result.interfaceMap[0].exports).toContain('interface CardProps')
    expect(result.interfaceMap[1].path).toBe('src/components/card.tsx')
    expect(result.interfaceMap[1].exports).toContain('function Card(props: CardProps)')

    // Second call should receive interface map in content blocks
    const secondCallArgs = runClaudeAgentWithCacheMock.mock.calls[1][0]
    expect(secondCallArgs.contentBlocks[2].text).toContain('interface CardProps')
  })

  it('skips spec entries (Gherkin handled separately)', async () => {
    const manifest = makeManifest([
      { path: 'src/types/iter-1.ts', kind: 'type', dependsOn: [], estimatedTokens: 800 },
      { path: 'docs/specs/iter-1.feature', kind: 'spec', dependsOn: [], estimatedTokens: 800 },
    ])

    runClaudeAgentWithCacheMock.mockResolvedValue({
      output: { content: 'export type Status = "active"' },
      tokenUsage: 50,
    })

    const result = await generateFilesFromManifest(makeOptions(manifest))

    expect(result.files).toHaveLength(1)
    expect(result.files[0].path).toBe('src/types/iter-1.ts')
    expect(runClaudeAgentWithCacheMock).toHaveBeenCalledTimes(1)
  })

  it('emits events for each file generated', async () => {
    const manifest = makeManifest([
      { path: 'src/types/iter-1.ts', kind: 'type', dependsOn: [], estimatedTokens: 800 },
    ])

    runClaudeAgentWithCacheMock.mockResolvedValue({
      output: { content: 'export type X = string' },
      tokenUsage: 40,
    })

    await generateFilesFromManifest(makeOptions(manifest))

    // Should emit: start info + per-file agent_task + completion info
    const agentTaskCalls = appendRunEventMock.mock.calls.filter(
      ([arg]: [{ eventType: string }]) => arg.eventType === 'AGENT_TASK'
    )
    expect(agentTaskCalls).toHaveLength(2)
    expect(agentTaskCalls[0][0].payload.filePath).toBe('src/types/iter-1.ts')
    expect(agentTaskCalls[0][0].payload.status).toBe('RUNNING')
    expect(agentTaskCalls[1][0].payload.filePath).toBe('src/types/iter-1.ts')
    expect(agentTaskCalls[1][0].payload.status).toBe('SUCCEEDED')

    const infoCalls = appendRunEventMock.mock.calls.filter(
      ([arg]: [{ eventType: string }]) => arg.eventType === 'INFO'
    )
    expect(infoCalls.length).toBeGreaterThanOrEqual(2) // start + completion
  })

  it('records usage in the rate limiter', async () => {
    const limiter = new OutputTokenRateLimiter({ maxOutputTokensPerMinute: 100_000 })
    const waitSpy = vi.spyOn(limiter, 'waitForCapacity')
    const recordSpy = vi.spyOn(limiter, 'recordUsage')

    const manifest = makeManifest([
      { path: 'src/types/iter-1.ts', kind: 'type', dependsOn: [], estimatedTokens: 800 },
      { path: 'src/lib/api.ts', kind: 'api', dependsOn: [], estimatedTokens: 1200 },
    ])

    runClaudeAgentWithCacheMock
      .mockResolvedValueOnce({ output: { content: 'export type A = 1' }, tokenUsage: 80 })
      .mockResolvedValueOnce({ output: { content: 'export function api() {}' }, tokenUsage: 120 })

    const opts = makeOptions(manifest)
    opts.rateLimiter = limiter

    await generateFilesFromManifest(opts)

    expect(waitSpy).toHaveBeenCalledTimes(2)
    expect(waitSpy).toHaveBeenCalledWith(800)
    expect(waitSpy).toHaveBeenCalledWith(1200)
    expect(recordSpy).toHaveBeenCalledTimes(2)
    expect(recordSpy).toHaveBeenCalledWith(80)
    expect(recordSpy).toHaveBeenCalledWith(120)
  })

  it('uses planning phase for test files', async () => {
    const manifest = makeManifest([
      { path: 'src/app/api/auth-register/route.test.ts', kind: 'test', dependsOn: ['src/app/api/auth-register/route.ts'], estimatedTokens: 1000 },
    ])

    runClaudeAgentWithCacheMock.mockResolvedValue({
      output: { content: 'import { describe, it, expect } from \"vitest\"' },
      tokenUsage: 300,
    })

    await generateFilesFromManifest(makeOptions(manifest))

    const callArgs = runClaudeAgentWithCacheMock.mock.calls[0][0]
    expect(callArgs.phase).toBe('planning')
  })

  it('retries in planning when codegen is truncated', async () => {
    const manifest = makeManifest([
      { path: 'src/app/api/orders/route.ts', kind: 'api', dependsOn: [], estimatedTokens: 1200 },
    ])

    runClaudeAgentWithCacheMock
      .mockRejectedValueOnce(
        new Error('AGENT_RESPONSE_TRUNCATED:FileGen:src/app/api/orders/route.ts:phase=codegen')
      )
      .mockResolvedValueOnce({
        output: { content: 'export async function GET() { return Response.json({ ok: true }) }' },
        tokenUsage: 500,
      })

    const result = await generateFilesFromManifest(makeOptions(manifest))

    expect(runClaudeAgentWithCacheMock).toHaveBeenCalledTimes(2)
    expect(runClaudeAgentWithCacheMock.mock.calls[0][0].phase).toBe('codegen')
    expect(runClaudeAgentWithCacheMock.mock.calls[1][0].phase).toBe('planning')
    expect(result.files).toHaveLength(1)

    const infoCalls = appendRunEventMock.mock.calls.filter(
      ([arg]: [{ eventType: string }]) => arg.eventType === 'INFO'
    )
    expect(infoCalls.some(([arg]: [{ message: string }]) => arg.message.includes('Retry FileGen por truncamento'))).toBe(true)
  })

  it('propagates truncation errors from agent runtime', async () => {
    const manifest = makeManifest([
      { path: 'src/types/iter-1.ts', kind: 'type', dependsOn: [], estimatedTokens: 800 },
    ])

    runClaudeAgentWithCacheMock
      .mockRejectedValueOnce(new Error('AGENT_RESPONSE_TRUNCATED:FileGen:src/types/iter-1.ts:phase=codegen'))
      .mockRejectedValueOnce(new Error('AGENT_RESPONSE_TRUNCATED:FileGen:src/types/iter-1.ts:phase=planning'))

    await expect(
      generateFilesFromManifest(makeOptions(manifest))
    ).rejects.toThrow('AGENT_RESPONSE_TRUNCATED')
  })

  it('handles empty manifest (no files to generate)', async () => {
    const manifest = makeManifest([])

    const result = await generateFilesFromManifest(makeOptions(manifest))

    expect(result.files).toEqual([])
    expect(result.interfaceMap).toEqual([])
    expect(result.totalTokensUsed).toBe(0)
    expect(runClaudeAgentWithCacheMock).not.toHaveBeenCalled()
  })

  it('passes system blocks with cache_control to agent runtime', async () => {
    const manifest = makeManifest([
      { path: 'src/types/iter-1.ts', kind: 'type', dependsOn: [], estimatedTokens: 800 },
    ])

    runClaudeAgentWithCacheMock.mockResolvedValue({
      output: { content: 'export type T = 1' },
      tokenUsage: 30,
    })

    await generateFilesFromManifest(makeOptions(manifest))

    const callArgs = runClaudeAgentWithCacheMock.mock.calls[0][0]
    expect(callArgs.contentBlocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ cache_control: { type: 'ephemeral' } }),
      ])
    )
    expect(callArgs.systemPrompt).toBeTruthy()
    expect(typeof callArgs.schema.safeParse).toBe('function')
  })

  it('does not add non-TS files to the interface map', async () => {
    const manifest = makeManifest([
      { path: 'prisma/iter-1.prisma', kind: 'schema', dependsOn: [], estimatedTokens: 1200 },
    ])

    runClaudeAgentWithCacheMock.mockResolvedValue({
      output: { content: 'model User { id String @id }' },
      tokenUsage: 50,
    })

    const result = await generateFilesFromManifest(makeOptions(manifest))

    expect(result.files).toHaveLength(1)
    expect(result.interfaceMap).toEqual([])
  })

  it('retries api file when contract validation fails against generated types', async () => {
    const manifest = makeManifest([
      { path: 'src/types/iter-1.ts', kind: 'type', dependsOn: [], estimatedTokens: 800 },
      { path: 'src/app/api/auth-me/route.ts', kind: 'api', dependsOn: ['src/types/iter-1.ts'], estimatedTokens: 1200 },
    ])

    runClaudeAgentWithCacheMock
      .mockResolvedValueOnce({
        output: {
          content: `
            export interface ApiError {
              code: string
              message: string
            }
          `,
        },
        tokenUsage: 120,
      })
      .mockResolvedValueOnce({
        output: {
          content: `
            import { NextResponse } from 'next/server'
            import type { ApiError } from '@/types/iter-1'

            export async function GET() {
              return NextResponse.json<ApiError>(
                { error: 'Não autorizado', message: 'Token inválido' },
                { status: 401 }
              )
            }
          `,
        },
        tokenUsage: 150,
      })
      .mockResolvedValueOnce({
        output: {
          content: `
            import { NextResponse } from 'next/server'
            import type { ApiError } from '@/types/iter-1'

            export async function GET() {
              return NextResponse.json<ApiError>(
                { code: 'UNAUTHORIZED', message: 'Token inválido' },
                { status: 401 }
              )
            }
          `,
        },
        tokenUsage: 170,
      })

    const result = await generateFilesFromManifest(makeOptions(manifest))

    expect(runClaudeAgentWithCacheMock).toHaveBeenCalledTimes(3)
    expect(result.files).toHaveLength(2)
    expect(result.files[1].content).toContain('code: \'UNAUTHORIZED\'')

    const infoCalls = appendRunEventMock.mock.calls.filter(
      ([arg]: [{ eventType: string }]) => arg.eventType === 'INFO'
    )

    expect(
      infoCalls.some(
        ([arg]: [{ message: string }]) =>
          arg.message.includes('Retry FileGen por inconsistência de contrato')
      )
    ).toBe(true)

    const apiRetryCall = runClaudeAgentWithCacheMock.mock.calls[2][0]
    expect(apiRetryCall.phase).toBe('planning')
    expect(apiRetryCall.contentBlocks[3].text).toContain('Violações de contrato')
  })

  it('fails with explicit FILE_CONTRACT_VIOLATION when api retry keeps invalid contract', async () => {
    const manifest = makeManifest([
      { path: 'src/types/iter-1.ts', kind: 'type', dependsOn: [], estimatedTokens: 800 },
      { path: 'src/app/api/auth-me/route.ts', kind: 'api', dependsOn: ['src/types/iter-1.ts'], estimatedTokens: 1200 },
    ])

    runClaudeAgentWithCacheMock
      .mockResolvedValueOnce({
        output: {
          content: `
            export interface ApiError {
              code: string
              message: string
            }
          `,
        },
        tokenUsage: 120,
      })
      .mockResolvedValueOnce({
        output: {
          content: `
            import { NextResponse } from 'next/server'
            import type { ApiError } from '@/types/iter-1'

            export async function GET() {
              return NextResponse.json<ApiError>(
                { error: 'Não autorizado', message: 'Token inválido' },
                { status: 401 }
              )
            }
          `,
        },
        tokenUsage: 150,
      })
      .mockResolvedValueOnce({
        output: {
          content: `
            import { NextResponse } from 'next/server'
            import type { ApiError } from '@/types/iter-1'

            export async function GET() {
              return NextResponse.json<ApiError>(
                { error: 'Ainda inválido', message: 'continua errado' },
                { status: 401 }
              )
            }
          `,
        },
        tokenUsage: 170,
      })

    await expect(
      generateFilesFromManifest(makeOptions(manifest))
    ).rejects.toThrow('FILE_CONTRACT_VIOLATION:src/app/api/auth-me/route.ts')
  })
})
