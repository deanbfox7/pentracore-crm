-- Deal audit log for stage transitions and compliance tracking
-- Records every stage change with before/after state and audit trail

CREATE TABLE IF NOT EXISTS dean_crm.deal_audit_log (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT NOT NULL REFERENCES dean_crm.deals(id) ON DELETE CASCADE,
  previous_stage TEXT,
  new_stage TEXT NOT NULL,
  action TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookup by deal
CREATE INDEX IF NOT EXISTS deal_audit_log_deal_id_idx
  ON dean_crm.deal_audit_log(deal_id DESC);

-- Index for created_at for timeline queries
CREATE INDEX IF NOT EXISTS deal_audit_log_created_at_idx
  ON dean_crm.deal_audit_log(created_at DESC);

-- Add stage check constraint for audit log
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deal_audit_log_stage_check'
  ) THEN
    ALTER TABLE dean_crm.deal_audit_log
      ADD CONSTRAINT deal_audit_log_stage_check
      CHECK (new_stage IN ('inquiry', 'loi_draft', 'loi_sent', 'ncnda_signed', 'kyc_approved', 'imfpa_signed', 'spa_signed', 'closed_won', 'closed_lost'))
      NOT VALID;
  END IF;
END $$;
