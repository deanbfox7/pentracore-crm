-- Phase 2: Add deal visibility and accountability fields
-- Scope: Adds 6 new columns to dean_crm.deals table
-- Date: 2026-05-12
-- Breaking changes: None (all fields optional/nullable, backwards compatible)

ALTER TABLE dean_crm.deals
  ADD COLUMN IF NOT EXISTS probability_percent INT DEFAULT 0 CHECK (probability_percent >= 0 AND probability_percent <= 100),
  ADD COLUMN IF NOT EXISTS owner TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS current_bottleneck TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS missing_documents TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS next_action TEXT DEFAULT NULL;

-- Index for owner filtering (used by weekly instructions, deal assignment)
CREATE INDEX IF NOT EXISTS idx_deals_owner ON dean_crm.deals(owner);

-- Index for probability (used by dashboard sorting, deal readiness assessment)
CREATE INDEX IF NOT EXISTS idx_deals_probability ON dean_crm.deals(probability_percent DESC);

-- Index for risk_level (used by risk dashboard, filtering)
CREATE INDEX IF NOT EXISTS idx_deals_risk ON dean_crm.deals(risk_level);
