/**
 * TRC-14.6 — Migração de dados: JSON blobs de planos → PlanBlock granular.
 *
 * Converte os campos legados `Project.businessPlan`, `Project.technicalPlan` e
 * `Project.uxPlan` (JSON monolíticos) em blocos canônicos na tabela `PlanBlock`.
 *
 * Características:
 * - Idempotente: projetos com `legacyPlans` já preenchido são pulados.
 * - Preserva o JSON original em `Project.legacyPlans` (janela de 30 dias).
 * - Assume planos antigos já aprovados → `status = APPROVED`, `approvedAt =
 *   Project.updatedAt` como fallback.
 * - Fallback seguro: se um bloco específico não for parseável, grava o JSON
 *   cru em `body` e loga warning; nenhum dado é perdido.
 *
 * Uso:
 *   npm run db:migrate:plans-to-blocks -- --dry-run
 *   npm run db:migrate:plans-to-blocks -- --project-id=<id>
 *   npm run db:migrate:plans-to-blocks
 */

import { PrismaClient, Prisma, PlanType, BlockStatus } from '@prisma/client'

// ----------------------------------------------------------------------------
// Mapa canônico de blocos (dos dados do mockup Spec/.../data.jsx)
// ----------------------------------------------------------------------------

interface BlockDef {
  blockId: string
  title: string
  order: number
}

const BLOCK_DEFS: Record<PlanType, BlockDef[]> = {
  NEGOCIO: [
    { blockId: 'visao', title: 'Visão geral', order: 1 },
    { blockId: 'problema', title: 'Problema', order: 2 },
    { blockId: 'publico', title: 'Público-alvo', order: 3 },
    { blockId: 'features', title: 'Features core', order: 4 },
    { blockId: 'diferenciais', title: 'Diferenciais', order: 5 },
    { blockId: 'monetizacao', title: 'Monetização', order: 6 },
  ],
  UX: [
    { blockId: 'personas', title: 'Personas', order: 1 },
    { blockId: 'jornadas', title: 'Jornadas', order: 2 },
    { blockId: 'telas', title: 'Telas principais', order: 3 },
    { blockId: 'tokens', title: 'Design tokens', order: 4 },
  ],
  TECNICO: [
    { blockId: 'stack', title: 'Stack', order: 1 },
    { blockId: 'arquitetura', title: 'Arquitetura', order: 2 },
    { blockId: 'dados', title: 'Modelo de dados', order: 3 },
    { blockId: 'integracoes', title: 'Integrações', order: 4 },
  ],
}

// ----------------------------------------------------------------------------
// Parser legacy — converte JSON blob em mapa { blockId -> body markdown }
// ----------------------------------------------------------------------------

type RawPlan = Record<string, unknown>

/**
 * Detecta se o valor é um objeto JSON indexável (não array, não null).
 */
function isRecord(value: unknown): value is RawPlan {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

/**
 * Converte um valor arbitrário numa string legível.
 * - string: retorna direto (trim).
 * - objeto/array: JSON.stringify formatado.
 * - null/undefined: string vazia.
 */
function asBody(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return stringifyJson(value)
}

/**
 * Tenta fazer parse do plano legado para o shape canônico.
 * Retorna um Map de blockId → body.
 *
 * Se a entrada for string (markdown monolítico), grava tudo no primeiro bloco.
 * Se for objeto JSON mas não for parseável por chave, grava dump cru no
 * primeiro bloco e loga warning.
 */
function parseLegacyPlan(
  raw: unknown,
  planType: PlanType,
  logger: Logger,
): Map<string, string> {
  const bodies = new Map<string, string>()

  if (raw === null || raw === undefined) {
    return bodies
  }

  // Se veio string monolítica, grava no primeiro bloco como fallback.
  if (typeof raw === 'string') {
    const firstBlock = BLOCK_DEFS[planType][0]
    logger.warn(
      `Plano ${planType} veio como string — gravando conteúdo inteiro em "${firstBlock.blockId}".`,
    )
    bodies.set(firstBlock.blockId, raw.trim())
    return bodies
  }

  if (!isRecord(raw)) {
    const firstBlock = BLOCK_DEFS[planType][0]
    logger.warn(
      `Plano ${planType} em formato inesperado (${typeof raw}) — gravando dump em "${firstBlock.blockId}".`,
    )
    bodies.set(firstBlock.blockId, stringifyJson(raw))
    return bodies
  }

  switch (planType) {
    case 'NEGOCIO':
      return parseBusinessPlan(raw, logger)
    case 'UX':
      return parseUxPlan(raw, logger)
    case 'TECNICO':
      return parseTechnicalPlan(raw, logger)
  }
}

function parseBusinessPlan(raw: RawPlan, logger: Logger): Map<string, string> {
  const bodies = new Map<string, string>()

  // visao: name + tagline + description
  const visaoParts: string[] = []
  if (typeof raw.name === 'string' && raw.name.trim()) {
    visaoParts.push(`# ${raw.name.trim()}`)
  }
  if (typeof raw.tagline === 'string' && raw.tagline.trim()) {
    visaoParts.push(`_${raw.tagline.trim()}_`)
  }
  if (typeof raw.description === 'string' && raw.description.trim()) {
    visaoParts.push(raw.description.trim())
  }
  if (visaoParts.length) bodies.set('visao', visaoParts.join('\n\n'))

  // problema: problemStatement
  if (typeof raw.problemStatement === 'string' && raw.problemStatement.trim()) {
    bodies.set('problema', raw.problemStatement.trim())
  }

  // publico: targetAudience { primary, secondary?, painPoints }
  if (isRecord(raw.targetAudience)) {
    bodies.set('publico', asBody(raw.targetAudience))
  }

  // features: coreFeatures (+ niceToHaveFeatures anexadas como apêndice)
  const featureParts: string[] = []
  if (Array.isArray(raw.coreFeatures) && raw.coreFeatures.length) {
    featureParts.push('## Must-have')
    featureParts.push(stringifyJson(raw.coreFeatures))
  }
  if (Array.isArray(raw.niceToHaveFeatures) && raw.niceToHaveFeatures.length) {
    featureParts.push('## Nice-to-have')
    featureParts.push(stringifyJson(raw.niceToHaveFeatures))
  }
  if (featureParts.length) bodies.set('features', featureParts.join('\n\n'))

  // diferenciais: competitors + successMetrics (agregação do que indica posicionamento)
  const difParts: string[] = []
  if (Array.isArray(raw.competitors) && raw.competitors.length) {
    difParts.push('## Concorrentes e diferenciais')
    difParts.push(stringifyJson(raw.competitors))
  }
  if (Array.isArray(raw.successMetrics) && raw.successMetrics.length) {
    difParts.push('## Métricas de sucesso')
    difParts.push(stringifyJson(raw.successMetrics))
  }
  if (difParts.length) bodies.set('diferenciais', difParts.join('\n\n'))

  // monetizacao: monetization
  if (isRecord(raw.monetization)) {
    bodies.set('monetizacao', asBody(raw.monetization))
  }

  // Garante que pelo menos um bloco será criado; caso contrário, dump cru em visao.
  if (bodies.size === 0) {
    logger.warn(
      'Plano NEGOCIO sem campos reconhecíveis — gravando dump cru em "visao".',
    )
    bodies.set('visao', stringifyJson(raw))
  }

  return bodies
}

function parseUxPlan(raw: RawPlan, logger: Logger): Map<string, string> {
  const bodies = new Map<string, string>()

  // personas: personas
  if (Array.isArray(raw.personas) && raw.personas.length) {
    bodies.set('personas', stringifyJson(raw.personas))
  }

  // jornadas: journeys
  if (Array.isArray(raw.journeys) && raw.journeys.length) {
    bodies.set('jornadas', stringifyJson(raw.journeys))
  }

  // telas: wireframes + informationArchitecture
  const telasParts: string[] = []
  if (isRecord(raw.informationArchitecture)) {
    telasParts.push('## Arquitetura de informação')
    telasParts.push(stringifyJson(raw.informationArchitecture))
  }
  if (Array.isArray(raw.wireframes) && raw.wireframes.length) {
    telasParts.push('## Wireframes')
    telasParts.push(stringifyJson(raw.wireframes))
  }
  if (telasParts.length) bodies.set('telas', telasParts.join('\n\n'))

  // tokens: designTokens
  if (isRecord(raw.designTokens)) {
    bodies.set('tokens', asBody(raw.designTokens))
  }

  if (bodies.size === 0) {
    logger.warn('Plano UX sem campos reconhecíveis — gravando dump cru em "personas".')
    bodies.set('personas', stringifyJson(raw))
  }

  return bodies
}

function parseTechnicalPlan(raw: RawPlan, logger: Logger): Map<string, string> {
  const bodies = new Map<string, string>()

  // stack: stack
  if (isRecord(raw.stack) || Array.isArray(raw.stack)) {
    bodies.set('stack', asBody(raw.stack))
  }

  // arquitetura: architecture
  if (isRecord(raw.architecture)) {
    bodies.set('arquitetura', asBody(raw.architecture))
  }

  // dados: database + dataModel
  const dadosParts: string[] = []
  if (isRecord(raw.database)) {
    dadosParts.push('## Database')
    dadosParts.push(stringifyJson(raw.database))
  }
  if (isRecord(raw.dataModel)) {
    dadosParts.push('## Modelo de dados')
    dadosParts.push(stringifyJson(raw.dataModel))
  }
  if (dadosParts.length) bodies.set('dados', dadosParts.join('\n\n'))

  // integracoes: integrations + apiEndpoints + realtime
  const intParts: string[] = []
  if (Array.isArray(raw.integrations) && raw.integrations.length) {
    intParts.push('## Integrações externas')
    intParts.push(stringifyJson(raw.integrations))
  }
  if (Array.isArray(raw.apiEndpoints) && raw.apiEndpoints.length) {
    intParts.push('## API endpoints')
    intParts.push(stringifyJson(raw.apiEndpoints))
  }
  if (isRecord(raw.realtime)) {
    intParts.push('## Real-time')
    intParts.push(stringifyJson(raw.realtime))
  }
  if (intParts.length) bodies.set('integracoes', intParts.join('\n\n'))

  if (bodies.size === 0) {
    logger.warn(
      'Plano TECNICO sem campos reconhecíveis — gravando dump cru em "stack".',
    )
    bodies.set('stack', stringifyJson(raw))
  }

  return bodies
}

// ----------------------------------------------------------------------------
// Logger (injetável para testes)
// ----------------------------------------------------------------------------

export interface Logger {
  info: (msg: string) => void
  warn: (msg: string) => void
  error: (msg: string) => void
}

const consoleLogger: Logger = {
  info: (msg) => console.log(msg),
  warn: (msg) => console.warn(`[warn] ${msg}`),
  error: (msg) => console.error(`[error] ${msg}`),
}

// ----------------------------------------------------------------------------
// Orquestrador principal
// ----------------------------------------------------------------------------

export interface MigrateOptions {
  dryRun?: boolean
  projectId?: string
  prisma?: PrismaClient
  logger?: Logger
}

export interface MigrateResult {
  totalProjects: number
  migrated: number
  skipped: number
  blocksCreated: number
  dryRun: boolean
}

export async function migrate(options: MigrateOptions = {}): Promise<MigrateResult> {
  const logger = options.logger ?? consoleLogger
  const prisma = options.prisma ?? new PrismaClient()
  const ownsPrisma = !options.prisma
  const dryRun = options.dryRun ?? false

  const result: MigrateResult = {
    totalProjects: 0,
    migrated: 0,
    skipped: 0,
    blocksCreated: 0,
    dryRun,
  }

  try {
    const where: Prisma.ProjectWhereInput = options.projectId
      ? { id: options.projectId }
      : {
          OR: [
            { businessPlan: { not: Prisma.DbNull } },
            { technicalPlan: { not: Prisma.DbNull } },
            { uxPlan: { not: Prisma.DbNull } },
          ],
          legacyPlans: { equals: Prisma.DbNull },
        }

    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        businessPlan: true,
        technicalPlan: true,
        uxPlan: true,
        legacyPlans: true,
        updatedAt: true,
      },
    })

    result.totalProjects = projects.length
    logger.info(
      `Projetos candidatos à migração: ${projects.length}${dryRun ? ' (dry-run)' : ''}.`,
    )

    for (const project of projects) {
      // Idempotência: se já existe snapshot legado, pula.
      if (project.legacyPlans !== null && project.legacyPlans !== undefined) {
        logger.info(
          `Projeto ${project.id} (${project.name}): já migrado (legacyPlans preenchido), pulando.`,
        )
        result.skipped++
        continue
      }

      const approvedAt = project.updatedAt

      const blocksToCreate: Array<{
        planType: PlanType
        blockId: string
        title: string
        order: number
        body: string
      }> = []

      const planSources: Array<{ planType: PlanType; raw: unknown }> = [
        { planType: PlanType.NEGOCIO, raw: project.businessPlan },
        { planType: PlanType.UX, raw: project.uxPlan },
        { planType: PlanType.TECNICO, raw: project.technicalPlan },
      ]

      for (const { planType, raw } of planSources) {
        if (raw === null || raw === undefined) continue

        const bodyMap = parseLegacyPlan(raw, planType, logger)
        if (bodyMap.size === 0) continue

        for (const def of BLOCK_DEFS[planType]) {
          const body = bodyMap.get(def.blockId)
          if (!body) continue
          blocksToCreate.push({
            planType,
            blockId: def.blockId,
            title: def.title,
            order: def.order,
            body,
          })
        }
      }

      if (blocksToCreate.length === 0) {
        logger.info(
          `Projeto ${project.id} (${project.name}): nenhum bloco derivado dos planos existentes, pulando.`,
        )
        result.skipped++
        continue
      }

      if (dryRun) {
        logger.info(
          `Projeto ${project.id} (${project.name}): [dry-run] ${blocksToCreate.length} blocos seriam criados.`,
        )
        result.migrated++
        result.blocksCreated += blocksToCreate.length
        continue
      }

      // Snapshot legado — preserva o JSON original para rollback.
      const legacySnapshot: Prisma.InputJsonValue = {
        migratedAt: new Date().toISOString(),
        businessPlan: (project.businessPlan ?? null) as Prisma.InputJsonValue,
        technicalPlan: (project.technicalPlan ?? null) as Prisma.InputJsonValue,
        uxPlan: (project.uxPlan ?? null) as Prisma.InputJsonValue,
      }

      await prisma.$transaction(async (tx) => {
        await tx.project.update({
          where: { id: project.id },
          data: { legacyPlans: legacySnapshot },
        })

        for (const block of blocksToCreate) {
          await tx.planBlock.create({
            data: {
              projectId: project.id,
              planType: block.planType,
              blockId: block.blockId,
              title: block.title,
              order: block.order,
              body: block.body,
              status: BlockStatus.APPROVED,
              approvedAt,
            },
          })
        }
      })

      logger.info(
        `Projeto ${project.id} (${project.name}): migrado — ${blocksToCreate.length} blocos criados.`,
      )
      result.migrated++
      result.blocksCreated += blocksToCreate.length
    }

    logger.info(
      `Migração ${dryRun ? 'dry-run ' : ''}concluída: ${result.migrated} migrados, ${result.skipped} pulados, ${result.blocksCreated} blocos criados.`,
    )
  } finally {
    if (ownsPrisma) {
      await prisma.$disconnect()
    }
  }

  return result
}

// ----------------------------------------------------------------------------
// CLI entrypoint
// ----------------------------------------------------------------------------

function parseArgs(argv: string[]): MigrateOptions {
  const options: MigrateOptions = {}
  for (const arg of argv) {
    if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg.startsWith('--project-id=')) {
      options.projectId = arg.slice('--project-id='.length)
    }
  }
  return options
}

// Detecta execução direta vs import (em testes).
// import.meta.url começa com file:// quando executado via tsx/node.
const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === `file://${process.argv[1]}`

if (isDirectRun) {
  const options = parseArgs(process.argv.slice(2))
  migrate(options)
    .then((result) => {
      if (result.totalProjects === 0) {
        consoleLogger.info('Nenhum projeto candidato encontrado.')
      }
      process.exit(0)
    })
    .catch((err) => {
      consoleLogger.error(`Falha na migração: ${err instanceof Error ? err.message : String(err)}`)
      process.exit(1)
    })
}
