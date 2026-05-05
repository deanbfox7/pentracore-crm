# PentraCore CRM - Current State (2026-05-05)

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
- `GET /api/crm/deals/[dealId]/documents` - List saved documents (max 10)
- `GET /api/crm/documents/[documentId]` - Get full document content

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
Latest commits:
- Fix master session auth context
- Add fallback product data for demo
- Implement master session authentication for password login
- Add master password login for deanbfox@gmail.com
- Fix products API to query correct schema
```

Recent work (not yet committed as single checkpoint):
- Add working LOI generator for CRM deals
- Save generated LOIs to deal documents
- Show saved LOI history in deals UI
- Cleanup: production safety, document limit, state management

---

## Current Limitations

### Database & Schema
- ✅ NCNDA/KYC/IMFPA/SPA constraints exist but no generation yet
- Document types constrained to: loi, ncnda, kyc, imfpa, spa, other
- Status only supports: draft, sent, signed (no "generated" status)
- No audit logging for document changes

### LOI Generation
- Plain text output only (no PDF yet)
- Limited to LOI type (NCNDA/KYC/IMFPA/SPA generation not implemented)
- Buyer/seller names use placeholders if not in counterparties table
- No versioning of generated LOIs (overwrites show as new records)

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

## Recommended Next Feature

### Document Status Updates (draft → sent → signed)

**Scope:**
1. Add UI buttons to `/crm/deals` saved documents table:
   - "Mark Sent" (draft → sent)
   - "Mark Signed" (sent → signed, optional signed_date picker)

2. Create API endpoint:
   - `PATCH /api/crm/documents/[documentId]`
   - Update status + optional signed_date
   - Validate status transitions (draft → sent → signed only)
   - Return updated document record

3. Enforce business rule:
   - Cannot mark SPA as signed until IMFPA is signed (per hard rules)

4. Visual feedback:
   - Status badge changes color: draft (orange) → sent (blue) → signed (green)
   - Timestamps update in UI

**Why:** Completes the document workflow tracking for audit and deal progression without touching LOI generation or introducing new document types.

**Effort:** ~30 min (1 API endpoint, 2 buttons, state refresh)

---

## Testing Checklist

- [ ] Generate LOI → saves to deal_documents with content
- [ ] View saved LOI → retrieves and displays full content
- [ ] Download saved LOI → .txt file downloads with correct text
- [ ] Close LOI preview → clears all related state (no "undefined" headings)
- [ ] Saved documents limited to 10 rows
- [ ] Production env check: NODE_ENV=production without MASTER_LOGIN_SECRET throws error
- [ ] Local dev: NODE_ENV=development uses fallback secret (no error)
