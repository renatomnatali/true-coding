-- Rollback for migration: 20260127_add_discovery_tracking
-- ADR-0002: Database-Enforced Progress Tracking
--
-- IMPORTANT: Only run this if you need to revert the discovery tracking feature
-- This will NOT delete data - columns will be dropped but PostgreSQL keeps backups
-- via WAL (Write-Ahead Logging) for point-in-time recovery

-- Drop index first (index depends on column)
DROP INDEX IF EXISTS "conversations_currentQuestion_idx";

-- Drop columns (use IF EXISTS for safety)
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "completedQuestions";
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "currentQuestion";
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "discoveryState";

-- Verify rollback success
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
  AND column_name IN ('discoveryState', 'currentQuestion', 'completedQuestions');

-- Expected result: 0 rows (columns should be gone)

-- NOTE: Existing conversations in progress will lose discovery state
-- Recommend migrating users to new flow before rollback, or notifying them
-- of data loss.

-- RECOVERY STRATEGY:
-- If you need to restore data after accidental rollback:
-- 1. Stop application immediately
-- 2. Contact DBA for WAL-based point-in-time recovery
-- 3. Restore to timestamp before rollback execution
-- 4. Re-run forward migration to restore schema
