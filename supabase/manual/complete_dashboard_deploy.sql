-- ============================================================
-- PENTRACORE CRM COMPLETE SUPABASE DASHBOARD DEPLOY
-- Generated from supabase/migrations
-- Run this whole file in Supabase Dashboard -> SQL Editor.
--
-- RLS note:
-- The original migrations use the placeholder 'dean-user-id'.
-- This generated file replaces it with 00000000-0000-0000-0000-000000000000 so
-- table creation succeeds before your Supabase Auth user exists.
-- After creating your auth user, replace that UUID in policies with
-- your real Authentication -> Users UUID.
-- ============================================================


-- ============================================================
-- 001_init_schemas.sql
-- ============================================================

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

-- ============================================================
-- 002_rls_policies.sql
-- ============================================================

-- ============================================
-- RLS: KNOWLEDGE SCHEMA (All authenticated users READ-ONLY)
-- ============================================

ALTER TABLE pentracore_knowledge.company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE pentracore_knowledge.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pentracore_knowledge.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pentracore_knowledge.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pentracore_knowledge.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pentracore_knowledge.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pentracore_knowledge.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pentracore_knowledge.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pentracore_knowledge.news_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pentracore_knowledge.kpi_dashboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE pentracore_knowledge.knowledge_access ENABLE ROW LEVEL SECURITY;

-- All authenticated users can READ knowledge
CREATE POLICY knowledge_read_all ON pentracore_knowledge.company_info FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY knowledge_read_all ON pentracore_knowledge.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY knowledge_read_all ON pentracore_knowledge.services FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY knowledge_read_all ON pentracore_knowledge.processes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY knowledge_read_all ON pentracore_knowledge.policies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY knowledge_read_all ON pentracore_knowledge.faqs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY knowledge_read_all ON pentracore_knowledge.documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY knowledge_read_all ON pentracore_knowledge.contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY knowledge_read_all ON pentracore_knowledge.news_updates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY knowledge_read_all ON pentracore_knowledge.kpi_dashboard FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY knowledge_access_admin ON pentracore_knowledge.knowledge_access FOR ALL USING (auth.uid() = '00000000-0000-0000-0000-000000000000');

-- Only DEAN can WRITE to knowledge (admin only)
CREATE POLICY knowledge_write_admin ON pentracore_knowledge.company_info FOR INSERT WITH CHECK (auth.uid() = '00000000-0000-0000-0000-000000000000');
CREATE POLICY knowledge_update_admin ON pentracore_knowledge.company_info FOR UPDATE USING (auth.uid() = '00000000-0000-0000-0000-000000000000');
CREATE POLICY knowledge_delete_admin ON pentracore_knowledge.company_info FOR DELETE USING (auth.uid() = '00000000-0000-0000-0000-000000000000');

-- ============================================
-- RLS: CRM SCHEMA (DEAN ONLY)
-- ============================================

ALTER TABLE dean_crm.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dean_crm.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dean_crm.counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE dean_crm.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dean_crm.deal_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE dean_crm.deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE dean_crm.contact_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE dean_crm.task_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE dean_crm.referrals ENABLE ROW LEVEL SECURITY;

-- DEAN only: full access to all CRM tables
CREATE POLICY crm_dean_all ON dean_crm.leads USING (auth.uid() = '00000000-0000-0000-0000-000000000000');
CREATE POLICY crm_dean_all ON dean_crm.opportunities USING (auth.uid() = '00000000-0000-0000-0000-000000000000');
CREATE POLICY crm_dean_all ON dean_crm.counterparties USING (auth.uid() = '00000000-0000-0000-0000-000000000000');
CREATE POLICY crm_dean_all ON dean_crm.deals USING (auth.uid() = '00000000-0000-0000-0000-000000000000');
CREATE POLICY crm_dean_all ON dean_crm.deal_timeline USING (auth.uid() = '00000000-0000-0000-0000-000000000000');
CREATE POLICY crm_dean_all ON dean_crm.deal_documents USING (auth.uid() = '00000000-0000-0000-0000-000000000000');
CREATE POLICY crm_dean_all ON dean_crm.contact_history USING (auth.uid() = '00000000-0000-0000-0000-000000000000');
CREATE POLICY crm_dean_all ON dean_crm.task_log USING (auth.uid() = '00000000-0000-0000-0000-000000000000');
CREATE POLICY crm_dean_all ON dean_crm.referrals USING (auth.uid() = '00000000-0000-0000-0000-000000000000');

-- Deny all others
CREATE POLICY crm_deny_all ON dean_crm.leads FOR ALL USING (FALSE);
CREATE POLICY crm_deny_all ON dean_crm.opportunities FOR ALL USING (FALSE);
CREATE POLICY crm_deny_all ON dean_crm.counterparties FOR ALL USING (FALSE);
CREATE POLICY crm_deny_all ON dean_crm.deals FOR ALL USING (FALSE);
CREATE POLICY crm_deny_all ON dean_crm.deal_timeline FOR ALL USING (FALSE);
CREATE POLICY crm_deny_all ON dean_crm.deal_documents FOR ALL USING (FALSE);
CREATE POLICY crm_deny_all ON dean_crm.contact_history FOR ALL USING (FALSE);
CREATE POLICY crm_deny_all ON dean_crm.task_log FOR ALL USING (FALSE);
CREATE POLICY crm_deny_all ON dean_crm.referrals FOR ALL USING (FALSE);

-- ============================================
-- RLS: AUDIT SCHEMA (READ-ONLY FOR DEAN)
-- ============================================

ALTER TABLE audit.access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.knowledge_changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_read_dean ON audit.access_log FOR SELECT USING (auth.uid() = '00000000-0000-0000-0000-000000000000');
CREATE POLICY audit_read_dean ON audit.knowledge_changelog FOR SELECT USING (auth.uid() = '00000000-0000-0000-0000-000000000000');

-- ============================================================
-- 003_pentracore_seed_data.sql
-- ============================================================

-- ============================================
-- PENTRACORE INTERNATIONAL: SEED DATA
-- Full deployment of company knowledge base
-- ============================================

-- COMPANY INFO
INSERT INTO pentracore_knowledge.company_info (name, description, country, contact_email, contact_phone, website, founded_date) VALUES
('PentraCore International', 'Africa''s premier mineral brokerage firm. We connect verified buyers and sellers of high-grade minerals, commodities, and precious resources across the African continent.', 'South Africa', 'info@pentracore.co.za', '+27-11-555-0100', 'https://pentracore.co.za', '2015-03-15');

-- PRODUCTS (Mineral Commodities)
INSERT INTO pentracore_knowledge.products (name, category, description, specs, certifications, pricing_per_unit, unit) VALUES
('Premium Grade Iron Ore (Fe 65%)', 'Iron Ore', 'High-grade iron ore with 65% iron content, low impurities. ICMM certified sourcing.', '{"fe_content": "65%", "silica_max": "8%", "phosphorus_max": "0.1%", "moisture": "6-8%"}', '{"ICMM", "ISO9001", "FSQS"}', 85.00, 'per_tonne'),
('Cobalt Concentrate (Grade A)', 'Cobalt', 'Refined cobalt concentrate suitable for battery manufacturing and electronics. Battery-grade purity.', '{"cobalt_content": "98.5%", "impurities": "<0.5%"}', '{"LBMA", "ICMM", "LBMA-certified"}', 18500.00, 'per_tonne'),
('Gold Bullion (99.99%)', 'Precious Metals', 'Investment-grade gold bullion, certified by London Bullion Market Association.', '{"purity": "99.99%", "form": "bars", "weight_options": "1kg, 10kg, 100g"}', '{"LBMA", "GoldMark", "ISO4217"}', 62000.00, 'per_kg'),
('Copper Cathode (Grade A)', 'Copper', 'Electrolytic copper cathode, 99.99% purity. COMEX/LME compliant.', '{"copper_content": "99.99%", "oxygen_max": "200ppm"}', '{"COMEX", "LME", "ISO8", "ASTM"}', 9500.00, 'per_tonne'),
('Lithium Carbonate (Battery Grade)', 'Lithium', 'Battery-grade lithium carbonate for EV manufacturing. ICMM sourced.', '{"li2co3_content": "99.5%", "nacl_max": "500ppm", "moisture": "<0.5%"}', '{"ICMM", "EV-certified", "ISO9001"}', 18000.00, 'per_tonne'),
('Aluminum Ingot (99.7%)', 'Aluminum', 'Primary aluminum ingot suitable for aerospace and automotive applications.', '{"aluminum_content": "99.7%", "impurities": "<0.3%"}', '{"LME", "ISO8545"}', 2800.00, 'per_tonne'),
('Tin Ingot (Grade A)', 'Tin', 'High-purity tin ingot for electronics and solder manufacturing.', '{"tin_content": "99.95%", "bismuth_max": "0.05%"}', '{"LME", "LBMA"}', 28000.00, 'per_tonne'),
('Diamond Rough (Grade 1)', 'Diamonds', 'Conflict-free rough diamonds from certified African sources. Kimberley-certified.', '{"origin": "West Africa", "certification": "Kimberley"}', '{"Kimberley-Process", "ICMM", "GIA-verified"}', 350.00, 'per_carat');

-- SERVICES
INSERT INTO pentracore_knowledge.services (name, description, process_steps, timeline_days) VALUES
('Mineral Brokerage & Facilitation', 'Full-service brokerage connecting verified buyers and sellers. We handle sourcing, KYC verification, contract negotiation, and settlement coordination.', '{"NCNDA signature", "KYC verification", "Product inspection", "Contract negotiation", "Settlement coordination"}', 45),
('Know Your Customer (KYC) Verification', 'Comprehensive KYC assessment of counterparties. We verify company registration, beneficial ownership, financial standing, and regulatory compliance.', '{"Document collection", "Background verification", "Regulatory checks", "Financial assessment", "Risk scoring"}', 14),
('Contract & Legal Support', 'Drafting and review of NCNDA, IMFPA, and SPA agreements. Negotiation support and escrow coordination.', '{"NCNDA drafting", "IMFPA preparation", "SPA review", "Escrow setup", "Settlement execution"}', 21),
('Market Intelligence & Sourcing', 'Real-time commodity price tracking, market analysis, and supplier sourcing across African mineral networks.', '{"Market research", "Supplier identification", "Price analysis", "Logistics planning"}', 7),
('Logistics & Shipping Coordination', 'End-to-end logistics including port coordination, documentation, insurance, and final delivery.', '{"Port coordination", "Insurance arrangement", "Documentation prep", "Shipping coordination"}', 30);

-- PROCESSES (Deal Flow)
INSERT INTO pentracore_knowledge.processes (name, stage_order, description, requirements, timeline_days) VALUES
('NCNDA (Non-Circumvention, Non-Disclosure Agreement)', 1, 'Initial legal protection. All parties sign NCNDA before any details are shared.', '{"Company identification", "Legal representative assignment", "Signature authority verification"}', 3),
('KYC (Know Your Customer)', 2, 'Comprehensive background and financial verification of both buyer and seller.', '{"Corporate registration", "UBO documentation", "Bank statements (6 months)", "Trade references", "Government ID"}', 10),
('IMFPA (Intermediate Financial & Performance Agreement)', 3, 'Proof of funds and performance capability. Buyer shows financial capacity; seller confirms product availability and specs.', '{"Bank statement (recent)", "Product certification", "Inspection report", "Performance commitment letter"}', 7),
('SPA (Sales & Purchase Agreement)', 4, 'Final binding contract with terms, pricing, payment, and delivery details.', '{"Final pricing agreed", "Payment terms confirmed", "Delivery schedule set", "All legal review complete"}', 5),
('Payment & Delivery', 5, 'Execution: Payment processed, goods delivered, transaction settled.', '{"Escrow funds ready", "Transport arranged", "Final inspection completed", "Delivery schedule confirmed"}', 14);

-- POLICIES
INSERT INTO pentracore_knowledge.policies (name, category, content, version, effective_date) VALUES
('Non-Circumvention Policy', 'Legal', 'All parties must conduct business exclusively through PentraCore as the broker. Direct contact between buyer and seller outside of NCNDA scope is strictly prohibited.', 2, '2023-01-01'),
('KYC & AML Compliance', 'Compliance', 'All counterparties must pass KYC verification before proceeding beyond NCNDA stage. No exceptions. We adhere to FATF AML/CFT standards.', 3, '2024-01-01'),
('Conflict of Interest Policy', 'Ethics', 'PentraCore does not act as buyer or seller. We are facilitators only. No personal commodity trading by team members.', 1, '2015-03-15'),
('Commission Structure', 'Financial', 'Standard brokerage commission: 2-3% of deal value split equally between buyer and seller sides. Negotiable for high-volume deals.', 4, '2023-06-01'),
('Data Protection & Privacy', 'Compliance', 'All client data is encrypted and stored securely. GDPR-compliant. Client information is never shared without written consent.', 2, '2024-05-01'),
('Deal Documentation Requirements', 'Operational', 'All deals must have: signed NCNDA, KYC verification, IMFPA proof, certified product specs, SPA, and delivery documentation. No exceptions.', 2, '2023-08-01');

-- FAQS
INSERT INTO pentracore_knowledge.faqs (question, answer, category, audience) VALUES
('What is an NCNDA and why is it required?', 'NCNDA (Non-Circumvention, Non-Disclosure Agreement) is a legal contract that protects all parties. It prevents buyers and sellers from bypassing our brokerage and ensures confidentiality. Every deal starts with NCNDA—no exceptions.', 'Legal', 'all'),
('How long does the NCNDA → SPA process take?', 'Typically 30-45 days from NCNDA to SPA signing, depending on KYC complexity and responsiveness of parties. NCNDA (3d) → KYC (10d) → IMFPA (7d) → SPA (5d).', 'Process', 'all'),
('What is IMFPA and why do you need it before SPA?', 'IMFPA (Intermediate Financial & Performance Agreement) is proof that the buyer has funds and the seller has verified product. It must come BEFORE SPA to prevent fraudulent deals. This is non-negotiable.', 'Process', 'all'),
('What does PentraCore do as a broker?', 'We connect verified buyers and sellers, ensure all parties are legitimate (KYC), draft and review contracts, coordinate product verification, and oversee settlement. We never hold inventory or act as principal.', 'General', 'all'),
('What commodities does PentraCore broker?', 'Primary focus: Iron ore, cobalt, copper, lithium, aluminum, tin, gold, and diamonds. We also facilitate specialty minerals and precious metals on case-by-case basis.', 'Products', 'all'),
('What is your commission structure?', 'Standard brokerage commission is 2-3% of total deal value, split equally between buyer and seller. For high-volume or strategic deals, commissions are negotiable.', 'Financial', 'all'),
('Is PentraCore a LBMA/LME member?', 'We work with LBMA and LME certified suppliers and buyers. All precious metals trades are LBMA-compliant. We are not a direct exchange member, but all transactions meet exchange standards.', 'Compliance', 'all'),
('How do you verify the legitimacy of sellers?', 'Comprehensive KYC process: we verify company registration, beneficial ownership, trade history, bank references, and conduct background checks. We also visit mining/production sites when possible.', 'KYC', 'all'),
('What happens if a deal falls through after SPA?', 'Once SPA is signed, both parties are legally bound. Termination requires mutual agreement or force majeure event. PentraCore mediates disputes to reach resolution.', 'Legal', 'all');

-- CONTACTS (Team)
INSERT INTO pentracore_knowledge.contacts (name, role, email, phone, bio, is_public) VALUES
('Dean Fox', 'Founder & CEO', 'dean@pentracore.co.za', '+27-11-555-0101', 'Founder and principal broker. 15+ years in African mineral trade. Specializes in high-value commodity facilitation and counterparty verification.', true),
('Alex Morrison', 'Head of KYC & Compliance', 'alex@pentracore.co.za', '+27-11-555-0102', 'Leads all Know Your Customer verification and AML compliance. 10+ years in regulatory compliance across SADC region.', true),
('Paul Richards', 'Senior Trade Finance Officer', 'paul@pentracore.co.za', '+27-11-555-0103', 'Manages all contract negotiation and settlement coordination. Experienced in LC, escrow, and complex payment structures.', true),
('Barry Okonkwo', 'Commodities Analyst', 'barry@pentracore.co.za', '+27-11-555-0104', 'Real-time market pricing, supply chain logistics, and product specification verification.', true),
('Support Team', 'Client Support', 'support@pentracore.co.za', '+27-11-555-0100', 'General inquiries, documentation, and administrative support.', true);

-- NEWS & UPDATES
INSERT INTO pentracore_knowledge.news_updates (title, content, category) VALUES
('PentraCore Launches Enhanced Digital Portal', 'New shareholder portal provides real-time commodity pricing, deal pipeline visibility, and KYC status tracking. Login at portal.pentracore.co.za', 'Product Launch'),
('Iron Ore Market Surge: Prices Up 18% YTD', 'African iron ore prices continue upward trajectory. PentraCore currently facilitating 12 major deals in this commodity class.', 'Market Update'),
('Cobalt Supply Chain Stabilization', 'New partnerships with DRC and Zambian suppliers have improved cobalt availability. Expect tighter pricing but increased volume capacity.', 'Market Update'),
('IMFPA Enforcement: Key Policy Update', 'Reminder: All SPA agreements MUST be preceded by verified IMFPA documentation. No exceptions. This protects all parties against fraud.', 'Policy'),
('Lithium for EV: Strategic Growth Area', 'With global EV demand surging, PentraCore is expanding lithium sourcing network. Current focus on battery-grade supply to Asian manufacturers.', 'Market Update');

-- KPI DASHBOARD
INSERT INTO pentracore_knowledge.kpi_dashboard (metric_name, metric_value, unit, period) VALUES
('Total Deals Facilitated (YTD)', 47, 'deals', '2026 YTD'),
('Average Deal Value', 12500000, 'USD', '2026 YTD'),
('Total Transaction Volume', 587500000, 'USD', '2026 YTD'),
('Average Commission per Deal', 250000, 'USD', '2026 YTD'),
('KYC Verification Success Rate', 94, 'percent', '2026 YTD'),
('Average Time NCNDA to SPA', 38, 'days', '2026 YTD'),
('Active Counterparty Network', 320, 'verified parties', '2026 Q2'),
('Primary Commodities Traded', 8, 'types', '2026 YTD');

-- KNOWLEDGE ACCESS
INSERT INTO pentracore_knowledge.knowledge_access (email, display_name, access_type, is_active, notes) VALUES
('deanbfox@gmail.com', 'Dean Fox', 'admin', TRUE, 'Owner access');


-- ============================================================
-- PUBLIC DISPLAY TABLE: SUPABASE TABLE EDITOR FRIENDLY VIEW
-- ============================================================

DROP TABLE IF EXISTS public.pentracore_data_room;

CREATE TABLE public.pentracore_data_room (
  id BIGSERIAL PRIMARY KEY,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  summary TEXT,
  metric_value TEXT,
  sort_order INT DEFAULT 0,
  source_schema TEXT,
  source_table TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.pentracore_data_room (section, title, category, summary, metric_value, sort_order, source_schema, source_table)
SELECT
  'Company',
  name,
  country,
  description,
  CONCAT_WS(' | ', contact_email, contact_phone, website),
  10,
  'pentracore_knowledge',
  'company_info'
FROM pentracore_knowledge.company_info;

INSERT INTO public.pentracore_data_room (section, title, category, summary, metric_value, sort_order, source_schema, source_table)
SELECT
  'Products',
  name,
  category,
  description,
  CONCAT('$', pricing_per_unit::TEXT, ' ', unit),
  20,
  'pentracore_knowledge',
  'products'
FROM pentracore_knowledge.products;

INSERT INTO public.pentracore_data_room (section, title, category, summary, metric_value, sort_order, source_schema, source_table)
SELECT
  'Services',
  name,
  'Service',
  description,
  CONCAT(timeline_days::TEXT, ' days'),
  30,
  'pentracore_knowledge',
  'services'
FROM pentracore_knowledge.services;

INSERT INTO public.pentracore_data_room (section, title, category, summary, metric_value, sort_order, source_schema, source_table)
SELECT
  'Deal Process',
  name,
  CONCAT('Stage ', stage_order::TEXT),
  description,
  CONCAT(timeline_days::TEXT, ' days'),
  40 + stage_order,
  'pentracore_knowledge',
  'processes'
FROM pentracore_knowledge.processes;

INSERT INTO public.pentracore_data_room (section, title, category, summary, metric_value, sort_order, source_schema, source_table)
SELECT
  'Policies',
  name,
  category,
  content,
  CONCAT('v', version::TEXT, ' effective ', effective_date::TEXT),
  50,
  'pentracore_knowledge',
  'policies'
FROM pentracore_knowledge.policies;

INSERT INTO public.pentracore_data_room (section, title, category, summary, metric_value, sort_order, source_schema, source_table)
SELECT
  'FAQs',
  question,
  category,
  answer,
  audience,
  60,
  'pentracore_knowledge',
  'faqs'
FROM pentracore_knowledge.faqs;

INSERT INTO public.pentracore_data_room (section, title, category, summary, metric_value, sort_order, source_schema, source_table)
SELECT
  'Contacts',
  name,
  role,
  bio,
  CONCAT_WS(' | ', email, phone),
  70,
  'pentracore_knowledge',
  'contacts'
FROM pentracore_knowledge.contacts;

INSERT INTO public.pentracore_data_room (section, title, category, summary, metric_value, sort_order, source_schema, source_table)
SELECT
  'News',
  title,
  category,
  content,
  published_date::DATE::TEXT,
  80,
  'pentracore_knowledge',
  'news_updates'
FROM pentracore_knowledge.news_updates;

INSERT INTO public.pentracore_data_room (section, title, category, summary, metric_value, sort_order, source_schema, source_table)
SELECT
  'KPIs',
  metric_name,
  period,
  unit,
  metric_value::TEXT,
  90,
  'pentracore_knowledge',
  'kpi_dashboard'
FROM pentracore_knowledge.kpi_dashboard;

ALTER TABLE public.pentracore_data_room ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pentracore_data_room_read_all ON public.pentracore_data_room;
CREATE POLICY pentracore_data_room_read_all
ON public.pentracore_data_room
FOR SELECT
USING (true);

GRANT SELECT ON public.pentracore_data_room TO anon, authenticated;

-- Quick check after running:
-- SELECT section, title, category, metric_value
-- FROM public.pentracore_data_room
-- ORDER BY sort_order, id;
