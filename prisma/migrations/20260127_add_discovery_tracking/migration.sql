-- AlterTable: Add discovery tracking fields to Conversation model
-- ADR-0002: Database-Enforced Progress Tracking

-- Add discoveryState column (JSONB for structured data)
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "discoveryState" JSONB;

-- Add currentQuestion column (tracks which question 1-5 user is on)
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "currentQuestion" INTEGER DEFAULT 1;

-- Add completedQuestions column (array of completed question numbers)
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "completedQuestions" INTEGER[] DEFAULT '{}';

-- Create partial index on currentQuestion (only non-NULL values for discovery phase)
-- Partial index is more efficient since planning/iteration phases have NULL currentQuestion
CREATE INDEX IF NOT EXISTS "conversations_currentQuestion_idx"
  ON "conversations"("currentQuestion")
  WHERE "currentQuestion" IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN "conversations"."discoveryState" IS 'Structured state of discovery process (questions, answers, extracted data)';
COMMENT ON COLUMN "conversations"."currentQuestion" IS 'Current question number (1-5) in discovery flow';
COMMENT ON COLUMN "conversations"."completedQuestions" IS 'Array of question numbers that have been completed';
