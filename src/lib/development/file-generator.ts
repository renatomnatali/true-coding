/**
 * File-by-file generation loop.
 * Iterates a FileManifest in topological order, calls LLM per file
 * via runClaudeAgentWithCache, accumulates an interface map for
 * context coherence, and respects the rate limiter.
 */

import { z } from 'zod'
import type { IterationPlanItem } from '@/types/development'
import type { ContentBlock } from '@/lib/ai/claude'
import type { ModelPhase } from '@/lib/ai/config'
import type { FileManifest, FileManifestEntry, PlanSnapshot } from './types'
import { OutputTokenRateLimiter } from '@/lib/ai/rate-limiter'
import { runClaudeAgentWithCache } from './agent-runtime'
import {
  extractExports,
  serializeInterfaceMap,
  type InterfaceMap,
} from './interface-map'
import { appendRunEvent } from './events'

export interface FileGeneratorOptions {
  runId: string
  iterationId: string
  projectId: string
  snapshot: PlanSnapshot
  iteration: IterationPlanItem
  manifest: FileManifest
  rateLimiter?: OutputTokenRateLimiter
}

export interface GeneratedFile {
  path: string
  content: string
}

export interface FileGeneratorResult {
  files: GeneratedFile[]
  interfaceMap: InterfaceMap
  totalTokensUsed: number
}

const FILE_GEN_SYSTEM_PROMPT = [
  'Você é um agente especialista em desenvolvimento de software.',
  'Retorne SOMENTE JSON válido no formato {"content":"..."} sem markdown.',
  'O campo "content" deve conter o código-fonte completo pronto para salvar em disco.',
  'Todo conteúdo de interface deve estar em português brasileiro com acentuação correta.',
  'Use imports relativos e siga as convenções do Next.js 15 / React 19 / TypeScript.',
].join(' ')

const FILE_GEN_RESPONSE_SCHEMA = z.object({
  content: z.string().min(1),
})

function buildCachedContextBlocks(
  snapshot: PlanSnapshot,
  manifest: FileManifest
): ContentBlock[] {
  const snapshotSummary = JSON.stringify(
    {
      businessPlan: snapshot.businessPlan,
      technicalPlan: snapshot.technicalPlan,
      uxPlan: snapshot.uxPlan,
    },
    null,
    2
  )

  const manifestSummary = manifest.entries
    .map((e) => `${e.kind}: ${e.path}`)
    .join('\n')

  return [
    {
      type: 'text',
      text: `## Planos do Projeto\n${snapshotSummary}`,
      cache_control: { type: 'ephemeral' },
    },
    {
      type: 'text',
      text: `## Manifest de Ficheiros\n${manifestSummary}`,
      cache_control: { type: 'ephemeral' },
    },
  ]
}

function buildFilePrompt(
  entry: FileManifestEntry,
  iteration: IterationPlanItem,
  interfaceMapStr: string
): string {
  const parts = [
    `Gere o conteúdo completo do ficheiro: ${entry.path}`,
    `Tipo: ${entry.kind}`,
    `Iteração: ${iteration.index} — ${iteration.name}`,
    `Objetivos: ${iteration.scope.goals.join('; ')}`,
  ]

  if (entry.dependsOn.length > 0) {
    parts.push(`Depende de: ${entry.dependsOn.join(', ')}`)
  }

  if (interfaceMapStr) {
    parts.push(`\n## Exports dos ficheiros já gerados\n${interfaceMapStr}`)
  }

  if (entry.kind === 'test') {
    parts.push(
      'Priorize uma suíte enxuta: cubra cenários críticos do arquivo alvo e evite casos redundantes.'
    )
  }

  return parts.join('\n')
}

function resolvePrimaryPhase(entry: FileManifestEntry): ModelPhase {
  // Test files frequently exceed codegen output window; planning provides a safer cap.
  return entry.kind === 'test' ? 'planning' : 'codegen'
}

function isTruncationError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('AGENT_RESPONSE_TRUNCATED')
}

/**
 * Generates all files in the manifest one by one, in topological order.
 * Returns the generated files, the accumulated interface map, and total tokens used.
 */
export async function generateFilesFromManifest(
  options: FileGeneratorOptions
): Promise<FileGeneratorResult> {
  const {
    runId,
    iterationId,
    manifest,
    snapshot,
    iteration,
  } = options

  const rateLimiter = options.rateLimiter ?? new OutputTokenRateLimiter()
  const cachedContextBlocks = buildCachedContextBlocks(snapshot, manifest)
  const interfaceMap: InterfaceMap = []
  const files: GeneratedFile[] = []
  let totalTokensUsed = 0

  await appendRunEvent({
    runId,
    iterationId,
    eventType: 'INFO',
    message: `Geração incremental: ${manifest.entries.length} ficheiros no manifest`,
    payload: {
      totalFiles: manifest.entries.length,
      totalEstimatedTokens: manifest.totalEstimatedTokens,
    },
  })

  for (const entry of manifest.entries) {
    // Skip spec entries — SpecAgent handles Gherkin separately
    if (entry.kind === 'spec') {
      continue
    }

    await rateLimiter.waitForCapacity(entry.estimatedTokens)

    const interfaceMapStr = serializeInterfaceMap(interfaceMap)
    const filePrompt = buildFilePrompt(entry, iteration, interfaceMapStr)
    const contentBlocks: ContentBlock[] = [
      ...cachedContextBlocks,
      { type: 'text', text: filePrompt },
    ]

    const primaryPhase = resolvePrimaryPhase(entry)
    let result

    try {
      result = await runClaudeAgentWithCache({
        agentName: `FileGen:${entry.path}`,
        systemPrompt: FILE_GEN_SYSTEM_PROMPT,
        contentBlocks,
        schema: FILE_GEN_RESPONSE_SCHEMA,
        phase: primaryPhase,
      })
    } catch (error) {
      if (!isTruncationError(error) || primaryPhase === 'planning') {
        throw error
      }

      await appendRunEvent({
        runId,
        iterationId,
        eventType: 'INFO',
        message: `Retry FileGen por truncamento: ${entry.path}`,
        payload: {
          filePath: entry.path,
          fromPhase: primaryPhase,
          toPhase: 'planning',
        },
      })

      result = await runClaudeAgentWithCache({
        agentName: `FileGen:${entry.path}`,
        systemPrompt: FILE_GEN_SYSTEM_PROMPT,
        contentBlocks,
        schema: FILE_GEN_RESPONSE_SCHEMA,
        phase: 'planning',
      })
    }

    const content = result.output.content
    const outputTokens = result.tokenUsage ?? entry.estimatedTokens
    totalTokensUsed += outputTokens
    rateLimiter.recordUsage(outputTokens)

    files.push({ path: entry.path, content })

    // Accumulate interface map for subsequent files
    if (entry.path.endsWith('.ts') || entry.path.endsWith('.tsx')) {
      const exports = extractExports(content)
      if (exports.length > 0) {
        interfaceMap.push({ path: entry.path, exports })
      }
    }

    await appendRunEvent({
      runId,
      iterationId,
      eventType: 'AGENT_TASK',
      message: `FileGen: ${entry.path} gerado`,
      payload: {
        agentName: 'FileGen',
        status: 'SUCCEEDED',
        filePath: entry.path,
        fileKind: entry.kind,
        tokensUsed: outputTokens,
      },
    })
  }

  await appendRunEvent({
    runId,
    iterationId,
    eventType: 'INFO',
    message: `Geração incremental concluída: ${files.length} ficheiros`,
    payload: {
      filesGenerated: files.length,
      totalTokensUsed,
    },
  })

  return { files, interfaceMap, totalTokensUsed }
}
