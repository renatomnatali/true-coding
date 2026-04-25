-- TRC-14.10: Rename Project.phase → Project.stage (TRC-ADR-025).
--
-- TRC-ADR-025 (Gestão contínua) supersedes TRC-ADR-012 ("duas fases
-- Especificação/Gestão"): o ciclo de vida passa a ter apenas 2 stages
-- permanentes — BOOTSTRAP (Discovery + 3 planos não aprovados) e ACTIVE
-- (planos aprovados → gestão contínua). Sem transição manual, sem volta;
-- export gera bundle de especificação mas NÃO altera o stage.
--
-- Mapeamento dos valores legados:
--   ESPECIFICACAO → BOOTSTRAP
--   GESTAO        → ACTIVE
--
-- Idempotência: usa CREATE TYPE/IF NOT EXISTS e DROP TYPE/IF EXISTS para
-- tolerar re-runs em ambientes onde a migration tenha sido aplicada
-- parcialmente. Em produção isto roda exatamente uma vez via
-- `prisma migrate deploy`.

-- 1) Cria o novo enum.
DO $$ BEGIN
  CREATE TYPE "ProjectStage" AS ENUM ('BOOTSTRAP', 'ACTIVE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2) Adiciona a nova coluna `stage` (sem default ainda, para podermos
--    migrar dados das linhas existentes a partir de `phase`).
ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "stage" "ProjectStage";

-- 3) Migração de dados: ESPECIFICACAO → BOOTSTRAP, GESTAO → ACTIVE.
--    A cláusula WHERE filtra apenas linhas onde a coluna legada existe
--    (caso a migration seja re-rodada após a coluna `phase` ter sido
--    removida, o UPDATE simplesmente não toca em nada).
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'phase'
  ) THEN
    UPDATE "projects"
    SET "stage" = CASE
      WHEN "phase"::text = 'ESPECIFICACAO' THEN 'BOOTSTRAP'::"ProjectStage"
      WHEN "phase"::text = 'GESTAO'        THEN 'ACTIVE'::"ProjectStage"
      ELSE 'BOOTSTRAP'::"ProjectStage"
    END
    WHERE "stage" IS NULL;
  END IF;
END $$;

-- 4) Backfill defensivo: se algum projeto novo (criado entre passos 2 e 3)
--    não tiver stage, atribui BOOTSTRAP.
UPDATE "projects" SET "stage" = 'BOOTSTRAP' WHERE "stage" IS NULL;

-- 5) Aplica NOT NULL + DEFAULT na coluna `stage`.
ALTER TABLE "projects"
  ALTER COLUMN "stage" SET NOT NULL,
  ALTER COLUMN "stage" SET DEFAULT 'BOOTSTRAP';

-- 6) Drop coluna legada `phase`.
ALTER TABLE "projects" DROP COLUMN IF EXISTS "phase";

-- 7) Drop enum legado `ProjectPhase`. Roda no final, depois de removida
--    qualquer coluna que dependesse dele.
DROP TYPE IF EXISTS "ProjectPhase";
