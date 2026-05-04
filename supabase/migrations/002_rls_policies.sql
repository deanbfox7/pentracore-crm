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
CREATE POLICY knowledge_access_admin ON pentracore_knowledge.knowledge_access FOR ALL USING (auth.uid() = 'dean-user-id');

-- Only DEAN can WRITE to knowledge (admin only)
CREATE POLICY knowledge_write_admin ON pentracore_knowledge.company_info FOR INSERT WITH CHECK (auth.uid() = 'dean-user-id');
CREATE POLICY knowledge_update_admin ON pentracore_knowledge.company_info FOR UPDATE USING (auth.uid() = 'dean-user-id');
CREATE POLICY knowledge_delete_admin ON pentracore_knowledge.company_info FOR DELETE USING (auth.uid() = 'dean-user-id');

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
CREATE POLICY crm_dean_all ON dean_crm.leads USING (auth.uid() = 'dean-user-id');
CREATE POLICY crm_dean_all ON dean_crm.opportunities USING (auth.uid() = 'dean-user-id');
CREATE POLICY crm_dean_all ON dean_crm.counterparties USING (auth.uid() = 'dean-user-id');
CREATE POLICY crm_dean_all ON dean_crm.deals USING (auth.uid() = 'dean-user-id');
CREATE POLICY crm_dean_all ON dean_crm.deal_timeline USING (auth.uid() = 'dean-user-id');
CREATE POLICY crm_dean_all ON dean_crm.deal_documents USING (auth.uid() = 'dean-user-id');
CREATE POLICY crm_dean_all ON dean_crm.contact_history USING (auth.uid() = 'dean-user-id');
CREATE POLICY crm_dean_all ON dean_crm.task_log USING (auth.uid() = 'dean-user-id');
CREATE POLICY crm_dean_all ON dean_crm.referrals USING (auth.uid() = 'dean-user-id');

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

CREATE POLICY audit_read_dean ON audit.access_log FOR SELECT USING (auth.uid() = 'dean-user-id');
CREATE POLICY audit_read_dean ON audit.knowledge_changelog FOR SELECT USING (auth.uid() = 'dean-user-id');
