/**
 * TRC-14.6 — Testes de integração da migração JSON blobs → PlanBlock.
 *
 * Rodam contra o DATABASE_URL configurado, seguindo o padrão de
 * prisma/schema.test.ts: se o DB não estiver acessível, a suite é skipada
 * (evita quebrar CI sem credenciais).
 *
 * Cada teste isola dados num User descartável via randomUUID().
 */

// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { migrate, type Logger } from './migrate-plans-to-blocks'

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

// Logger silencioso para não poluir output dos testes.
const silentLogger: Logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
}

// Plano de negócio de exemplo — shape da interface BusinessPlan (src/types/index.ts).
const sampleBusinessPlan = {
  name: 'Cafeteria Bairro',
  tagline: 'Gestão de pedidos sem complicar o balcão',
  description: 'App para donos de cafeterias capturarem pedidos via Pix.',
  problemStatement: 'Cafeterias perdem pedidos no rush por não responder WhatsApp a tempo.',
  targetAudience: {
    primary: 'Donos de cafeteria de bairro',
    secondary: 'Atendentes do balcão',
    painPoints: ['Rush tira o foco', 'WhatsApp manual é lento'],
  },
  coreFeatures: [
    { id: 'f1', name: 'Captura por link', priority: 'must-have', complexity: 'low' },
    { id: 'f2', name: 'Notificação Pix', priority: 'must-have', complexity: 'medium' },
  ],
  niceToHaveFeatures: [
    { id: 'f3', name: 'Fidelidade', priority: 'nice-to-have', complexity: 'medium' },
  ],
  monetization: { model: 'subscription', description: 'R$ 49/mês por loja' },
  competitors: [{ name: 'iFood', differentiator: 'Comissão de 25%' }],
  successMetrics: [{ name: 'Pedidos/semana', target: '50', timeframe: 'Mês 1' }],
}

const sampleUxPlan = {
  personas: [
    { name: 'Maria Clara — Dona', initials: 'MC', age: 42, goals: ['Reduzir custo'] },
  ],
  journeys: [
    { name: 'Primeiro pedido', persona: 'Maria Clara', steps: [{ title: 'Descoberta' }] },
  ],
  wireframes: [{ name: 'Dashboard', description: 'Visão geral' }],
  informationArchitecture: { sitemap: 'Dashboard > Pedidos', navigation: [] },
  designTokens: {
    colors: { primary: '#2563eb', secondary: '#6366f1' },
    spacing: [{ name: 'space-1', value: '4px' }],
  },
}

const sampleTechnicalPlan = {
  stack: { categories: [{ name: 'Frontend', technologies: ['Next.js 15', 'React 19'] }] },
  architecture: {
    pattern: 'Monolito modular',
    organization: 'Feature-based folders',
  },
  database: { description: 'Postgres', prismaSchema: 'model User {...}', summary: '3 models' },
  dataModel: { entities: [{ name: 'Order', fields: [] }] },
  apiEndpoints: [
    { category: 'Pedidos', endpoints: [{ method: 'POST', path: '/api/orders', description: 'Cria' }] },
  ],
  integrations: [{ name: 'Mercado Pago', description: 'Pix', details: 'Webhook' }],
  realtime: { provider: 'Pusher', description: 'Pedidos ao vivo', channels: [], scalability: '100k' },
}

describeIfDb('migrate-plans-to-blocks', () => {
  let userId: string
  const createdUserIds: string[] = []

  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    const unique = randomUUID().slice(0, 8)
    const user = await prisma.user.create({
      data: {
        clerkId: `migrate-test-clerk-${unique}`,
        email: `migrate-test-${unique}@example.com`,
      },
    })
    userId = user.id
    createdUserIds.push(userId)
  })

  afterEach(async () => {
    // Cascade em User apaga projetos + planBlocks criados no teste.
    while (createdUserIds.length) {
      const id = createdUserIds.pop()!
      await prisma.user.delete({ where: { id } }).catch(() => undefined)
    }
  })

  // --------------------------------------------------------------------------
  // Cenário 1: projeto com os 3 planos JSON → 14 PlanBlocks (6 + 4 + 4).
  // --------------------------------------------------------------------------
  it('migra projeto com os 3 planos completos para 14 PlanBlocks e preserva legacyPlans', async () => {
    const project = await prisma.project.create({
      data: {
        userId,
        name: 'Projeto completo',
        businessPlan: sampleBusinessPlan,
        technicalPlan: sampleTechnicalPlan,
        uxPlan: sampleUxPlan,
      },
    })

    const result = await migrate({
      prisma,
      logger: silentLogger,
      projectId: project.id,
    })

    expect(result.migrated).toBe(1)
    expect(result.skipped).toBe(0)
    expect(result.blocksCreated).toBe(14)

    const blocks = await prisma.planBlock.findMany({
      where: { projectId: project.id },
      orderBy: [{ planType: 'asc' }, { order: 'asc' }],
    })

    expect(blocks).toHaveLength(14)

    const negocio = blocks.filter((b) => b.planType === 'NEGOCIO')
    expect(negocio.map((b) => b.blockId)).toEqual([
      'visao',
      'problema',
      'publico',
      'features',
      'diferenciais',
      'monetizacao',
    ])
    expect(negocio[0].body).toContain('Cafeteria Bairro')
    expect(negocio[1].body).toContain('rush')

    const ux = blocks.filter((b) => b.planType === 'UX')
    expect(ux.map((b) => b.blockId)).toEqual(['personas', 'jornadas', 'telas', 'tokens'])

    const tecnico = blocks.filter((b) => b.planType === 'TECNICO')
    expect(tecnico.map((b) => b.blockId)).toEqual([
      'stack',
      'arquitetura',
      'dados',
      'integracoes',
    ])

    // status = APPROVED e approvedAt preenchido.
    expect(blocks.every((b) => b.status === 'APPROVED')).toBe(true)
    expect(blocks.every((b) => b.approvedAt !== null)).toBe(true)

    // legacyPlans preservado com o JSON original.
    const updated = await prisma.project.findUniqueOrThrow({ where: { id: project.id } })
    const legacy = updated.legacyPlans as {
      businessPlan: typeof sampleBusinessPlan
      technicalPlan: typeof sampleTechnicalPlan
      uxPlan: typeof sampleUxPlan
      migratedAt: string
    }
    expect(legacy.businessPlan.name).toBe('Cafeteria Bairro')
    expect(legacy.technicalPlan.architecture.pattern).toBe('Monolito modular')
    expect(legacy.uxPlan.personas).toHaveLength(1)
    expect(typeof legacy.migratedAt).toBe('string')
  })

  // --------------------------------------------------------------------------
  // Cenário 2: apenas businessPlan → 6 blocos NEGOCIO; outros planos não geram.
  // --------------------------------------------------------------------------
  it('migra apenas blocos correspondentes aos planos existentes', async () => {
    const project = await prisma.project.create({
      data: {
        userId,
        name: 'Só negocio',
        businessPlan: sampleBusinessPlan,
      },
    })

    const result = await migrate({
      prisma,
      logger: silentLogger,
      projectId: project.id,
    })

    expect(result.migrated).toBe(1)
    expect(result.blocksCreated).toBe(6)

    const blocks = await prisma.planBlock.findMany({ where: { projectId: project.id } })
    expect(blocks).toHaveLength(6)
    expect(blocks.every((b) => b.planType === 'NEGOCIO')).toBe(true)
  })

  // --------------------------------------------------------------------------
  // Cenário 3: idempotência — 2 runs seguidas, a segunda skipa.
  // --------------------------------------------------------------------------
  it('é idempotente: rodar duas vezes não duplica blocos', async () => {
    const project = await prisma.project.create({
      data: {
        userId,
        name: 'Idempotente',
        businessPlan: sampleBusinessPlan,
      },
    })

    const first = await migrate({
      prisma,
      logger: silentLogger,
      projectId: project.id,
    })
    expect(first.migrated).toBe(1)
    expect(first.blocksCreated).toBe(6)

    const second = await migrate({
      prisma,
      logger: silentLogger,
      projectId: project.id,
    })
    expect(second.migrated).toBe(0)
    expect(second.skipped).toBe(1)
    expect(second.blocksCreated).toBe(0)

    const blocks = await prisma.planBlock.findMany({ where: { projectId: project.id } })
    expect(blocks).toHaveLength(6)
  })

  // --------------------------------------------------------------------------
  // Cenário 4: dry-run não persiste PlanBlocks nem toca legacyPlans.
  // --------------------------------------------------------------------------
  it('dry-run não persiste nenhum bloco nem preenche legacyPlans', async () => {
    const project = await prisma.project.create({
      data: {
        userId,
        name: 'Dry run',
        businessPlan: sampleBusinessPlan,
        uxPlan: sampleUxPlan,
      },
    })

    const result = await migrate({
      prisma,
      logger: silentLogger,
      projectId: project.id,
      dryRun: true,
    })

    expect(result.dryRun).toBe(true)
    expect(result.migrated).toBe(1)
    expect(result.blocksCreated).toBe(10) // 6 NEGOCIO + 4 UX

    const blocks = await prisma.planBlock.findMany({ where: { projectId: project.id } })
    expect(blocks).toHaveLength(0)

    const updated = await prisma.project.findUniqueOrThrow({ where: { id: project.id } })
    expect(updated.legacyPlans).toBeNull()
  })

  // --------------------------------------------------------------------------
  // Cenário 5: projeto sem planos antigos → skip sem efeito.
  // --------------------------------------------------------------------------
  it('pula projeto sem planos legados', async () => {
    const project = await prisma.project.create({
      data: {
        userId,
        name: 'Sem planos',
      },
    })

    const result = await migrate({
      prisma,
      logger: silentLogger,
      projectId: project.id,
    })

    // Com projectId explícito, o projeto é listado, mas como todos os planos
    // são null, nenhum bloco é derivado e ele é contabilizado em "skipped".
    expect(result.migrated).toBe(0)
    expect(result.skipped).toBe(1)
    expect(result.blocksCreated).toBe(0)

    const blocks = await prisma.planBlock.findMany({ where: { projectId: project.id } })
    expect(blocks).toHaveLength(0)
  })

  // --------------------------------------------------------------------------
  // Cenário 6 (extra): dado malformado vai para fallback sem perder info.
  // --------------------------------------------------------------------------
  it('grava dump cru em bloco fallback quando o JSON é irreconhecível', async () => {
    const project = await prisma.project.create({
      data: {
        userId,
        name: 'Malformado',
        businessPlan: { campoDesconhecido: 'valor arbitrário' },
      },
    })

    const result = await migrate({
      prisma,
      logger: silentLogger,
      projectId: project.id,
    })

    expect(result.migrated).toBe(1)
    expect(result.blocksCreated).toBe(1)

    const blocks = await prisma.planBlock.findMany({ where: { projectId: project.id } })
    expect(blocks).toHaveLength(1)
    expect(blocks[0].blockId).toBe('visao')
    expect(blocks[0].body).toContain('campoDesconhecido')
  })

  // --------------------------------------------------------------------------
  // Cenário 7 (extra): filtro global (sem projectId) pega só projetos com
  // legacyPlans=null e algum plano não-null.
  // --------------------------------------------------------------------------
  it('sem projectId, migra apenas candidatos e ignora já migrados', async () => {
    const naoMigrado = await prisma.project.create({
      data: {
        userId,
        name: 'Não migrado',
        businessPlan: sampleBusinessPlan,
      },
    })

    const jaMigrado = await prisma.project.create({
      data: {
        userId,
        name: 'Já migrado',
        businessPlan: sampleBusinessPlan,
        legacyPlans: { migratedAt: new Date().toISOString() },
      },
    })

    const semPlanos = await prisma.project.create({
      data: {
        userId,
        name: 'Sem planos',
      },
    })

    const result = await migrate({ prisma, logger: silentLogger })

    // Só o primeiro é candidato. Os outros são invisíveis ao filtro.
    const blocksNaoMigrado = await prisma.planBlock.findMany({
      where: { projectId: naoMigrado.id },
    })
    const blocksJaMigrado = await prisma.planBlock.findMany({
      where: { projectId: jaMigrado.id },
    })
    const blocksSemPlanos = await prisma.planBlock.findMany({
      where: { projectId: semPlanos.id },
    })

    expect(blocksNaoMigrado).toHaveLength(6)
    expect(blocksJaMigrado).toHaveLength(0)
    expect(blocksSemPlanos).toHaveLength(0)
    expect(result.migrated).toBeGreaterThanOrEqual(1)
  })
})
