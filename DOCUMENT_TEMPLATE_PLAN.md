# Document Template System — Planning Phase

**Last Updated:** 2026-05-06  
**Status:** Planning Only (No Code Changes)  
**Checkpoint:** 2a4cb73 Clean up selected document state and PDF errors

---

## 1. Current Document System Summary

### Working Features
- **5 document types:** LOI, NCNDA, KYC, IMFPA, SPA
- **Generation:** Button-triggered from deal view; routes at `/api/crm/deals/[dealId]/generate-{type}`
- **Storage:** Saved to `dean_crm.deal_documents` table (id, deal_id, document_type, content, status, generated_at)
- **Status workflow:** draft → sent → signed
- **PDF export:** HTML → PDF via html2pdf.js with PentraCore branding header/footer
- **Document view:** View saved document, download as .txt, download as PDF
- **Deal readiness:** Tracks which documents exist and their status

### Current Data Being Used
From `dean_crm.deals`:
- deal.id, commodity, tonnage, price_per_unit, total_value
- stage, notes
- Signature dates: ncnda_signed_date, kyc_approved_date, imfpa_signed_date, spa_signed_date
- Commission: expected_commission

From `dean_crm.counterparties` (buyer + seller):
- name, email
- (not currently: type, country, contact_person, phone, kyc_status, kyc_verified_date)

---

## 2. Problems with Current Hardcoded Templates

### Code Organization
1. **Template logic scattered**
   - LOI: ~80 lines of formatted string in `generate-loi/route.ts`
   - NCNDA: ~50 lines in `generate-ncnda/route.ts`
   - KYC, IMFPA, SPA: Similar scattered pattern
   - Old unused templates also exist in `lib/deal-documents.ts`

2. **Duplicate patterns**
   - Every route: fetch deal → fetch buyer/seller → format string → save
   - No shared helper for counterparty enrichment
   - No shared helper for formatting dates/currency

3. **No version history**
   - Content stored, but not the template version used to generate it
   - If you improve a template, old documents don't inherit changes
   - Can't compare "what this looked like when generated" vs "how we template it now"

### Data Gaps
1. **Missing counterparty details**
   - LOI only uses name/email; doesn't include: country, contact_person, company type
   - KYC asks for documents but doesn't reference counterparty's KYC status from database

2. **Missing company details**
   - PentraCore address, phone, registration, bank details: nowhere in database
   - Hardcoded as "PentraCore International" in PDF and templates
   - No way to localize or update without editing code

3. **No document-specific metadata**
   - No way to attach custom fields (buyer terms, seller terms, payment method, etc.) that don't fit the 5 standard documents
   - Timeline/milestones not included in documents even though `deal_timeline` table exists

4. **Limited business context**
   - IMFPA and SPA are placeholder templates with zero substance
   - No reference to KYC approval status in later documents
   - No indication of "next required action" visible in document itself

### PDF/Branding Issues
1. **Generic PDF header**
   - All documents get same branding; no deal-specific header
   - No space for deal reference number in body text (only in header metadata)

2. **Formatting for signatures**
   - No signature blocks at end of document
   - No checkbox/field areas for manual markup
   - PDF goes straight to download; no print-and-sign workflow hint

3. **Accessibility**
   - Markdown-only content converted to monospace font in PDF
   - Structure not marked up (headers, bold, lists not preserved)
   - Hard to re-edit after PDF export

---

## 3. What a Better Template System Should Do

### Architecture Goals
1. **Centralized template definitions**
   - Move document generation logic from scattered routes into reusable template modules
   - One place to update LOI template affects all future generations
   - Ability to version templates (LOI v1, LOI v2) if business rules change

2. **Template composition**
   - Base template (header, footer, company info, confidentiality notice)
   - Document-type templates (LOI structure, NCNDA clauses, KYC fields)
   - Pluggable sections (signature blocks, payment terms, custom notes)

3. **Rich data model**
   - Template requests specify required fields (commodity, tonnage, buyer.name, buyer.kyc_status, etc.)
   - Clean separation between data gathering and template rendering
   - Support for optional/conditional sections (e.g., "include signature block only if status != draft")

4. **Audit and compliance**
   - Track which template version generated each document
   - Store mapping of "field → data source" for transparency
   - Enable "regenerate with same inputs" to test template updates

### Data Enrichment Goals
1. **Complete counterparty profiles**
   - Fetch and include: country, contact_person, kyc_status, kyc_verified_date, phone
   - Distinguish buyer vs. seller role in document context

2. **PentraCore company info**
   - Add `company_info` table or use knowledge base: address, phone, bank details, registration
   - Pull into all documents automatically

3. **Document-specific fields**
   - Optional: buyer terms, seller terms, payment method, delivery location
   - Each document type gets a "custom fields" section for deal-specific notes
   - Stored separately from template so templates remain stable

4. **Process metadata**
   - Include previous document dates (e.g., "NCNDA signed 2026-05-01" in LOI)
   - Show compliance status inline (e.g., "KYC approved ✓" or "KYC pending")
   - Flag violations (e.g., "Warning: SPA before IMFPA not allowed")

---

## 4. Which Document Types Should Be Improved First

### Priority Order

**Phase 1 (Highest ROI):** LOI
- Used first in deal flow; sets expectations
- Most information-dense; most reuse of deal data
- Single template handles most variation
- Current version already professional; just needs cleanup

**Phase 2:** NCNDA
- Short, high-signal; establishes legal framework
- Should be formalized once, then reused
- Low variation across deals

**Phase 3:** SPA
- Highest stakes; most customization needed
- Too complex for fully auto-generated placeholder
- Likely needs "SPA draft" + "manual edits by lawyer" workflow
- Defer full templating; placeholder is acceptable for now

**Phase 4:** KYC & IMFPA
- KYC: Request form, mostly static; low priority for improvement
- IMFPA: Currently a placeholder; needs business rules before templating

---

## 5. What Data Fields Each Document Should Pull

### Deal Foundation (all documents)
```
deal.id
deal.commodity
deal.tonnage
deal.price_per_unit
deal.total_value
deal.stage
deal.notes
deal.created_at
deal.expected_commission
```

### Counterparty Data (buyer + seller)
```
counterparty.name
counterparty.email
counterparty.type (e.g., "Buyer", "Seller", "Broker")
counterparty.country
counterparty.contact_person
counterparty.phone
counterparty.kyc_status
counterparty.kyc_verified_date
```

### Process Dates (for inclusion in documents)
```
deal.ncnda_signed_date
deal.kyc_approved_date
deal.imfpa_signed_date
deal.spa_signed_date
```

### Company Info (new: needs addition)
```
pentracore.legal_name
pentracore.address
pentracore.phone
pentracore.email
pentracore.website
pentracore.registration_number
pentracore.bank_details (optional, for IMFPA/SPA)
```

### Document-Specific Custom Fields (new: optional)
```
deal_custom_fields.buyer_terms (optional, for SPA context)
deal_custom_fields.seller_terms (optional, for SPA context)
deal_custom_fields.payment_method (optional, for IMFPA/SPA)
deal_custom_fields.delivery_terms (optional, for SPA)
deal_custom_fields.special_conditions (optional, for any document)
```

---

## 6. What Should Remain Manual / Human-Approved

### Never Auto-Generate
1. **Signature blocks**
   - No signature authority can be inferred from database
   - Signatory name, title, date must be added by human
   - PDF should provide blank lines; document generation just ensures space

2. **Legal language customization**
   - NCNDA clauses (governing law, jurisdiction, termination)
   - IMFPA/SPA commercial terms (payment method, delivery logistics, force majeure)
   - These vary by counterparty and should be drafted by legal counsel, not templated

3. **Counterparty-specific notes**
   - Deal notes field captures PentraCore observations
   - But counterparty's own requests/concerns should stay manual/separate
   - Don't autofill unless explicitly approved by Dean

4. **Compliance signoff**
   - KYC approval decision (approved/rejected) must stay manual
   - No auto-approve based on database flags
   - Document can surface status; approval happens in review workflow

### Can Auto-Generate With Human Review
1. **LOI Structure & Commercial Terms**
   - Auto-generate commodity details, tonnage, pricing
   - Human review ensures accuracy before sending

2. **NCNDA Boilerplate**
   - Auto-generate standard clauses + party names
   - Human review for jurisdiction/governing law if custom

3. **KYC Request Form**
   - Auto-generate request letter with counterparty details
   - Human review before sending

---

## 7. Risks to Avoid

### Data Integrity
1. **Stale/inconsistent data**
   - If counterparty.kyc_status changes after LOI generated, document becomes misleading
   - Mitigate: Always fetch fresh data when generating; timestamp in document
   - Store template version + input snapshot so regeneration possible

2. **Missing required fields**
   - SPA generated without buyer.name = broken document
   - Mitigate: Validation before rendering; fail gracefully with field-not-found errors

3. **Process order violations**
   - IMFPA signed before KYC approved? Database constraint prevents, but document might not reflect
   - Mitigate: Check deal.stage/dates and warn in document if out of order

### User Experience
1. **Overwriting edited content**
   - User downloads LOI, edits signature section manually, hits "Generate LOI" again
   - Overwrites edited version in database, not the PDF they edited
   - Mitigate: Only regenerate if user explicitly chooses; add "Are you sure?" if existing doc of type exists

2. **Template rot**
   - Improved templates look great; old documents look bad and confuse stakeholders
   - Mitigate: Don't change template retroactively; add "template_version" to stored documents
   - Provide "regenerate with current template" workflow if desired

3. **PDF rendering surprises**
   - Rich HTML/CSS in template doesn't translate to PDF as expected
   - Mitigate: Design templates with PDF constraints in mind (flat styles, no fancy layouts)
   - Always test generated PDFs before releasing template change

### Business Logic
1. **Compliance gaps**
   - Document suggests next action that violates deal rules
   - E.g., SPA template doesn't warn "IMFPA must be signed first"
   - Mitigate: Check deal.stage in template; include conditional blocks for compliance

2. **Counterparty data leaks**
   - Buyer and seller info merged in same document (reveals each other's terms)
   - Mitigate: Generate separate buyer LOI and seller LOI if needed; default: include both (standard practice)

3. **Commission transparency**
   - LOI shows expected commission; what if deal collapses?
   - Mitigate: Commission is informational for PentraCore internal; not sent to counterparty in standard workflow

---

## 8. Small Next Build Recommendation

### Scope: Minimal, Non-Breaking Changes
**Goal:** Improve LOI template + data richness without touching other documents or PDF export.

### Changes Required

**1. Add missing counterparty fields to LOI generation**
- Fetch buyer.country, seller.country, buyer.contact_person, seller.contact_person
- Include in "PARTIES" section: e.g., "Buyer: XYZ Inc (Nigeria) — Contact: John Smith"

**2. Add PentraCore company info section**
- Add small `company_info` table or static config
- Include in LOI footer: address, phone, website

**3. Improve LOI professional formatting**
- Already well-structured; just tighten spacing and section headers
- Ensure dates are consistently formatted (YYYY-MM-DD)

**4. Add simple conditional: FCO status**
- If `deal.notes` contains "FCO received" or a new `deal.fco_received_date` field, mention in LOI
- Example: "Note: FCO received from seller on 2026-04-30"

**5. Create shared template helpers**
- Extract `formatDate()`, `formatCurrency()`, `fetchCounterparty()` to `lib/template-helpers.ts`
- Reuse in LOI, NCNDA, KYC routes
- No template restructuring; just DRY-ing existing code

**6. Add template version field**
- In `deal_documents` table: add `template_version` column (e.g., "loi_v2")
- Store when document generated
- Future-proof for template evolution

### Why This First?
- LOI is the highest-impact document (sets deal tone)
- Improves data richness without scope creep
- Shared helpers unblock future templates
- Template version prep costs nothing now, invaluable later
- Doesn't break existing workflows

### What Not To Do Yet
- Don't refactor entire template system into a library
- Don't add custom fields table
- Don't touch IMFPA/SPA (placeholder is fine for now)
- Don't change PDF export
- Don't add company_info table (use static config first)

### Effort Estimate
- ~2–4 hours to implement + test
- 0 breaking changes
- Can revert if unexpected issues

---

## 9. Future Phases (Post Phase 1)

### Phase 2A: Template Helpers & Reusability
- Consolidate NCNDA generation using same helpers
- Extract shared document structure (header, footer, sections)
- Add `lib/document-templates.ts` with type-safe template functions

### Phase 2B: Company Info Integration
- Create `pentracore_knowledge.company_info` schema (if not already present)
- Fetch and inject company details into all documents
- Add company_info management UI to knowledge base

### Phase 3: Custom Fields & Versioning
- Add `deal_custom_fields` table for buyer_terms, seller_terms, payment_method, etc.
- Add UI to edit custom fields alongside deal info
- Store with each document for audit

### Phase 4: IMFPA & SPA Overhaul
- Consult legal counsel on standard IMFPA/SPA structures
- Build non-trivial templates with sections for custom terms
- Add signature blocks and workflow hints

---

## 10. Quick Reference: File Locations

### Current Template Code
```
app/api/crm/deals/[dealId]/generate-{loi,ncnda,kyc,imfpa,spa}/route.ts
lib/deal-documents.ts (old, unused templates)
lib/pdf-export.ts
```

### Database
```
dean_crm.deals
dean_crm.counterparties
dean_crm.deal_documents
dean_crm.deal_timeline
```

### Document View/Download
```
app/crm/deals/page.tsx (generateLOI, generateNCNDA, viewSavedDocument, downloadDocumentAsPDF)
```

---

## Approval Checkpoint

This plan is ready for review and approval before implementation begins. Next step: Approval → Phase 1 Implementation.
