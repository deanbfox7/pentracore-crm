-- ============================================
-- PENTRACORE WEALTH ENGINE
-- Turns raw CRM data into simple operating views for non-technical users:
--   1) what is worth money
--   2) what is blocked
--   3) what must happen next
--   4) where buyer demand and supplier volume can be matched
-- ============================================

-- Deal processing scorecard
CREATE OR REPLACE VIEW v_pentracore_deal_processing
WITH (security_invoker = true) AS
SELECT
  d.id,
  d.owner_id,
  d.deal_code,
  d.stage,
  d.stage_index,
  d.side,
  d.commodity,
  d.grade_spec,
  d.volume,
  d.uom,
  d.basis,
  d.price_zar_per_mt,
  d.estimated_gmv,
  d.estimated_commission,
  d.probability,
  d.next_action,
  d.blocker,
  d.payment_instrument,
  d.origin_region,
  d.created_at,
  d.updated_at,
  COUNT(DISTINCT dp.id) AS participant_count,
  COUNT(DISTINCT doc.id) AS document_count,
  COUNT(DISTINCT ar.id) AS assay_count,
  COUNT(DISTINCT dt.id) FILTER (WHERE dt.status = 'open') AS open_task_count,
  COUNT(DISTINCT dt.id) FILTER (WHERE dt.status = 'open' AND dt.due_at < now()) AS overdue_task_count,
  CASE
    WHEN d.stage_index < 2 THEN 'Send NCNDA before sharing buyer, seller, mine, price, or chain detail.'
    WHEN d.stage_index < 3 THEN 'Collect KYC pack, authority documents, and sanctions result.'
    WHEN d.stage_index < 4 THEN 'Confirm commodity specification, volume, price basis, and payment instrument.'
    WHEN d.stage_index < 6 THEN 'Secure proof of product, proof of funds, assay, and draft commercial terms.'
    WHEN d.stage_index < 7 THEN 'Execute IMFPA before SPA and lock commission protection.'
    WHEN d.stage_index < 10 THEN 'Drive banking, inspection, logistics, and settlement documents.'
    ELSE 'Move into repeat-deal nurture and open the next order.'
  END AS operating_instruction,
  CASE
    WHEN d.blocker IS NOT NULL AND length(trim(d.blocker)) > 0 THEN 'blocked'
    WHEN COUNT(DISTINCT dt.id) FILTER (WHERE dt.status = 'open' AND dt.due_at < now()) > 0 THEN 'overdue'
    WHEN d.stage_index < 3 THEN 'compliance_gate'
    WHEN d.stage_index >= 4 AND d.probability >= 60 THEN 'hot'
    ELSE 'active'
  END AS processing_status
FROM deals d
LEFT JOIN deal_participants dp ON dp.deal_id = d.id
LEFT JOIN documents doc ON doc.linked_deal_id = d.id
LEFT JOIN assay_results ar ON ar.deal_id = d.id
LEFT JOIN deal_tasks dt ON dt.deal_id = d.id
GROUP BY d.id;

-- Simple daily action queue
CREATE OR REPLACE VIEW v_pentracore_daily_actions
WITH (security_invoker = true) AS
SELECT
  id,
  owner_id,
  deal_code,
  commodity,
  stage_index,
  processing_status,
  COALESCE(NULLIF(next_action, ''), operating_instruction) AS action,
  COALESCE(NULLIF(blocker, ''), '') AS blocker,
  estimated_gmv,
  probability,
  overdue_task_count,
  CASE
    WHEN processing_status = 'blocked' THEN 1
    WHEN processing_status = 'overdue' THEN 2
    WHEN processing_status = 'hot' THEN 3
    WHEN processing_status = 'compliance_gate' THEN 4
    ELSE 5
  END AS priority_rank
FROM v_pentracore_deal_processing;

-- Buyer/supplier matching by commodity and broad grade text.
-- This intentionally stays conservative: humans must verify specs before issuing binding documents.
CREATE OR REPLACE VIEW v_pentracore_supply_demand_match
WITH (security_invoker = true) AS
WITH supply AS (
  SELECT
    owner_id,
    commodity,
    COALESCE(NULLIF(grade_spec, ''), 'Unspecified') AS grade_spec,
    SUM(volume) AS supply_volume_mt,
    COUNT(*) AS supply_deals
  FROM deals
  WHERE side IN ('buy', 'match')
    AND stage_index >= 2
  GROUP BY owner_id, commodity, COALESCE(NULLIF(grade_spec, ''), 'Unspecified')
),
demand AS (
  SELECT
    owner_id,
    commodity,
    COALESCE(NULLIF(grade_spec, ''), 'Unspecified') AS grade_spec,
    SUM(volume) AS demand_volume_mt,
    COUNT(*) AS demand_deals
  FROM deals
  WHERE side IN ('sell', 'match')
    AND stage_index >= 2
  GROUP BY owner_id, commodity, COALESCE(NULLIF(grade_spec, ''), 'Unspecified')
)
SELECT
  COALESCE(s.owner_id, d.owner_id) AS owner_id,
  COALESCE(s.commodity, d.commodity) AS commodity,
  COALESCE(s.grade_spec, d.grade_spec) AS grade_spec,
  COALESCE(s.supply_volume_mt, 0) AS supply_volume_mt,
  COALESCE(d.demand_volume_mt, 0) AS demand_volume_mt,
  COALESCE(d.demand_volume_mt, 0) - COALESCE(s.supply_volume_mt, 0) AS demand_gap_mt,
  COALESCE(s.supply_deals, 0) AS supply_deals,
  COALESCE(d.demand_deals, 0) AS demand_deals
FROM supply s
FULL OUTER JOIN demand d
  ON d.owner_id = s.owner_id
 AND lower(d.commodity) = lower(s.commodity)
 AND lower(d.grade_spec) = lower(s.grade_spec);
