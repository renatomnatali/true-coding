/**
 * TRC-14.7 — Testes de integração do seed Maria/Cafeteria Beta.
 *
 * Rodam contra o DATABASE_URL configurado, seguindo o padrão de
 * prisma/schema.test.ts: se o DB não estiver acessível, a suite é skipada.
 *
 * Limpam o estado por clerkId fixo antes e depois para não vazar entre suites.
 */

// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

import { seedMaria, type Logger } from './seed-maria'
import {
  MARIA_ALL_BLOCKS,
  MARIA_BLOCK_STATUS,
  MARIA_CLERK_ID,
  MARIA_DECISION_DRAFTS,
  MARIA_PROJECT,
  MARIA_RISK_DRAFTS,
} from '../src/test/fixtures/maria-canonical'

const prisma = new PrismaClient({ log: ['error'] })

// Probe DB — se falha, pula toda a suite.
let dbReachable = false
try {
  await prisma.$connect()
  await prisma.$queryRawUnsafe('SELECT 1')
  dbReachable = true
} catch {
  dbReachable = false
}

const describeIfDb = dbReachable ? describe : describe.skip

const silentLogger: Logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
}

/**
 * Deleta o user Maria (cascade limpa projeto + blocos + drafts + context + ledger).
 * Usado antes e depois de cada teste para garantir isolamento.
 *
 * Usa deleteMany para ser no-op silenciosamente quando o registro já não existe
 * — evita ruído de "record not found" no stderr do Prisma.
 */
async function resetMaria(): Promise<void> {
  await prisma.user.deleteMany({ where: { clerkId: MARIA_CLERK_ID } })
}

describeIfDb('seed-maria', () => {
  // $connect já aconteceu no probe top-level — sem double-connect.
  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await resetMaria()
  })

  afterEach(async () => {
    await resetMaria()
  })

  // --------------------------------------------------------------------------
  // Cenário 1: run limpo cria todo o estado canônico.
  // --------------------------------------------------------------------------
  it('cria User + ProductContext + CreditLedger + Project + 14 PlanBlocks + 2 DecisionDrafts + 2 RiskDrafts', async () => {
    const result = await seedMaria({ prisma, logger: silentLogger })

    expect(result.created.user).toBe(true)
    expect(result.created.productContext).toBe(true)
    expect(result.created.creditLedger).toBe(true)
    expect(result.created.project).toBe(true)
    expect(result.created.planBlocks).toBe(14)
    expect(result.created.decisionDrafts).toBe(2)
    expect(result.created.riskDrafts).toBe(2)

    const user = await prisma.user.findUnique({ where: { clerkId: MARIA_CLERK_ID } })
    expect(user).not.toBeNull()
    expect(user!.personaTag).toBe('FOUNDER')
    expect(user!.workspaceMode).toBe('SOLO')

    const ledger = await prisma.creditLedger.findUnique({ where: { userId: user!.id } })
    expect(ledger).not.toBeNull()
    expect(ledger!.balance).toBe(1)
    expect(ledger!.tier).toBe('TRIAL')

    const context = await prisma.productContext.findUnique({ where: { userId: user!.id } })
    expect(context).not.toBeNull()
    expect(context!.stage).toBe('PRE_PRODUCT')
    expect(context!.reviewCadence).toBe('QUARTERLY')
    const bets = context!.strategicBets as string[]
    expect(bets.length).toBeGreaterThanOrEqual(2)
    const assumptions = context!.openAssumptions as Array<{ category: string }>
    expect(assumptions.length).toBeGreaterThanOrEqual(3)

    const blocks = await prisma.planBlock.findMany({
      where: { projectId: result.projectId },
      orderBy: [{ planType: 'asc' }, { order: 'asc' }],
    })
    expect(blocks).toHaveLength(14)

    const decisionDrafts = await prisma.decisionDraft.findMany({
      where: { projectId: result.projectId },
    })
    expect(decisionDrafts).toHaveLength(2)
    const byLocale = (a: string, b: string) => a.localeCompare(b, 'pt-BR')
    const draftTitles = decisionDrafts.map((d) => d.title).sort(byLocale)
    expect(draftTitles).toEqual(
      MARIA_DECISION_DRAFTS.map((d) => d.title).sort(byLocale),
    )

    const riskDrafts = await prisma.riskDraft.findMany({
      where: { projectId: result.projectId },
    })
    expect(riskDrafts).toHaveLength(2)
    const riskTitles = riskDrafts.map((r) => r.title).sort(byLocale)
    expect(riskTitles).toEqual(
      MARIA_RISK_DRAFTS.map((r) => r.title).sort(byLocale),
    )

    // Estado pós-export deliberado: drafts na Inbox; nenhum Decision/Risk registrado.
    const decisions = await prisma.decision.count({ where: { projectId: result.projectId } })
    const risks = await prisma.risk.count({ where: { projectId: result.projectId } })
    expect(decisions).toBe(0)
    expect(risks).toBe(0)
  })

  // --------------------------------------------------------------------------
  // Cenário 2: idempotência — segunda run não duplica nada.
  // --------------------------------------------------------------------------
  it('é idempotente: rodar duas vezes não duplica entidades', async () => {
    const first = await seedMaria({ prisma, logger: silentLogger })
    expect(first.created.user).toBe(true)
    expect(first.created.planBlocks).toBe(14)

    const second = await seedMaria({ prisma, logger: silentLogger })
    expect(second.created.user).toBe(false)
    expect(second.created.productContext).toBe(false)
    expect(second.created.creditLedger).toBe(false)
    expect(second.created.project).toBe(false)
    expect(second.created.planBlocks).toBe(0)
    expect(second.created.decisionDrafts).toBe(0)
    expect(second.created.riskDrafts).toBe(0)

    // Mesmas ids — confirma upsert/find em vez de create duplicado.
    expect(second.userId).toBe(first.userId)
    expect(second.projectId).toBe(first.projectId)

    // Contagens totais no DB para o escopo Maria permanecem as mesmas.
    const projects = await prisma.project.count({ where: { userId: first.userId } })
    const blocks = await prisma.planBlock.count({ where: { projectId: first.projectId } })
    const decisionDrafts = await prisma.decisionDraft.count({
      where: { projectId: first.projectId },
    })
    const riskDrafts = await prisma.riskDraft.count({
      where: { projectId: first.projectId },
    })
    expect(projects).toBe(1)
    expect(blocks).toBe(14)
    expect(decisionDrafts).toBe(2)
    expect(riskDrafts).toBe(2)
  })

  // --------------------------------------------------------------------------
  // Cenário 3: Project tem metadata de pós-export v1.0.
  // --------------------------------------------------------------------------
  it('Project tem stageKey=exportar, version=v1.0, phase=ESPECIFICACAO', async () => {
    const result = await seedMaria({ prisma, logger: silentLogger })
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: result.projectId },
    })
    expect(project.name).toBe(MARIA_PROJECT.name)
    expect(project.phase).toBe('ESPECIFICACAO')
    expect(project.stageKey).toBe('exportar')
    expect(project.version).toBe('v1.0')
  })

  // --------------------------------------------------------------------------
  // Cenário 4: todos os PlanBlocks estão APPROVED (estado pós-export).
  // --------------------------------------------------------------------------
  it('todos os PlanBlocks estão APPROVED com approvedAt preenchido e respeitam a ordem canônica', async () => {
    const result = await seedMaria({ prisma, logger: silentLogger })

    const blocks = await prisma.planBlock.findMany({
      where: { projectId: result.projectId },
      orderBy: [{ planType: 'asc' }, { order: 'asc' }],
    })

    expect(blocks).toHaveLength(14)
    expect(blocks.every((b) => b.status === MARIA_BLOCK_STATUS)).toBe(true)
    expect(blocks.every((b) => b.approvedAt !== null)).toBe(true)

    // Contagem por plano.
    const negocio = blocks.filter((b) => b.planType === 'NEGOCIO')
    const ux = blocks.filter((b) => b.planType === 'UX')
    const tecnico = blocks.filter((b) => b.planType === 'TECNICO')
    expect(negocio).toHaveLength(6)
    expect(ux).toHaveLength(4)
    expect(tecnico).toHaveLength(4)

    // Ordem e blockIds batem com a fixture (single source of truth).
    expect(negocio.map((b) => b.blockId)).toEqual([
      'visao',
      'problema',
      'publico',
      'features',
      'diferenciais',
      'monetizacao',
    ])
    expect(ux.map((b) => b.blockId)).toEqual(['personas', 'jornadas', 'telas', 'tokens'])
    expect(tecnico.map((b) => b.blockId)).toEqual(['stack', 'arquitetura', 'dados', 'integracoes'])

    // Bodies carregam acentuação pt-BR (Regra CLAUDE.md #6).
    const visao = negocio.find((b) => b.blockId === 'visao')!
    expect(visao.body).toContain('Cafeteria Beta Pedidos')
    const problema = negocio.find((b) => b.blockId === 'problema')!
    expect(problema.body).toContain('não')
    expect(problema.body).toContain('15 a 20')

    // Alinhamento com a fixture export — bytes iguais por blockId.
    for (const fixture of MARIA_ALL_BLOCKS) {
      const db = blocks.find(
        (b) => b.planType === fixture.planType && b.blockId === fixture.blockId,
      )
      expect(db, `bloco ${fixture.planType}/${fixture.blockId} deve existir no DB`).toBeDefined()
      expect(db!.title).toBe(fixture.title)
      expect(db!.body).toBe(fixture.body)
      expect(db!.order).toBe(fixture.order)
    }
  })
})
