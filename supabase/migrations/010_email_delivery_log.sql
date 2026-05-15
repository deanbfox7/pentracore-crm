-- Email Delivery Logging
-- Tracks all outbound document delivery attempts (LOI, NCNDA, KYC, IMFPA, SPA)
-- Date: 2026-05-15
-- Scope: New table, no changes to existing tables

CREATE TABLE dean_crm.email_delivery_log (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT NOT NULL REFERENCES dean_crm.deals(id) ON DELETE CASCADE,
  document_id BIGINT REFERENCES dean_crm.deal_documents(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('loi', 'ncnda', 'kyc', 'imfpa', 'spa')),
  recipient_email TEXT NOT NULL,
  recipient_type TEXT CHECK (recipient_type IN ('buyer', 'seller')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  resend_message_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for operational queries
CREATE INDEX idx_email_delivery_deal_id ON dean_crm.email_delivery_log(deal_id);
CREATE INDEX idx_email_delivery_status ON dean_crm.email_delivery_log(status);
CREATE INDEX idx_email_delivery_document_type ON dean_crm.email_delivery_log(document_type);
CREATE INDEX idx_email_delivery_created_at ON dean_crm.email_delivery_log(created_at DESC);

-- Composite index for finding delivery status by deal + type
CREATE INDEX idx_email_delivery_deal_type ON dean_crm.email_delivery_log(deal_id, document_type);
