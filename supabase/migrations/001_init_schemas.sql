-- ============================================
-- PENTRACORE KNOWLEDGE SCHEMA (PUBLIC, RLS READ-ONLY)
-- ============================================

CREATE SCHEMA pentracore_knowledge;

CREATE TABLE pentracore_knowledge.company_info (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  country TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  founded_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pentracore_knowledge.products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  specs JSONB,
  certifications TEXT[],
  pricing_per_unit DECIMAL(12,2),
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pentracore_knowledge.services (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  process_steps TEXT[],
  timeline_days INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pentracore_knowledge.processes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  stage_order INT,
  description TEXT,
  requirements TEXT[],
  timeline_days INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pentracore_knowledge.policies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  content TEXT,
  version INT DEFAULT 1,
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pentracore_knowledge.faqs (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  audience TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pentracore_knowledge.documents (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  document_type TEXT,
  content_path TEXT,
  version INT DEFAULT 1,
  is_template BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pentracore_knowledge.contacts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  bio TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pentracore_knowledge.news_updates (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  published_date TIMESTAMPTZ DEFAULT NOW(),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pentracore_knowledge.kpi_dashboard (
  id BIGSERIAL PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,2),
  unit TEXT,
  period TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pentracore_knowledge.knowledge_access (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  access_type TEXT NOT NULL DEFAULT 'shareholder',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEAN'S PRIVATE CRM SCHEMA (ISOLATED, RLS RESTRICT)
-- ============================================

CREATE SCHEMA dean_crm;

CREATE TABLE dean_crm.leads (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  lead_source TEXT,
  lead_status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dean_crm.opportunities (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES dean_crm.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  commodity TEXT,
  tonnage DECIMAL(10,2),
  stage TEXT DEFAULT 'inquiry',
  expected_value DECIMAL(12,2),
  expected_commission DECIMAL(12,2),
  probability_pct INT DEFAULT 0,
  close_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dean_crm.counterparties (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  country TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  kyc_status TEXT DEFAULT 'pending',
  kyc_verified_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dean_crm.deals (
  id BIGSERIAL PRIMARY KEY,
  opportunity_id BIGINT REFERENCES dean_crm.opportunities(id),
  buyer_id BIGINT REFERENCES dean_crm.counterparties(id),
  seller_id BIGINT REFERENCES dean_crm.counterparties(id),
  commodity TEXT NOT NULL,
  tonnage DECIMAL(10,2) NOT NULL,
  price_per_unit DECIMAL(12,2),
  total_value DECIMAL(15,2),
  stage TEXT DEFAULT 'inquiry',
  ncnda_signed_date DATE,
  kyc_approved_date DATE,
  imfpa_signed_date DATE,
  spa_signed_date DATE,
  expected_commission DECIMAL(12,2),
  commission_received DECIMAL(12,2),
  commission_received_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT imfpa_before_spa CHECK (imfpa_signed_date IS NOT NULL OR spa_signed_date IS NULL)
);

CREATE TABLE dean_crm.deal_timeline (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT NOT NULL REFERENCES dean_crm.deals(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT,
  notes TEXT,
  event_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dean_crm.deal_documents (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT NOT NULL REFERENCES dean_crm.deals(id) ON DELETE CASCADE,
  document_type TEXT,
  file_path TEXT,
  signed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dean_crm.contact_history (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES dean_crm.leads(id) ON DELETE CASCADE,
  contact_type TEXT,
  note TEXT,
  contact_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dean_crm.task_log (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES dean_crm.leads(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dean_crm.referrals (
  id BIGSERIAL PRIMARY KEY,
  opportunity_id BIGINT REFERENCES dean_crm.opportunities(id),
  referred_to TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  referral_date TIMESTAMPTZ DEFAULT NOW(),
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT & COMPLIANCE SCHEMA
-- ============================================

CREATE SCHEMA audit;

CREATE TABLE audit.access_log (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  schema_name TEXT,
  table_name TEXT,
  action TEXT,
  row_count INT,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET
);

CREATE TABLE audit.knowledge_changelog (
  id BIGSERIAL PRIMARY KEY,
  schema_name TEXT,
  table_name TEXT,
  row_id BIGINT,
  action TEXT,
  old_data JSONB,
  new_data JSONB,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_deals_stage ON dean_crm.deals(stage);
CREATE INDEX idx_deals_commodity ON dean_crm.deals(commodity);
CREATE INDEX idx_opportunities_status ON dean_crm.opportunities(stage);
CREATE INDEX idx_leads_source ON dean_crm.leads(lead_source);
CREATE INDEX idx_knowledge_products_category ON pentracore_knowledge.products(category);
