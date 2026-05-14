-- Phase 1: Hybrid Intake Model
-- Adds fields to support WhatsApp/rapid intake with incomplete counterparties
-- Scope: Adds intermediary_chain and source columns to dean_crm.deals
-- Date: 2026-05-14
-- Breaking changes: None (all fields optional/nullable, backwards compatible)

ALTER TABLE dean_crm.deals
  ADD COLUMN IF NOT EXISTS intermediary_chain TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';

-- Add check constraint for source enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deals_source_check'
  ) THEN
    ALTER TABLE dean_crm.deals
      ADD CONSTRAINT deals_source_check
      CHECK (source IN ('whatsapp', 'email', 'phone', 'referral', 'direct', 'spreadsheet', 'other'));
  END IF;
END $$;

-- Index for source filtering (for intake reports)
CREATE INDEX IF NOT EXISTS idx_deals_source ON dean_crm.deals(source);

-- Index for intermediary chain searches
CREATE INDEX IF NOT EXISTS idx_deals_intermediary ON dean_crm.deals(intermediary_chain);
