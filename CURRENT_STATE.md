# PentraCore CRM - Current State (2026-05-05, Updated)

## What Works Now

### Authentication & Access
- Magic link auth via Supabase (all users)
- Master session auth for deanbfox@gmail.com (production-safe with environment checks)
- Row-level security (RLS) on dean_crm schema (Dean only)
- Knowledge base access control via `pentracore_knowledge.knowledge_access` table

### Deal Management
- **Create deals** via `/crm/deals` form
  - Fields: commodity, tonnage, price_per_unit, total_value, stage, expected_commission, notes
  - Associates with buyer_id and seller_id via counterparties table
  - Stores in `dean_crm.deals`

- **View deal pipeline** with stage badges and metrics
  - Display: commodity, tonnage, total value, stage, commission, created date
  - Stage tracking: inquiry → loi_draft → loi_sent → ncnda_signed → kyc_approved → imfpa_signed → spa_signed → closed_won/lost

### KYC Generation & Management
- **Generate KYC** via button on deals page (green button, same row as LOI/NCNDA)
  - POST `/api/crm/deals/[dealId]/generate-kyc`
  - Fetches deal + buyer/seller counterparty details
  - Generates professional KYC checklist with:
    - Transaction details (commodity, tonnage, value)
    - Buyer/seller verification checklists (corporate docs, IDs, addresses)
    - Beneficial ownership verification (UBO identification)
    - AML screening items (OFAC, UN/EU sanctions, PEP checks)
    - Source of funds verification
    - Compliance sign-off section
  - **Saves to `dean_crm.deal_documents`** (status='draft', includes full content)
  - Returns document_id in response

- **Preview KYC** in modal (GET preview-only, no database save)
  - Shows generated checklist before saving

- **Download KYC** as .txt file
  - Both newly generated and previously saved versions

### IMFPA Generation & Management
- **Generate IMFPA** via button on deals page (red button, same row as LOI/NCNDA/KYC)
  - POST `/api/crm/deals/[dealId]/generate-imfpa`
  - Fetches deal + buyer/seller counterparty details
  - Generates professional 10-section IMFPA with:
    - Transaction overview (commodity, quantity, pricing, value)
    - Commission and facilitator fee structure
    - Non-circumvention acknowledgement (24-month survival)
    - Payment terms and triggers (LC, B/L, CoA, KYC compliance)
    - Confidentiality obligations (3-year survival)
    - Representations and warranties (buyer/seller/broker)
    - Governing law and arbitration
    - Termination conditions and survival clauses
    - Signature blocks for all parties
  - **Saves to `dean_crm.deal_documents`** (status='draft', includes full content)
  - Returns document_id in response

- **Preview IMFPA** in modal (GET preview-only, no database save)
  - Shows generated agreement before saving

- **Download IMFPA** as .txt file
  - Both newly generated and previously saved versions

### LOI Generation & Management
- **Generate LOI** via button on deals page
  - POST `/api/crm/deals/[dealId]/generate-loi`
  - Fetches deal + buyer/seller counterparty details
  - Generates professional LOI text with:
    - Date, reference number, buyer/seller names
    - Commodity specs with formatted currency
    - Transaction process + compliance status (NCNDA/KYC/IMFPA/SPA)
    - Expected commission and notes
    - Non-binding disclaimer
  - **Saves to `dean_crm.deal_documents`** (status='draft', includes full content)
  - Returns document_id in response

- **Preview LOI** in modal (GET preview-only, no database save)
  - Shows generated text before saving

- **Download LOI** as .txt file
  - Both newly generated and previously saved versions

### NCNDA Generation & Management
- **Generate NCNDA** via button on deals page (purple button, same row as LOI)
  - POST `/api/crm/deals/[dealId]/generate-ncnda`
  - Fetches deal + buyer/seller counterparty details
  - Generates professional 8-section NCNDA with:
    - Date, reference number, parties, recitals
    - Non-circumvention clause (12-month survival)
    - Non-disclosure clause with confidentiality obligations
    - Term and survival, exclusions, remedies
    - Entire agreement, disclaimer, signature blocks
  - **Saves to `dean_crm.deal_documents`** (status='draft', includes full content)
  - Returns document_id and ncnda_text

- **Preview NCNDA** in modal (GET preview-only, no database save)
  - Shows generated text before saving

- **Download NCNDA** as .txt file
  - Both newly generated and previously saved versions

### Document Status Workflow
- **Update document status** via dropdown/buttons in saved documents table
  - PATCH `/api/crm/documents/[documentId]`
  - Status transitions: draft → sent → signed
  - "Send" button appears when status = draft
  - "Sign" button appears when status = draft or sent
  - Buttons disappear when document reaches "signed" state
  - Visual feedback: status badges change color with state
    - draft (orange) → sent (green) → signed (purple)
  - Refreshes document list automatically after status update

### Saved Document History
- **View saved documents** for a deal
  - GET `/api/crm/deals/[dealId]/documents`
  - Returns up to 10 most recent documents (limit applied)
  - Fields: id, document_type, status, generated_at, created_at
  - Sorted descending by generated_at

- **View full saved document** content
  - GET `/api/crm/documents/[documentId]`
  - Returns full document with content, type, status

- **Download saved document** as .txt
  - Uses saved content from database

- **Download saved document** as PDF
  - Red "Download PDF" button in document viewer
  - Uses html2pdf.js with dynamic client-side import (no server processing)
  - Includes PentraCore International header, document type, generated date, content, footer
  - Professional A4 formatting with 10mm margins
  - File naming: {DOC_TYPE}-{DATE}.pdf (e.g., LOI-2026-05-05.pdf)

---

## Important Routes

### Frontend
- `/` - Login
- `/knowledge` - Shareholder knowledge base
- `/crm` - CRM dashboard (main nav)
- `/crm/deals` - Deal pipeline + LOI generator

### API Endpoints
- `POST /api/crm/deals` - Create deal
- `GET /api/crm/deals` - List deals
- `GET /api/crm/deals/[dealId]/generate-loi` - Preview LOI (no save)
- `POST /api/crm/deals/[dealId]/generate-loi` - Generate + save LOI
- `GET /api/crm/deals/[dealId]/generate-ncnda` - Preview NCNDA (no save)
- `POST /api/crm/deals/[dealId]/generate-ncnda` - Generate + save NCNDA
- `GET /api/crm/deals/[dealId]/generate-kyc` - Preview KYC (no save)
- `POST /api/crm/deals/[dealId]/generate-kyc` - Generate + save KYC
- `GET /api/crm/deals/[dealId]/generate-imfpa` - Preview IMFPA (no save)
- `POST /api/crm/deals/[dealId]/generate-imfpa` - Generate + save IMFPA
- `GET /api/crm/deals/[dealId]/documents` - List saved documents (max 10)
- `GET /api/crm/documents/[documentId]` - Get full document content
- `PATCH /api/crm/documents/[documentId]` - Update document status (draft/sent/signed)

---

## Supabase Tables & Columns in Use

### `dean_crm.deals`
- id, opportunity_id, buyer_id, seller_id, commodity, tonnage, price_per_unit, total_value, stage
- ncnda_signed_date, kyc_approved_date, imfpa_signed_date, spa_signed_date
- expected_commission, commission_received, commission_received_date, notes
- created_at, updated_at

### `dean_crm.counterparties`
- id, name, type (buyer|seller|broker|logistics), country, contact_person, email, phone
- kyc_status (pending|in_progress|approved|rejected), kyc_verified_date, notes
- created_at, updated_at

### `dean_crm.deal_documents`
- id, deal_id, document_type (loi|ncnda|kyc|imfpa|spa|other)
- **status** (draft|sent|signed) - ✅ Added via migration 005
- **generated_at** (TIMESTAMPTZ) - ✅ Added via migration 005
- **content** (TEXT) - ✅ Added via migration 005
- file_path, signed_date, created_at, updated_at
- Constraints:
  - CHECK (status IN ('draft', 'sent', 'signed'))
  - CHECK (document_type IN ('loi', 'ncnda', 'kyc', 'imfpa', 'spa', 'other'))

### `pentracore_knowledge.*`
- company_info, products, services, processes, policies, faqs, documents, contacts, news_updates, kpi_dashboard, knowledge_access

---

## Git Checkpoints

```
Latest commits (as of 2026-05-05):
- 9e46fd7 Add PDF export for saved documents (html2pdf.js, dynamic import)
- [Completed] Fix PDF crash (dynamic client-side import, async)
- f858b8e Add NCNDA generator (NCNDA endpoint + UI button)
- [Completed] Add document status workflow (PATCH endpoint + Send/Sign buttons)
- [Completed] Update CURRENT_STATE.md (documentation)
- [Completed] Cleanup: production safety, document limit, state management
- Add working LOI generator for CRM deals
- Save generated LOIs to deal documents
- Show saved LOI history in deals UI
- Add fallback product data for demo
- Fix master session auth context
```

Completed in this session:
- ✅ Working LOI generator with professional text
- ✅ Save LOIs to dean_crm.deal_documents with content
- ✅ Saved LOI history visible in UI (max 10, sorted by date)
- ✅ View and download saved documents (.txt and PDF)
- ✅ PDF export with PentraCore branding (html2pdf.js, client-side)
- ✅ Document status workflow (draft → sent → signed)
- ✅ NCNDA generator with 8-section professional agreement
- ✅ NCNDA button on deals page (purple, reuses document workflow)
- ✅ KYC generator with verification checklist and compliance sign-off
- ✅ KYC button on deals page (green, reuses document workflow)
- ✅ IMFPA generator with 10-section master purchase agreement
- ✅ IMFPA button on deals page (red, reuses document workflow)
- ✅ Production safety check for MASTER_LOGIN_SECRET
- ✅ State management cleanup (no undefined headings)
- ✅ Future major feature vision documented (Document Compiler)

---

## Current Limitations

### Document Generation
- Plain text + PDF export supported (html2pdf.js, client-side, A4 formatting with PentraCore branding)
- LOI, NCNDA, KYC, and IMFPA generators implemented (SPA not yet)
- Buyer/seller names use placeholders if counterparties not created
- No document versioning (each generation creates new record, not overwrite)
- No custom document templates (terms are hardcoded in functions)

### Database & Schema
- Document types constrained to: loi, ncnda, kyc, imfpa, spa, other
- Status only supports: draft, sent, signed
- No audit logging for document status changes
- No signed_date tracking (column exists but not used)

### UI
- Minimal styling (functional, not designed)
- No bulk document management
- No document templates or customization
- No email/send integration (status can be set but not automated)
- No document signature tracking (signed_date field exists but unused)

### Auth & Security
- Dean-only access hardcoded to deanbfox@gmail.com
- No role-based access control (RBAC) beyond Dean/shareholder split
- No audit trail of who accessed/modified deals

---

## Recommended Next Features

### Option 1: SPA Document Generator
**Scope:**
- Create `/api/crm/deals/[dealId]/generate-spa` endpoint
- Generate multi-section Sales Purchase Agreement from deal data
- Include commodity specs, pricing, payment terms, delivery terms, warranties, dispute resolution
- Save to deal_documents with document_type='spa'
- Add SPA button to deals page (next to LOI/NCNDA/KYC/IMFPA)

**Why:** Completes the transaction document suite (NCNDA → KYC → IMFPA → SPA). SPA is the final binding contract before payment/delivery.

**Effort:** ~90 min (endpoint, SPA template, UI button)

**Dependencies:** All prior documents (LOI, NCNDA, KYC, IMFPA) generated and reviewed

---

### Option 2: Document Templates with Company Branding
**Scope:**
- Move hardcoded document text to template system (Supabase table or .ts files)
- Add company header with logo, address, contact info
- Add footer with generation timestamp and "confidential" marking
- Allow customization of terms (commission percentage, timeline, etc.)
- Apply to LOI, NCNDA, KYC, IMFPA generators

**Why:** Enables quick updates to branding/terms without code changes and better visual presentation.

**Effort:** ~120 min (template system, header/footer logic, branding UI)

**Dependencies:** Optional company info from pentracore_knowledge.company_info

---

## Testing Checklist

### Core Functionality (✅ Completed)
- [x] Generate LOI → saves to deal_documents with content
- [x] View saved LOI → retrieves and displays full content
- [x] Download saved LOI → .txt file downloads with correct text
- [x] Close LOI preview → clears all related state (no "undefined" headings)
- [x] Saved documents limited to 10 rows, sorted by date
- [x] Generate NCNDA → saves to deal_documents with full agreement text
- [x] View saved NCNDA → retrieves and displays full content
- [x] Download saved NCNDA → .txt file downloads with correct text
- [x] Generate KYC → saves to deal_documents with full checklist text
- [x] View saved KYC → retrieves and displays full content
- [x] Download saved KYC → .txt file downloads with correct text
- [x] Generate IMFPA → saves to deal_documents with full agreement text
- [x] View saved IMFPA → retrieves and displays full content
- [x] Download saved IMFPA → .txt file downloads with correct text
- [x] Document status workflow: draft → sent → signed with visual feedback
- [x] Status buttons appear/disappear correctly based on current state
- [x] Multiple documents (LOI, NCNDA, KYC, IMFPA) work independently

### Security & Configuration (✅ Completed)
- [x] Production env check: NODE_ENV=production without MASTER_LOGIN_SECRET throws error
- [x] Local dev: NODE_ENV=development uses fallback secret (no error)
- [x] Auth required for all document endpoints (verifyDeanRequest)
- [x] NCNDA button disabled while LOI generating, and vice versa

### Recommended Pre-Release Tests
- [ ] Generate 5+ documents on same deal, verify limit(10) works
- [ ] Update status multiple times, verify each change persists
- [ ] Generate LOI, NCNDA, KYC, then IMFPA on same deal, verify all appear correctly
- [ ] Test on slow network, verify loading states show correctly
- [ ] Test with missing buyer/seller, verify placeholders appear
- [ ] Verify IMFPA includes commission, payment triggers, non-circumvention, and 10-section structure
- [ ] Check document content accuracy against requirements

---

## Future Major Feature: PentraCore Document Compiler (Planned)

**Vision:**
A document intelligence system that reads uploaded PentraCore documents (PDFs, Word, etc.) and extracts structured deal data back into the CRM.

**Scope (not yet built):**
- Accept uploaded deal documents
- Extract commodity, buyer, seller, tonnage, pricing, commission, stage, constraints, logistics, payment terms, missing documents, risks
- Match to existing CRM deals or suggest new deal records
- Generate summaries: deal overview, shareholder update, CEO brief, missing-documents checklist
- Feed extracted data to LOI/NCNDA/KYC/IMFPA/SPA generators
- Review-first workflow: extracted data requires approval before saving

**Important Design Constraints:**
- Does NOT replace CRM as source of truth
- All extracted data is review-first, never auto-saved blindly
- Current generators (LOI, NCNDA, KYC, IMFPA, SPA) remain unchanged until Compiler is built
- No extraction flags or approval workflow added to current schema yet
- Compiler feeds clean, approved data INTO the CRM, not vice versa
