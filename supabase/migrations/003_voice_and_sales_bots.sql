-- ============================================
-- Voice Bot & Sales Bot Infrastructure
-- ============================================

-- Voice call sessions tracking
CREATE TABLE IF NOT EXISTS voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL UNIQUE,
  from_phone TEXT NOT NULL,
  to_phone TEXT,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'welcome',
  data JSONB DEFAULT '{}',
  conversation_history JSONB DEFAULT '[]',
  duration_seconds INT,
  recording_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_call_sid ON voice_sessions(call_sid);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_lead_id ON voice_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_created ON voice_sessions(created_at);

-- Outreach history (email, WhatsApp, SMS)
CREATE TABLE IF NOT EXISTS outreach_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms', 'voice')),
  message TEXT,
  sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent',
  response TEXT,
  response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_lead_id ON outreach_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_channel ON outreach_history(channel);
CREATE INDEX IF NOT EXISTS idx_outreach_sent_at ON outreach_history(sent_at);

-- Auto-update updated_at on voice_sessions
CREATE OR REPLACE FUNCTION update_voice_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER voice_sessions_updated_at_trigger
BEFORE UPDATE ON voice_sessions
FOR EACH ROW
EXECUTE FUNCTION update_voice_sessions_updated_at();

-- Add outreach status to crm_leads if not exists
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS outreach_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_outreach_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS response_received BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_crm_leads_outreach_count ON crm_leads(outreach_count);
