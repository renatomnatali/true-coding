-- AlterTable: Add discovery tracking fields to Conversation model
-- ADR-0002: Database-Enforced Progress Tracking

-- Add discoveryState column (JSONB for structured data)
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "discoveryState" JSONB;

-- Add currentQuestion column (tracks which question 1-5 user is on)
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "currentQuestion" INTEGER DEFAULT 1;

-- Add completedQuestions column (array of completed question numbers)
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "completedQuestions" INTEGER[] DEFAULT '{}';

-- Create index on currentQuestion for efficient queries
CREATE INDEX IF NOT EXISTS "conversations_currentQuestion_idx" ON "conversations"("currentQuestion");

-- Add comment for documentation
COMMENT ON COLUMN "conversations"."discoveryState" IS 'Structured state of discovery process (questions, answers, extracted data)';
COMMENT ON COLUMN "conversations"."currentQuestion" IS 'Current question number (1-5) in discovery flow';
COMMENT ON COLUMN "conversations"."completedQuestions" IS 'Array of question numbers that have been completed';
