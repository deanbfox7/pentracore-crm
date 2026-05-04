-- PentraCore deal intake assistant MVP.
-- Extends the existing private CRM deal tables used by the Next.js app.

ALTER TABLE dean_crm.deals
  ADD COLUMN IF NOT EXISTS deal_name TEXT,
  ADD COLUMN IF NOT EXISTS origin_country TEXT,
  ADD COLUMN IF NOT EXISTS target_price DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS counterparty_name TEXT,
  ADD COLUMN IF NOT EXISTS counterparty_email TEXT,
  ADD COLUMN IF NOT EXISTS submitter_name TEXT,
  ADD COLUMN IF NOT EXISTS submitter_email TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

ALTER TABLE dean_crm.deal_documents
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS content TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deal_documents_status_check'
  ) THEN
    ALTER TABLE dean_crm.deal_documents
      ADD CONSTRAINT deal_documents_status_check
      CHECK (status IN ('draft', 'sent', 'signed'))
      NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deal_documents_document_type_check'
  ) THEN
    ALTER TABLE dean_crm.deal_documents
      ADD CONSTRAINT deal_documents_document_type_check
      CHECK (document_type IN ('loi', 'ncnda', 'kyc', 'imfpa', 'spa', 'other'))
      NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS deals_created_at_idx
  ON dean_crm.deals(created_at DESC);

CREATE INDEX IF NOT EXISTS deal_documents_deal_id_idx
  ON dean_crm.deal_documents(deal_id);
