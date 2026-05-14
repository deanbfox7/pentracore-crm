-- Phase 1: Document Lifecycle Enhancement
-- Expands document status workflow to support operational review
-- Scope: Updates CHECK constraint on dean_crm.deal_documents status column
-- Date: 2026-05-14
-- Breaking changes: None (additive; existing draft/sent/signed values remain valid)

-- Remove old constraint and add new one
ALTER TABLE dean_crm.deal_documents
  DROP CONSTRAINT IF EXISTS deal_documents_status_check;

ALTER TABLE dean_crm.deal_documents
  ADD CONSTRAINT deal_documents_status_check
  CHECK (status IN ('draft', 'internal_review', 'approved', 'sent', 'signed', 'rejected'))
  NOT VALID;

-- Validate the constraint without locking
ALTER TABLE dean_crm.deal_documents
  VALIDATE CONSTRAINT deal_documents_status_check;

-- Index for status filtering (used by operational dashboards)
CREATE INDEX IF NOT EXISTS idx_deal_documents_status ON dean_crm.deal_documents(status);
