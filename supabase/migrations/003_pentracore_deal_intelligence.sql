-- ============================================
-- PENTRACORE DEAL INTELLIGENCE (premium CRM)
-- Extends the existing CRM MVP with:
--  - deals (canonical pipeline object)
--  - mandates (authority to act)
--  - documents (catalog + AI summaries)
--  - participants ACL (confidentiality gates)
--  - tasks, logistics, constraints, assays, commissions
-- ============================================

-- NOTE:
-- 1) This migration assumes `profiles`, `companies`, and `contacts` already exist.
-- 2) Confidentiality enforcement is implemented via RLS + stage-index visibility gates.

-- --------------------------------------------
-- Deals (canonical pipeline object)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Human friendly identifier from your tracker: "CHR-CONC-12M-001"
  deal_code TEXT NOT NULL UNIQUE,

  -- Pipeline stage (canonical text + stage_index for gating)
  stage TEXT NOT NULL DEFAULT 'inquiry',
  stage_index INTEGER NOT NULL DEFAULT 1,

  side TEXT NOT NULL DEFAULT 'buy', -- buy | sell | match

  commodity TEXT NOT NULL DEFAULT '',
  grade_spec TEXT,

  origin_country TEXT,
  origin_region TEXT,
  destination_country TEXT,
  destination_port TEXT,

  volume NUMERIC(16,2) DEFAULT 0,
  uom TEXT DEFAULT 'MT',

  basis TEXT,
  price_zar_per_mt NUMERIC(18,2),
  currency TEXT DEFAULT 'ZAR',
  incoterm TEXT,
  payment_instrument TEXT,
  term TEXT,

  estimated_gmv NUMERIC(18,2),
  commission_gross_pct NUMERIC(8,4),
  pentra_commission_pct NUMERIC(8,4),
  estimated_commission NUMERIC(18,2),
  probability NUMERIC(6,2),

  next_action TEXT,
  blocker TEXT,

  -- Simple audit timestamps (optional but useful for executive views)
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Confidentiality level: keep strict by default
  confidentiality_level TEXT NOT NULL DEFAULT 'strict'
);

CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_index ON deals(stage_index);
CREATE INDEX IF NOT EXISTS idx_deals_commodity ON deals(commodity);
CREATE INDEX IF NOT EXISTS idx_deals_origin_country ON deals(origin_country);

-- --------------------------------------------
-- Deal participants (buyer/seller/etc) with ACL gating
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS deal_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  role TEXT NOT NULL, -- buyer | seller | mandate | investor | refinery | logistics | intermediary | operator

  -- If true: partner name is masked until the deal reaches the required stage_index
  mask_before_stage BOOLEAN NOT NULL DEFAULT true,
  visibility_stage_index INTEGER NOT NULL DEFAULT 6, -- default: reveal around SPA/contracts stage

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_participants_deal_id ON deal_participants(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_participants_company_id ON deal_participants(company_id);
CREATE INDEX IF NOT EXISTS idx_deal_participants_role ON deal_participants(role);

-- --------------------------------------------
-- Mandates / authorities
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mandate_type TEXT NOT NULL DEFAULT 'buy-side', -- buy-side | sell-side | dual | facilitator

  issuing_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  issued_to_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  commodity TEXT,
  volume NUMERIC(16,2),
  uom TEXT DEFAULT 'MT',
  validity_start DATE,
  validity_end DATE,

  exclusive BOOLEAN DEFAULT false,
  paymaster_escrow TEXT,

  status TEXT NOT NULL DEFAULT 'draft', -- draft | out_for_sig | signed | expired | cancelled

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------
-- Documents catalog + AI summaries
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  doc_type TEXT NOT NULL DEFAULT 'other', -- NCNDA | LOI | IMFPA | SPA | Assay | COA | BL | etc.
  name TEXT NOT NULL,
  version TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | sent | signed | expired | superseded

  expiry_date DATE,
  linked_deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  linked_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  linked_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Supabase Storage object path (not a public URL)
  storage_object_path TEXT,

  -- AI extraction output (plain text)
  ai_extracted_summary TEXT,
  visibility_stage_index INTEGER NOT NULL DEFAULT 2,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_linked_deal_id ON documents(linked_deal_id);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents(doc_type);

-- --------------------------------------------
-- Deal tasks / next actions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS deal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium', -- high | medium | low
  status TEXT NOT NULL DEFAULT 'open', -- open | done | snoozed | cancelled
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_tasks_owner_id ON deal_tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_deal_id ON deal_tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_due_at ON deal_tasks(due_at);

-- --------------------------------------------
-- Logistics & constraints (what blocks execution)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS logistics_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  origin_country TEXT,
  origin_port TEXT,
  destination_country TEXT,
  destination_port TEXT,

  transport_method TEXT, -- road | rail | sea | air | mixed
  route_notes TEXT,
  bottleneck_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  country TEXT,
  constraint_type TEXT NOT NULL DEFAULT 'regulatory', -- regulatory | permitting | sanctions | customs | other
  details TEXT,
  permits_required BOOLEAN DEFAULT false,
  permit_names TEXT[],
  severity TEXT NOT NULL DEFAULT 'medium', -- low | medium | high

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logistics_routes_deal_id ON logistics_routes(deal_id);
CREATE INDEX IF NOT EXISTS idx_constraints_deal_id ON constraints(deal_id);

-- --------------------------------------------
-- Assays / grade results
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS assay_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  commodity TEXT,
  grade_value TEXT, -- keep flexible (e.g., "32.8% Au 90-95%") until your taxonomy is finalized
  units TEXT,
  tested_at DATE,
  test_source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assay_results_deal_id ON assay_results(deal_id);

-- --------------------------------------------
-- Commissions (IMFPA splits etc.)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,

  recipient_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  recipient_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'pentra_core', -- mandate-holder | introducer | co-broker | paymaster | pentra_core

  gross_pct NUMERIC(8,4),
  split_pct NUMERIC(8,4),
  trigger_event TEXT,

  amount_due NUMERIC(18,2),
  status TEXT NOT NULL DEFAULT 'pending', -- pending | invoiced | paid | disputed

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commissions_deal_id ON commissions(deal_id);

-- --------------------------------------------
-- Pricebook (commodity pricing reference)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS pricebook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  commodity TEXT NOT NULL,
  grade TEXT,
  basis TEXT,
  price_zar_per_mt NUMERIC(18,2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  pay_instrument TEXT,
  source TEXT,
  as_of_date DATE DEFAULT now()::date,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricebook_commodity ON pricebook(commodity);

-- --------------------------------------------
-- RLS setup + policies
-- --------------------------------------------
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE assay_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricebook ENABLE ROW LEVEL SECURITY;

-- Helper rule:
-- Admin/sales_manager can always access.
-- Others can access only if:
--   - they own the record (owner_id)
--   - AND any deal-based visibility gates are satisfied.

-- Deals: owner can always see; managers/admin can see all owned by them (owner-based).
CREATE POLICY "Deals: owner can manage" ON deals
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Deals: admin/sales_manager can select" ON deals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','sales_manager')
    )
  );

-- Participants: stage-gated for non-admin roles
CREATE POLICY "Deal participants: owner can read" ON deal_participants
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Deal participants: stage-gated read" ON deal_participants
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin','sales_manager')
      )
    )
    OR (
      -- For sales_rep/viewer: gate by stage_index unless admin/manager
      EXISTS (
        SELECT 1
        FROM deals d
        WHERE d.id = deal_participants.deal_id
          AND d.owner_id = auth.uid()
          AND d.stage_index >= deal_participants.visibility_stage_index
      )
    )
  );

-- Non-select policies
CREATE POLICY "Deal participants: owner can write" ON deal_participants
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Documents: stage-gated by linked deal
CREATE POLICY "Documents: owner can manage" ON documents
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Documents: stage-gated select" ON documents
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin','sales_manager')
      )
    )
    OR (
      linked_deal_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM deals d
        WHERE d.id = documents.linked_deal_id
          AND d.owner_id = auth.uid()
          AND d.stage_index >= documents.visibility_stage_index
      )
    )
    OR (
      linked_deal_id IS NULL
      AND owner_id = auth.uid()
    )
  );

-- Deal tasks/logistics/constraints/assays/commissions: owner manage + manager/admin can view all owned records
CREATE POLICY "Deal tasks: owner can manage" ON deal_tasks
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Deal tasks: stage-gated select" ON deal_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','sales_manager')
    )
    OR (
      deal_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM deals d
        WHERE d.id = deal_tasks.deal_id
          AND d.owner_id = auth.uid()
          AND d.stage_index >= 2
      )
    )
  );

CREATE POLICY "Logistics routes: owner can manage" ON logistics_routes
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Logistics routes: admin/sales_manager can select" ON logistics_routes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','sales_manager')
    )
  );

CREATE POLICY "Constraints: owner can manage" ON constraints
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Constraints: admin/sales_manager can select" ON constraints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','sales_manager')
    )
  );

CREATE POLICY "Assay results: owner can manage" ON assay_results
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Assay results: admin/sales_manager can select" ON assay_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','sales_manager')
    )
  );

CREATE POLICY "Commissions: owner can manage" ON commissions
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Commissions: admin/sales_manager can select" ON commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','sales_manager')
    )
  );

CREATE POLICY "Pricebook: owner can manage" ON pricebook
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Read for managers/admin regardless of record owner, still limited to stage gates at the app layer.
-- (Kept permissive enough for dashboard; strict partner masking stays in deal_participants + documents.)
CREATE POLICY "Pricebook: admin can select" ON pricebook
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','sales_manager')
    )
  );

-- --------------------------------------------
-- Storage bucket for document uploads
-- --------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

