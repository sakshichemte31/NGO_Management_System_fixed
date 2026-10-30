-- Upgrade script for databases created from an older schema.sql (safe to re-run).
BEGIN;
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
ALTER TABLE proposals ADD CONSTRAINT proposals_status_check
  CHECK (status IN ('Draft','Submitted','Under Review','Financial Review','Approved','Rejected','Withdrawn'));
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS estimated_budget numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_beneficiaries text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS geography text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS review_notes text NOT NULL DEFAULT '';
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'Community',
  ADD COLUMN IF NOT EXISTS organizer text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS budget numeric(14,2) NOT NULL DEFAULT 0;
COMMIT;
