-- CreateEnum
CREATE TYPE "PersonaTag" AS ENUM ('FOUNDER', 'PM', 'AGENCIA');

-- CreateEnum
CREATE TYPE "WorkspaceMode" AS ENUM ('SOLO', 'TEAM');

-- CreateEnum
CREATE TYPE "ProjectPhase" AS ENUM ('ESPECIFICACAO', 'GESTAO');

-- CreateEnum
CREATE TYPE "ProductStage" AS ENUM ('PRE_PRODUCT', 'MVP', 'SCALING', 'MATURE');

-- CreateEnum
CREATE TYPE "ReviewCadence" AS ENUM ('MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "AssumptionCategory" AS ENUM ('USER', 'PROBLEM', 'SOLUTION', 'BUSINESS', 'FEASIBILITY', 'ADOPTION');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('NEGOCIO', 'UX', 'TECNICO');

-- CreateEnum
CREATE TYPE "BlockStatus" AS ENUM ('DRAFT', 'APPROVED', 'ADJUSTED');

-- CreateEnum
CREATE TYPE "DecisionCategory" AS ENUM ('AUTH', 'PAGAMENTO', 'DADOS_API', 'INFRA', 'LGPD', 'PRODUTO', 'PRICING', 'UX');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'SUPERSEDED', 'REJECTED', 'DEPRECATED', 'OBSOLETE');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('DADOS_API', 'LEGAL_LGPD', 'CONCORRENCIA', 'TECNICO', 'REPUTACAO', 'MERCADO', 'FINANCEIRO', 'SECURITY');

-- CreateEnum
CREATE TYPE "RiskImpact" AS ENUM ('ALTO', 'MEDIO', 'BAIXO');

-- CreateEnum
CREATE TYPE "RiskProbability" AS ENUM ('ALTA', 'MEDIA', 'BAIXA');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('MONITORANDO', 'MITIGADO', 'ACAO_NECESSARIA', 'ACEITO');

-- CreateEnum
CREATE TYPE "RiskCloseState" AS ENUM ('MITIGADO', 'ACEITO', 'MATERIALIZADO', 'OBSOLETO');

-- CreateEnum
CREATE TYPE "PlatformTier" AS ENUM ('TRIAL', 'START', 'PRO', 'SCALE');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "legacyPlans" JSONB,
ADD COLUMN     "phase" "ProjectPhase" NOT NULL DEFAULT 'ESPECIFICACAO',
ADD COLUMN     "stageKey" TEXT NOT NULL DEFAULT 'discovery_q1',
ADD COLUMN     "version" TEXT NOT NULL DEFAULT 'v1.0';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "personaTag" "PersonaTag",
ADD COLUMN     "workspaceMode" "WorkspaceMode" NOT NULL DEFAULT 'SOLO';

-- CreateTable
CREATE TABLE "product_contexts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userSegment" TEXT NOT NULL,
    "primaryJtbd" JSONB NOT NULL,
    "currentAlternative" TEXT NOT NULL,
    "doNothingImpact" TEXT NOT NULL,
    "primaryMetric" TEXT NOT NULL,
    "stage" "ProductStage" NOT NULL,
    "strategicBets" JSONB NOT NULL,
    "openAssumptions" JSONB NOT NULL,
    "reviewCadence" "ReviewCadence" NOT NULL DEFAULT 'QUARTERLY',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_blocks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "planType" "PlanType" NOT NULL,
    "blockId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "BlockStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "adjustedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_drafts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "yStatement" TEXT,
    "context" TEXT,
    "trigger" TEXT,
    "category" "DecisionCategory" NOT NULL,
    "origin" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "yStatement" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "alternatives" TEXT NOT NULL,
    "consequences" TEXT NOT NULL,
    "category" "DecisionCategory" NOT NULL,
    "status" "DecisionStatus" NOT NULL DEFAULT 'PROPOSED',
    "reviewDate" TIMESTAMP(3),
    "linkedBetIndex" INTEGER,
    "linkedJtbdId" TEXT,
    "linkedAssumptionIndex" INTEGER,
    "supersededById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_drafts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT,
    "category" "RiskCategory" NOT NULL,
    "origin" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "mitigation" TEXT NOT NULL,
    "contingency" TEXT NOT NULL,
    "impact" "RiskImpact" NOT NULL,
    "probability" "RiskProbability" NOT NULL,
    "category" "RiskCategory" NOT NULL,
    "status" "RiskStatus" NOT NULL DEFAULT 'MONITORANDO',
    "closeState" "RiskCloseState",
    "closeEvidence" TEXT,
    "closedAt" TIMESTAMP(3),
    "nextReview" TIMESTAMP(3),
    "linkedBetIndex" INTEGER,
    "linkedJtbdId" TEXT,
    "linkedAssumptionIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_ledgers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 60,
    "tier" "PlatformTier" NOT NULL DEFAULT 'TRIAL',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_contexts_userId_key" ON "product_contexts"("userId");

-- CreateIndex
CREATE INDEX "plan_blocks_projectId_planType_idx" ON "plan_blocks"("projectId", "planType");

-- CreateIndex
CREATE UNIQUE INDEX "plan_blocks_projectId_planType_blockId_key" ON "plan_blocks"("projectId", "planType", "blockId");

-- CreateIndex
CREATE INDEX "decision_drafts_projectId_dismissedAt_idx" ON "decision_drafts"("projectId", "dismissedAt");

-- CreateIndex
CREATE UNIQUE INDEX "decisions_supersededById_key" ON "decisions"("supersededById");

-- CreateIndex
CREATE INDEX "decisions_projectId_status_idx" ON "decisions"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "decisions_projectId_publicId_key" ON "decisions"("projectId", "publicId");

-- CreateIndex
CREATE INDEX "risk_drafts_projectId_dismissedAt_idx" ON "risk_drafts"("projectId", "dismissedAt");

-- CreateIndex
CREATE INDEX "risks_projectId_status_idx" ON "risks"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "risks_projectId_publicId_key" ON "risks"("projectId", "publicId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_ledgers_userId_key" ON "credit_ledgers"("userId");

-- AddForeignKey
ALTER TABLE "product_contexts" ADD CONSTRAINT "product_contexts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_blocks" ADD CONSTRAINT "plan_blocks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_drafts" ADD CONSTRAINT "decision_drafts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "decisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_drafts" ADD CONSTRAINT "risk_drafts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risks" ADD CONSTRAINT "risks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledgers" ADD CONSTRAINT "credit_ledgers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

