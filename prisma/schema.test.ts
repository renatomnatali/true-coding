/**
 * Testes de integração do schema (TRC-14.5).
 *
 * Rodam contra o DATABASE_URL configurado. Cada teste isola seus dados
 * num User descartável (prefixo `schema-test-<cuid>`) e limpa ao fim.
 *
 * Se o DATABASE_URL não estiver acessível (sem .env, ambiente offline,
 * CI sem credenciais), a suite inteira é skipada — evita quebrar CI.
 */

// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import type { User, Project } from '@prisma/client'

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

describeIfDb('Prisma schema integration', () => {
  let userId: string
  let projectId: string

  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    const unique = Math.random().toString(36).slice(2, 10)
    const user = await prisma.user.create({
      data: {
        clerkId: `schema-test-clerk-${unique}`,
        email: `schema-test-${unique}@example.com`,
      },
    })
    userId = user.id

    const project = await prisma.project.create({
      data: {
        userId,
        name: `schema-test-project-${unique}`,
      },
    })
    projectId = project.id
  })

  // Limpeza: como Project e User têm Cascade para tudo, basta apagar o User.
  async function cleanup(): Promise<void> {
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined)
  }

  it('cria User + ProductContext completo e lê de volta', async () => {
    const context = await prisma.productContext.create({
      data: {
        userId,
        userSegment: 'Donos de cafeteria de bairro em Campinas',
        primaryJtbd: {
          situation: 'No rush do almoço',
          motivation: 'quando perco pedidos por não responder WhatsApp',
          outcome: 'quero capturar pedidos sem parar o balcão',
        },
        currentAlternative: 'WhatsApp Business manual',
        doNothingImpact: 'Perco R$ 2.000/mês em pedidos',
        primaryMetric: 'pedidos capturados por semana',
        stage: 'PRE_PRODUCT',
        strategicBets: [
          'Estamos apostando que clientes fiéis aceitam pagar antes pelo Pix',
          'Estamos apostando que horário de retirada fixo elimina o "tá pronto?"',
        ],
        openAssumptions: [
          { category: 'USER', statement: 'Cliente fiel já usa Pix diariamente' },
          { category: 'PROBLEM', statement: 'A dor é real e recorrente' },
          { category: 'SOLUTION', statement: 'Link por WhatsApp é suficiente' },
        ],
      },
    })

    expect(context.id).toBeTruthy()
    expect(context.reviewCadence).toBe('QUARTERLY')

    const readback = await prisma.productContext.findUnique({
      where: { userId },
    })
    expect(readback).not.toBeNull()
    const jtbd = readback!.primaryJtbd as { situation: string; outcome: string }
    expect(jtbd.situation).toBe('No rush do almoço')
    expect(jtbd.outcome).toBe('quero capturar pedidos sem parar o balcão')
    const bets = readback!.strategicBets as string[]
    expect(bets).toHaveLength(2)
    const assumptions = readback!.openAssumptions as Array<{ category: string }>
    expect(assumptions).toHaveLength(3)

    await cleanup()
  })

  it('cria 6 PlanBlocks de NEGOCIO e lê ordenados', async () => {
    const blocks = [
      { blockId: 'visao', order: 1, title: 'Visão geral' },
      { blockId: 'problema', order: 2, title: 'Problema' },
      { blockId: 'publico', order: 3, title: 'Público-alvo' },
      { blockId: 'features', order: 4, title: 'Features core' },
      { blockId: 'diferenciais', order: 5, title: 'Diferenciais' },
      { blockId: 'monetizacao', order: 6, title: 'Monetização' },
    ]

    for (const b of blocks) {
      await prisma.planBlock.create({
        data: {
          projectId,
          planType: 'NEGOCIO',
          blockId: b.blockId,
          order: b.order,
          title: b.title,
          body: `Body do bloco ${b.blockId}`,
        },
      })
    }

    const read = await prisma.planBlock.findMany({
      where: { projectId, planType: 'NEGOCIO' },
      orderBy: { order: 'asc' },
    })

    expect(read).toHaveLength(6)
    expect(read.map((b) => b.blockId)).toEqual([
      'visao',
      'problema',
      'publico',
      'features',
      'diferenciais',
      'monetizacao',
    ])
    expect(read.every((b) => b.status === 'DRAFT')).toBe(true)

    await cleanup()
  })

  it('promove DecisionDraft para Decision com Y-Statement', async () => {
    const draft = await prisma.decisionDraft.create({
      data: {
        projectId,
        title: 'Não competir com delivery; foco em retirada',
        yStatement:
          'No contexto do lançamento, vendo que a dor é captura de pedido, decidimos não fazer delivery, para alcançar foco, aceitando perda de clientes fora da área.',
        category: 'PRODUTO',
        origin: 'Plano de Negócio · Visão geral',
        trigger: 'Sugerido porque você escreveu "sem parar de atender o balcão"',
      },
    })
    expect(draft.id).toBeTruthy()

    const decision = await prisma.decision.create({
      data: {
        projectId,
        publicId: 'CB-DEC-001',
        title: draft.title,
        yStatement: draft.yStatement!,
        context: 'Cafeteria de bairro com restrição de mão de obra no rush',
        alternatives: 'Delivery próprio; integração iFood; manter só WhatsApp',
        consequences: 'Perde clientes fora da área; mantém foco e margem',
        category: 'PRODUTO',
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    })

    expect(decision.publicId).toBe('CB-DEC-001')
    expect(decision.status).toBe('ACCEPTED')

    await cleanup()
  })

  it('fecha um Risk com closeState MITIGADO + evidência', async () => {
    const risk = await prisma.risk.create({
      data: {
        projectId,
        publicId: 'CB-RISK-001',
        title: 'Falha de confirmação Pix pode travar a fila',
        description: 'Se o webhook do MP atrasar, pedidos pagos somem do painel.',
        trigger: 'Webhook > 30s ou 4xx/5xx',
        mitigation: 'Polling backup + retry exponencial',
        contingency: 'Botão "marcar como pago manualmente"',
        impact: 'ALTO',
        probability: 'MEDIA',
        category: 'DADOS_API',
      },
    })

    expect(risk.status).toBe('MONITORANDO')
    expect(risk.closeState).toBeNull()

    const closed = await prisma.risk.update({
      where: { id: risk.id },
      data: {
        status: 'MITIGADO',
        closeState: 'MITIGADO',
        closeEvidence: 'Polling ativo em produção há 2 semanas sem incidentes',
        closedAt: new Date(),
      },
    })

    expect(closed.closeState).toBe('MITIGADO')
    expect(closed.closedAt).not.toBeNull()
    expect(closed.closeEvidence).toContain('Polling ativo')

    await cleanup()
  })

  it('supersede chain: Decision A ← supersededBy → Decision B (bidirecional)', async () => {
    const decA = await prisma.decision.create({
      data: {
        projectId,
        publicId: 'CB-DEC-010',
        title: 'Decisão A (antiga)',
        yStatement: 'Y de A',
        context: 'ctx',
        alternatives: 'alt',
        consequences: 'csq',
        category: 'INFRA',
        status: 'ACCEPTED',
      },
    })

    const decB = await prisma.decision.create({
      data: {
        projectId,
        publicId: 'CB-DEC-011',
        title: 'Decisão B (nova)',
        yStatement: 'Y de B',
        context: 'ctx',
        alternatives: 'alt',
        consequences: 'csq',
        category: 'INFRA',
        status: 'ACCEPTED',
      },
    })

    // A foi substituída por B: aponta A.supersededById para B.
    await prisma.decision.update({
      where: { id: decA.id },
      data: { supersededById: decB.id, status: 'SUPERSEDED' },
    })

    const readA = await prisma.decision.findUnique({
      where: { id: decA.id },
      include: { supersededBy: true },
    })
    const readB = await prisma.decision.findUnique({
      where: { id: decB.id },
      include: { supersedes: true },
    })

    expect(readA?.supersededById).toBe(decB.id)
    expect(readA?.supersededBy?.publicId).toBe('CB-DEC-011')
    expect(readA?.status).toBe('SUPERSEDED')
    // Lado inverso da relação 1:1 ("supersedes") aponta para A.
    expect(readB?.supersedes?.id).toBe(decA.id)

    await cleanup()
  })

  it('unique constraint [projectId, publicId] rejeita duplicata de Risk', async () => {
    await prisma.risk.create({
      data: {
        projectId,
        publicId: 'CB-RISK-DUP',
        title: 'Risco original',
        description: 'd',
        trigger: 't',
        mitigation: 'm',
        contingency: 'c',
        impact: 'MEDIO',
        probability: 'MEDIA',
        category: 'TECNICO',
      },
    })

    await expect(
      prisma.risk.create({
        data: {
          projectId,
          publicId: 'CB-RISK-DUP',
          title: 'Risco duplicado',
          description: 'd',
          trigger: 't',
          mitigation: 'm',
          contingency: 'c',
          impact: 'BAIXO',
          probability: 'BAIXA',
          category: 'TECNICO',
        },
      }),
    ).rejects.toThrow()

    await cleanup()
  })

  it('onDelete CASCADE: deletar Project remove PlanBlocks/Decisions/Risks/Drafts', async () => {
    await prisma.planBlock.create({
      data: {
        projectId,
        planType: 'UX',
        blockId: 'personas',
        order: 1,
        title: 'Personas',
        body: 'body',
      },
    })
    await prisma.decision.create({
      data: {
        projectId,
        publicId: 'CB-DEC-CASCADE',
        title: 'd',
        yStatement: 'y',
        context: 'c',
        alternatives: 'a',
        consequences: 'cs',
        category: 'PRODUTO',
      },
    })
    await prisma.decisionDraft.create({
      data: {
        projectId,
        title: 'draft',
        category: 'PRODUTO',
        origin: 'test',
      },
    })
    await prisma.risk.create({
      data: {
        projectId,
        publicId: 'CB-RISK-CASCADE',
        title: 'r',
        description: 'd',
        trigger: 't',
        mitigation: 'm',
        contingency: 'c',
        impact: 'BAIXO',
        probability: 'BAIXA',
        category: 'TECNICO',
      },
    })
    await prisma.riskDraft.create({
      data: {
        projectId,
        title: 'rdraft',
        category: 'TECNICO',
        origin: 'test',
      },
    })

    await prisma.project.delete({ where: { id: projectId } })

    const [blocks, decisions, decisionDrafts, risks, riskDrafts] = await Promise.all([
      prisma.planBlock.findMany({ where: { projectId } }),
      prisma.decision.findMany({ where: { projectId } }),
      prisma.decisionDraft.findMany({ where: { projectId } }),
      prisma.risk.findMany({ where: { projectId } }),
      prisma.riskDraft.findMany({ where: { projectId } }),
    ])

    expect(blocks).toHaveLength(0)
    expect(decisions).toHaveLength(0)
    expect(decisionDrafts).toHaveLength(0)
    expect(risks).toHaveLength(0)
    expect(riskDrafts).toHaveLength(0)

    await cleanup()
  })

  it('CreditLedger tem defaults de trial (balance=60, tier=TRIAL)', async () => {
    const ledger = await prisma.creditLedger.create({
      data: { userId },
    })
    expect(ledger.balance).toBe(60)
    expect(ledger.tier).toBe('TRIAL')

    await cleanup()
  })
})
