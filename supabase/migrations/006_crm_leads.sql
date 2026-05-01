-- Public lead capture from PentraCore Trade Intelligence.
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_type TEXT NOT NULL,
  volume TEXT NOT NULL,
  country_of_origin TEXT NOT NULL,
  role TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  conversation_history JSONB NOT NULL DEFAULT '[]',
  source TEXT NOT NULL DEFAULT 'lead_chat',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_commodity ON crm_leads(commodity_type);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads(created_at DESC);

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM leads: service role can manage" ON crm_leads
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
