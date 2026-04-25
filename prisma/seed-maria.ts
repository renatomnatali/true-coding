/**
 * TRC-14.7 — Seed Maria/Cafeteria Beta.
 *
 * Cria o estado canônico da Maria em modo "projeto exportado v1.0":
 * User + CreditLedger + ProductContext + Project + 14 PlanBlocks (APPROVED)
 * + 2 DecisionDrafts (pending) + 2 RiskDrafts (pending).
 *
 * Idempotente: upsert por clerkId/userId/composite unique; re-runs não duplicam.
 *
 * Uso: `npm run db:seed:maria`.
 * Reset: `DELETE FROM users WHERE "clerkId" = 'seed-maria-clerk-id' CASCADE;`
 *
 * Fixtures são re-exportadas em `src/test/fixtures/maria-canonical.ts`
 * — single source of truth entre seed e testes unitários.
 */

import { PrismaClient, PersonaTag, WorkspaceMode } from '@prisma/client'
import type { Prisma } from '@prisma/client'

import {
  MARIA_ALL_BLOCKS,
  MARIA_BLOCK_STATUS,
  MARIA_CLERK_ID,
  MARIA_CREDIT_LEDGER,
  MARIA_DECISION_DRAFTS,
  MARIA_PRODUCT_CONTEXT,
  MARIA_PROJECT,
  MARIA_RISK_DRAFTS,
  MARIA_USER,
} from '../src/test/fixtures/maria-canonical'

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
// Orquestrador
// ----------------------------------------------------------------------------

export interface SeedOptions {
  prisma?: PrismaClient
  logger?: Logger
}

export interface SeedResult {
  userId: string
  projectId: string
  created: {
    user: boolean
    productContext: boolean
    creditLedger: boolean
    project: boolean
    planBlocks: number
    decisionDrafts: number
    riskDrafts: number
  }
}

/**
 * Busca o projeto canônico da Maria por (userId, name).
 * Usa findFirst porque `name` não é unique no schema; na prática, é único
 * dentro do escopo deste seed (só esta função cria um projeto com esse nome
 * para esse user).
 */
async function findMariaProject(
  prisma: PrismaClient,
  userId: string,
): Promise<{ id: string } | null> {
  return prisma.project.findFirst({
    where: { userId, name: MARIA_PROJECT.name },
    select: { id: true },
  })
}

export async function seedMaria(options: SeedOptions = {}): Promise<SeedResult> {
  const logger = options.logger ?? consoleLogger
  const prisma = options.prisma ?? new PrismaClient()
  const ownsPrisma = !options.prisma

  const created = {
    user: false,
    productContext: false,
    creditLedger: false,
    project: false,
    planBlocks: 0,
    decisionDrafts: 0,
    riskDrafts: 0,
  }

  try {
    // ------------------------------------------------------------------------
    // 1. User (idempotente por clerkId fixo)
    // ------------------------------------------------------------------------
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: MARIA_CLERK_ID },
      select: { id: true },
    })
    created.user = !existingUser

    const user = await prisma.user.upsert({
      where: { clerkId: MARIA_CLERK_ID },
      create: {
        clerkId: MARIA_USER.clerkId,
        email: MARIA_USER.email,
        name: MARIA_USER.name,
        personaTag: PersonaTag.FOUNDER,
        workspaceMode: WorkspaceMode.SOLO,
      },
      // No-op no update — preserva edições manuais do dev que possam ter
      // sido feitas para testar fluxos pontuais no Prisma Studio.
      update: {},
      select: { id: true },
    })
    logger.info(`User Maria: ${user.id} (${created.user ? 'criado' : 'já existia'}).`)

    // ------------------------------------------------------------------------
    // 2. CreditLedger (1:1 com User por userId unique)
    // ------------------------------------------------------------------------
    const existingLedger = await prisma.creditLedger.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    created.creditLedger = !existingLedger

    await prisma.creditLedger.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        balance: MARIA_CREDIT_LEDGER.balance,
        tier: MARIA_CREDIT_LEDGER.tier,
      },
      update: {},
    })

    // ------------------------------------------------------------------------
    // 3. ProductContext (1:1 com User por userId unique)
    // ------------------------------------------------------------------------
    const existingContext = await prisma.productContext.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    created.productContext = !existingContext

    await prisma.productContext.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        userSegment: MARIA_PRODUCT_CONTEXT.userSegment,
        primaryJtbd: MARIA_PRODUCT_CONTEXT.primaryJtbd as unknown as Prisma.InputJsonValue,
        currentAlternative: MARIA_PRODUCT_CONTEXT.currentAlternative,
        doNothingImpact: MARIA_PRODUCT_CONTEXT.doNothingImpact,
        primaryMetric: MARIA_PRODUCT_CONTEXT.primaryMetric,
        stage: MARIA_PRODUCT_CONTEXT.stage,
        strategicBets: MARIA_PRODUCT_CONTEXT.strategicBets as unknown as Prisma.InputJsonValue,
        openAssumptions: MARIA_PRODUCT_CONTEXT.openAssumptions as unknown as Prisma.InputJsonValue,
        reviewCadence: MARIA_PRODUCT_CONTEXT.reviewCadence,
        completedAt: new Date(),
      },
      update: {},
    })

    // ------------------------------------------------------------------------
    // 4. Project Cafeteria Beta (idempotente via findFirst por [userId, name])
    // ------------------------------------------------------------------------
    const foundProject = await findMariaProject(prisma, user.id)
    created.project = !foundProject

    const projectId = foundProject
      ? foundProject.id
      : (
          await prisma.project.create({
            data: {
              userId: user.id,
              name: MARIA_PROJECT.name,
              description: MARIA_PROJECT.description,
              stage: MARIA_PROJECT.stage,
              stageKey: MARIA_PROJECT.stageKey,
              version: MARIA_PROJECT.version,
            },
            select: { id: true },
          })
        ).id

    logger.info(
      `Project ${MARIA_PROJECT.name}: ${projectId} (${created.project ? 'criado' : 'já existia'}).`,
    )

    // ------------------------------------------------------------------------
    // 5. PlanBlocks — 14 blocos APPROVED (upsert via unique composite)
    // ------------------------------------------------------------------------
    const approvedAt = new Date()
    for (const block of MARIA_ALL_BLOCKS) {
      const existing = await prisma.planBlock.findUnique({
        where: {
          projectId_planType_blockId: {
            projectId,
            planType: block.planType,
            blockId: block.blockId,
          },
        },
        select: { id: true },
      })
      if (!existing) created.planBlocks++

      await prisma.planBlock.upsert({
        where: {
          projectId_planType_blockId: {
            projectId,
            planType: block.planType,
            blockId: block.blockId,
          },
        },
        create: {
          projectId,
          planType: block.planType,
          blockId: block.blockId,
          order: block.order,
          title: block.title,
          body: block.body,
          status: MARIA_BLOCK_STATUS,
          approvedAt,
        },
        update: {},
      })
    }

    // ------------------------------------------------------------------------
    // 6. DecisionDrafts (pending — 2 sugestões da Inbox)
    // Idempotente via composição [projectId, title] (nível de aplicação,
    // schema não exige unique). Evita duplicar em re-runs.
    // ------------------------------------------------------------------------
    for (const draft of MARIA_DECISION_DRAFTS) {
      const existing = await prisma.decisionDraft.findFirst({
        where: { projectId, title: draft.title },
        select: { id: true },
      })
      if (existing) continue

      await prisma.decisionDraft.create({
        data: {
          projectId,
          title: draft.title,
          yStatement: draft.yStatement,
          category: draft.category,
          origin: draft.origin,
          trigger: draft.trigger,
        },
      })
      created.decisionDrafts++
    }

    // ------------------------------------------------------------------------
    // 7. RiskDrafts (pending — 2 sugestões da Inbox)
    // ------------------------------------------------------------------------
    for (const draft of MARIA_RISK_DRAFTS) {
      const existing = await prisma.riskDraft.findFirst({
        where: { projectId, title: draft.title },
        select: { id: true },
      })
      if (existing) continue

      await prisma.riskDraft.create({
        data: {
          projectId,
          title: draft.title,
          description: draft.description,
          trigger: draft.trigger,
          category: draft.category,
          origin: draft.origin,
        },
      })
      created.riskDrafts++
    }

    logger.info(
      `Seed Maria concluído: user=${user.id}, project=${projectId}, ` +
        `planBlocksCriados=${created.planBlocks}/14, ` +
        `decisionDraftsCriados=${created.decisionDrafts}/2, ` +
        `riskDraftsCriados=${created.riskDrafts}/2.`,
    )

    return { userId: user.id, projectId, created }
  } finally {
    if (ownsPrisma) {
      await prisma.$disconnect()
    }
  }
}

// ----------------------------------------------------------------------------
// CLI entrypoint
// ----------------------------------------------------------------------------

const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === `file://${process.argv[1]}`

if (isDirectRun) {
  seedMaria()
    .then(() => process.exit(0))
    .catch((err) => {
      consoleLogger.error(
        `Seed Maria falhou: ${err instanceof Error ? err.message : String(err)}`,
      )
      process.exit(1)
    })
}
