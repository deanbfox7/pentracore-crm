-- Shareholder portal identities for personalised chat access.
CREATE TABLE IF NOT EXISTS shareholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'shareholder',
  portfolio_deal_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shareholders_email ON shareholders(email);
CREATE INDEX IF NOT EXISTS idx_shareholders_portfolio_deals ON shareholders USING GIN(portfolio_deal_ids);

ALTER TABLE shareholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shareholders: service role can manage" ON shareholders
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

INSERT INTO shareholders (id, name, email, role, portfolio_deal_ids)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Dean Fox', 'dean.shareholder@example.com', 'founding_shareholder', '{}'),
  ('22222222-2222-4222-8222-222222222222', 'Amina Patel', 'amina.shareholder@example.com', 'shareholder', '{}'),
  ('33333333-3333-4333-8333-333333333333', 'Michael van Wyk', 'michael.shareholder@example.com', 'portfolio_partner', '{}'),
  ('44444444-4444-4444-8444-444444444444', 'Lerato Mokoena', 'lerato.shareholder@example.com', 'shareholder', '{}'),
  ('55555555-5555-4555-8555-555555555555', 'Sarah Jacobs', 'sarah.shareholder@example.com', 'strategic_investor', '{}'),
  ('66666666-6666-4666-8666-666666666666', 'Thabo Dlamini', 'thabo.shareholder@example.com', 'shareholder', '{}')
ON CONFLICT (email) DO NOTHING;
