# PentraCore Intelligence + Workflow System Plan

## 1. Overall System Vision

The PentraCore Intelligence System transforms unstructured WhatsApp communications into a structured, knowledge-driven workflow engine that:

- **Ingests** WhatsApp group exports and downloaded media as the primary operational source of deal intelligence
- **Classifies** all information (chats, documents, images, voice notes, videos) into deal-context and company-context buckets
- **Extracts** structured deal metadata (buyer/seller terms, commodities, timelines, missing info, risks, compliance status)
- **Publishes** approved knowledge to the internal/shareholder knowledge base (no customer-facing publication yet)
- **Generates** draft responses for internal coordination and shareholder communication (human approval required)
- **Enables** Dean-only private lead and sales intelligence tools (separate from shared systems)

**Design principle**: Zero data flows externally without human approval. High confidence extraction is "recommended for review," not auto-approved. Legally authoritative records (signed contracts, approved KYC, compliance certifications) remain the source of truth; WhatsApp extractions are operational intelligence that inform but do not override formal records.

---

## 2. WhatsApp as Primary Information Source

**Current reality**:
- Team communicates deal updates, buyer/seller messages, commodity details, timelines, and missing information in WhatsApp groups
- Documents, voice notes, PDFs, images, and videos are shared inline or downloaded separately
- No centralized system currently processes or structures this information

**System assumption**:
- WhatsApp group exports are provided to the system as `.txt` files (chat history)
- Media files are downloaded and organized by deal/date
- The system receives these inputs manually (no live WhatsApp API integration in Phase 1)
- Exports are treated as snapshots; older exports do not re-process

**Privacy/security**:
- All WhatsApp data is treated as confidential
- Exports are retained in a private intake folder with access restrictions
- Individual phone numbers and personal identifiers are de-identified before publishing to shared knowledge base
- Voice notes and images are transcribed/described in metadata but not stored in shared knowledge
- Operational intelligence extracted from chats must always be validated against signed agreements and compliance records

---

## 3. Manual Intake Workflow for WhatsApp Chats and Media

**Input process**:
1. Dean or team member downloads a WhatsApp group export (`.txt` file) and/or media files
2. Files are placed in a private intake folder: `/pentracore-crm/private-vault/whatsapp-intake/`
3. Each intake batch is labeled by deal ID, date, and source group name: `DEAL_[ID]_[DATE]_[GROUP_NAME]/`
4. Folder structure:
   ```
   DEAL_001_2026-05-06_buyers-group/
   ├── export.txt
   ├── images/
   │   ├── screenshot_01.png
   │   ├── screenshot_02.png
   ├── documents/
   │   ├── contract_draft.pdf
   │   ├── loi.pdf
   ├── voice/
   │   ├── update_2026-05-05.m4a
   │   ├── requirements_2026-05-04.m4a
   └── metadata.json (manually created)
   ```
5. Metadata file documents:
   - Deal ID (CRM reference)
   - Group name and date range
   - Key contacts mentioned
   - Rough deal stage (KYC, IMFPA, SPA, etc.)
   - Known gaps or sensitive items
   - Any extraction notes or warnings

---

## 4. Media Handling by Type

### Text Chat (`.txt` export)
- **Input**: Raw WhatsApp export with timestamps, sender names, messages
- **Processing**:
  - Parse timestamps and sender identity
  - Segment by date and conversation thread
  - Extract deal-relevant messages (filter social chat, greetings, emojis)
  - Map sender names to known contacts (buyer, seller, broker, Dean, etc.)
- **Output**: Structured JSON with speaker, timestamp, message, inferred context (e.g., "buyer terms," "compliance check")
- **Risk**: Sender names may be informal nicknames; requires manual mapping to known CRM contacts

### PDFs / Documents
- **Input**: Contract drafts, LOIs, KYC forms, compliance docs, shipping documents
- **Processing**:
  - Optical character recognition (OCR) if image-based
  - Extract text and metadata (date, signatories, page count)
  - Identify document type (LOI, SPA, KYC form, shipping manifest, etc.)
  - Flag missing signatures, incomplete sections, or compliance gaps
  - Extract key terms (price, quantity, commodity, payment terms, delivery timeline)
- **Output**: Structured metadata + searchable text + flagged warnings
- **Risk**: Large PDFs may have poor OCR; complex contracts require human review for legal accuracy

### Images / Screenshots
- **Input**: Photos of handwritten notes, whiteboard notes, transaction proofs, shipping photos, ID docs
- **Processing**:
  - OCR on handwritten and printed text
  - Classify image type (whiteboard, memo, shipping proof, ID, transaction screenshot, etc.)
  - Extract key text and numbers
  - Summarize visual content (e.g., "container loading photo shows 20 pallets")
  - Flag sensitive content (ID docs, bank details, personal signatures)
- **Output**: Transcribed text + image classification + visual summary + privacy flags
- **Risk**: Handwriting variability; sensitive PII may require redaction before publishing

### Voice Notes
- **Input**: M4A, MP3, or WAV files from WhatsApp voice messages
- **Processing**:
  - Transcription via speech-to-text (local or cloud-based)
  - Speaker identification (attempt to match to known contact names from chat context)
  - Segmentation by topic or timestamp
  - Extraction of deal-critical statements (terms, timelines, missing info, warnings)
  - Tone/sentiment analysis (urgent, confirmed, uncertain, etc.)
- **Output**: Full transcript + key extractions + speaker identity + confidence flags
- **Risk**: Background noise, accents, unclear audio; transcription errors require human review before publishing

### Videos
- **Input**: WhatsApp video messages or downloaded MP4/MOV files
- **Processing**:
  - Extract first frame as thumbnail
  - Segment by scene or speaker change
  - Automatic transcription of spoken content (if video contains dialogue)
  - Visual content summary (e.g., "mining site walkthrough, showing ore processing equipment")
  - Extract text overlays or graphics
  - Flag length and processing cost
- **Output**: Transcript + visual summary + thumbnail + metadata
- **Risk**: Large files; transcription cost; video evidence of compliance or commodity quality requires verification

---

## 5. Classification Structure

All ingested information is tagged with:

### Deal Context Tags
- `deal_id` (CRM reference)
- `deal_stage` (KYC, IMFPA pending, IMFPA done, SPA draft, SPA signed, payment in progress, delivered)
- `buyer_id` / `seller_id` (CRM counterparty reference)
- `commodity` (iron ore, cobalt, gold, copper, lithium, aluminum, tin, diamonds)
- `quantity_units` (metric tons, kg, pieces)
- `price_per_unit` (USD/MT or equivalent)
- `total_value` (USD equivalent)

### Information Type Tags
- `message_type` (term update, compliance question, timeline, missing doc, risk flag, status update, schedule, confirmation)
- `confidence` (high, medium, low)
- `source_media` (chat, pdf, image, voice, video)
- `requires_verification` (yes/no; flagged if contradicts prior data or seems uncertain)

### Privacy Tags
- `sensitive_pii` (contains ID, bank detail, phone, email, address)
- `private_to_dean` (sales strategy, private lead, competitor intel)
- `approved_for_sharing` (yes/no; set after human review)

### Risk & Compliance Tags
- `compliance_gap` (KYC incomplete, AML check needed, sanctions list check needed, etc.)
- `timeline_risk` (payment terms unclear, delivery date at risk, documentation behind schedule)
- `deal_health` (on track, at risk, blocked, clarification needed)
- `missing_information` (e.g., "buyer payment proof pending", "final shipping terms TBD")

---

## 6. Company Knowledge Base Workflow

### Current State
- Knowledge base exists at `/knowledge` in the Next.js app
- Tables in Supabase: `pentracore_knowledge.*`
- Covers company info, products, services, processes, policies, FAQs, documents, contacts, news, KPIs
- Limited deal-specific and real-time content

### Future Integration (Phase 2+)
- Approved deal information is published to the knowledge base
  - Deal ID, stage, commodity, parties, timeline, key terms, last update
  - All sensitive terms redacted; buyer/seller names may be anonymized for internal/shareholder view
- Deal documents (approved) are linked in the knowledge base
- Extracted commodity/market intelligence is available in the knowledge base
- Contact directory updated from verified team feedback
- **Currently**: No customer-facing dashboards in Phase 1. Knowledge base is internal/shareholder only.

### Publishing Rules
- Only information with `approved_for_sharing = yes` is published
- All PII is redacted or anonymized
- Approval workflow: system recommends → Dean or authorized team member approves → auto-publish
- Timestamp all publications with approval date and approver identity
- Maintain audit trail of all knowledge changes

---

## 7. Human Approval Workflow

### Approval Gates

**Gate 1: Information Extraction Review**
- System extracts deal terms, timelines, missing info, risks from WhatsApp/documents
- Output shown to approver with confidence level and sources highlighted
- Approver can: approve extraction, correct/refine it, reject, or flag for manual re-review
- **Owner**: Dean or designated team member (initially Dean)
- **Frequency**: Real-time as new intakes arrive

**Gate 2: Knowledge Publishing Approval**
- System summarizes approved extraction and proposes knowledge base entry
- Entry shows: deal metadata, timeline, key terms, risks, last updated
- Approver decides: publish as-is, edit, or hold for additional verification
- **Owner**: Dean or designated team member
- **Frequency**: On-demand; no automatic publishing

**Gate 3: Customer Response Draft Review**
- System generates draft communication (email, message, dashboard update) based on approved knowledge
- Draft is presented to approver with confidence level and source citations
- Approver can: approve draft for sending, edit, request additional info, or reject
- **Owner**: Dean for all shareholder/customer responses (Phase 1)
- **Frequency**: On-demand; no automatic sending

### Workflow Tools
- Approval interface: custom Next.js page at `/crm/approvals`
- Displays pending extractions, knowledge proposals, and draft responses in priority order
- One-click approve/reject with optional comment field
- Version history tracking (show what was changed by whom and when)

---

## 8. Shareholder Customer-Response Assistant Rules

### Purpose
Generate draft responses to shareholder inquiries and update communications without exposing Dean's private sales intelligence.

### Rules
- **Scope**: Only use approved, published knowledge base entries
- **Audience**: Shareholders, potential customers, external partners (non-Dean team)
- **Tone**: Professional, informative, deal-positive
- **Restrictions**:
  - Do NOT include Dean's private notes, sales strategy, or lead evaluation
  - Do NOT expose internal buyer/seller negotiations or term debates
  - Do NOT mention pending compliance issues or risks until resolved
  - Do NOT publish buyer identity, seller identity, or deal economics before agreements are final
  - Redact all personal identifiers, phone numbers, bank details, and IDs
  - Do NOT auto-send any response; all outputs are drafts for manual approval

### Example Response Types
1. **Commodity availability update**: "We have sourced a shipment of premium iron ore (62% Fe) available for immediate inspection and export."
2. **Deal stage notification**: "Your KYC review is in progress; we expect completion by [date]. Next steps: [...]"
3. **FAQ response**: "Regarding payment terms: PentraCore facilitates verified buyer/seller matches with flexible payment structures including [options]."
4. **Document request**: "We will provide the inspection report and shipping manifest after [compliance gate] is cleared."

### Draft Confidence Levels
- **High confidence**: Response is factually sourced from approved deal data; recommended for approval
- **Medium confidence**: Response requires minor fact-check or inference; review before approving
- **Low confidence**: Response requires substantial additional context or research; flag for manual write-up

---

## 9. Dean-Only Private Sales/Lead System Rules

### Purpose
Enable Dean to maintain private lead intelligence, sales strategy, and competitive positioning without exposing team or customers.

### Access Control
- Private folder: `/private-vault/dean-only/`
- Database schema (future): Separate from shared knowledge base; accessible only to Dean's authenticated session
- Auth: Magic link login to app; private vault accessible only to Dean's authenticated session
- No export to shared knowledge base or customer responses

### Content Types
- **Private lead evaluation**: Buyer/seller assessment, qualification score, deal probability, negotiation strategy
- **Sales intelligence**: Competitive commodities, market gaps, pricing intelligence, supply chain insights
- **Negotiation notes**: Confidential buyer/seller terms, walk-away pricing, internal red lines
- **Risk assessments**: Counterparty credit/compliance risk, relationship history, past disputes
- **Strategic decisions**: Which deals to pursue, which leads to drop, positioning in market

### Integration with Intelligence System
- Dean can tag WhatsApp extractions with `private_to_dean = yes` during approval
- Those extractions are stored in private vault, NOT published to shared knowledge
- Dean can request intelligence system to analyze private intakes for strategic insights
- Private analysis feeds into Dean's deal prioritization and customer engagement strategy
- Shareholder/customer responses never reference or leak private data

---

## 10. Immediate CRM Alignment

The PentraCore Intelligence System must integrate with existing CRM at `/crm`. The intelligence system augments operational visibility but does not replace formal deal administration, signed contracts, compliance verification, or approved CRM workflows.

### Operational Truth Hierarchy

All extracted information is organized according to a hierarchy of authority:

1. **Signed agreements and contracts** (legally binding documents)
2. **Approved compliance and KYC records** (verified by authorized parties)
3. **Approved CRM records** (human-entered and verified data)
4. **Approved extracted intelligence** (WhatsApp/media intelligence extracted and approved by human review)
5. **Raw WhatsApp operational discussion** (unverified team communication)

**Critical rule**: WhatsApp discussions may contain speculative, outdated, incomplete, or contradictory information and must never be treated as legally authoritative without verification against higher-order records. Extraction of WhatsApp intelligence is a research and operational clarity tool only, not a substitute for formal deal administration.

### Current CRM State
- Deal pipeline at `/crm/deals` (deal records with filtering, detail view)
- Analytics at `/crm/analytics` (deal metrics by stage, commodity, counterparty)
- Contact management (counterparties table)
- Deal timeline and document tracking

### System Integration Points
1. **Deal Record Enrichment**
   - Intelligence system populates CRM deal timeline with WhatsApp-extracted updates
   - Adds extracted terms, missing info flags, risk alerts to deal record
   - Links source documents and media to CRM deal

2. **Counterparty Intelligence**
   - Buyer/seller contact enrichment from WhatsApp team communication
   - Compliance status, communication frequency, preferred contact methods
   - Relationship history and deal history

3. **Deal Stage Automation**
   - Manual stage transitions (user controls deal progression)
   - Intelligence system flags gaps: "SPA cannot be signed; IMFPA not approved yet"
   - Suggests next-step actions based on extracted timeline and missing info

4. **Analytics Enrichment**
   - Commodity breakdown by source (extracted from WhatsApp vs. manual entry)
   - Deal health metrics: "40% of deals have timeline risk," "60% have missing documents"
   - Contact engagement metrics: frequency of updates, response times, communication channels

---

## 11. What Not to Build Yet

Explicitly OUT OF SCOPE for initial planning and Phase 1:

- **Live WhatsApp API integration**: Phase 1 is manual file uploads only
- **Automated chatbots in WhatsApp**: Too risky without approval workflow; defer to Phase 2+
- **Real-time deal notifications**: Focus on structured extraction first
- **Automated compliance checks**: Compliance decisions require human expert review
- **Machine learning models for deal scoring**: Not until system has 50+ analyzed deals
- **Public website integration**: All data stays internal until shareholder dashboard is robust
- **Mobile app**: Web interface sufficient for MVP
- **Integrations with external deal platforms or databases**: Later phase
- **Video analysis beyond transcription**: Too complex for MVP
- **Predictive deal close rates**: Defer until historical data is substantial

---

## 12. Biggest Risks to Avoid

### Risk 1: Premature Publishing of Sensitive Information
**Problem**: Shareholder dashboard accidentally exposes buyer/seller names, deal economics, or negotiation strategy
**Prevention**:
- Strict approval workflow with two-stage gates (extraction → publishing)
- Default is "do not publish"; explicit approval required for each publication
- Automated redaction of PII before publishing
- Audit trail of all published data
- **Responsible party**: Dean (final approval authority)

### Risk 2: Inaccurate Extraction Leading to Deal Damage
**Problem**: Extracted terms are misinterpreted (e.g., price per unit vs. total, quantity error), causing buyer/seller confusion
**Prevention**:
- All extractions tagged with confidence level and source document
- Automated flagging of numerical discrepancies (if extraction contradicts prior data)
- Approver must manually verify numerical terms before publishing
- System shows original source text alongside extraction
- **Responsible party**: Dean + designated approver

### Risk 3: Compliance/Regulatory Violation
**Problem**: Extracted information reveals KYC gaps, AML concerns, or sanctions list hits, but is mishandled (published early, not escalated, ignored)
**Prevention**:
- Compliance-tagged extractions auto-escalate to approval queue
- "Missing KYC check" or "sanctions list pending" blocks deal progression
- Compliance flagged items are never published to customers until resolved
- Audit trail maintained for compliance reviews
- **Responsible party**: Designated compliance officer (tbd; initially Dean)

### Risk 4: Data Loss or Unauthorized Access
**Problem**: WhatsApp intakes or extracted data leaked, accessed by unauthorized users, or deleted accidentally
**Prevention**:
- Private vault access restricted to Dean only (app-level auth)
- All intake files retained for audit trail (no deletion without approval)
- Encrypted storage for sensitive media (voice notes, ID docs)
- Database row-level security (RLS) prevents unauthorized access
- Documented backup and retention policy
- **Responsible party**: Infrastructure/DevOps owner (tbd)

### Risk 5: Approval Bottleneck
**Problem**: Dean is overwhelmed with approvals; system becomes backlog instead of accelerant
**Prevention**:
- Phased rollout: start with one deal, one team member
- Clear prioritization rules (deals near closing get priority)
- Bulk approval workflows (approve multiple low-risk extractions at once)
- Clear decision criteria (approver knows what "good" looks like)
- Delegate low-risk approvals to trained team member (later phase)
- **Responsible party**: Dean (process owner)

### Risk 6: Garbage-In, Garbage-Out (GIGO)
**Problem**: Noisy WhatsApp exports, poor OCR, unclear voice notes lead to low-quality extraction
**Prevention**:
- Confidence tagging system (low-confidence extractions flagged for manual review)
- Source document review: approver sees original WhatsApp/PDF alongside extraction
- Quality metrics tracked (% of extractions requiring manual correction)
- Feedback loop: approver corrections improve future extractions
- **Responsible party**: System operator + approver

---

## 13. First Safe Build Recommendation

### Phase 1: Manual Workflow Planning (No Code, No Database, No UI)

**Scope**: Establish manual intake workflow and proven process before building any infrastructure

**Deliverables**:
1. **WhatsApp Intake Folder Structure** (Documented Template)
   - Folder naming: `DEAL_[ID]_[DATE]_[GROUP_NAME]/`
   - Subfolder organization: `export.txt`, `images/`, `documents/`, `voice/`, `video/`, `metadata.json`
   - Naming convention for media files: `[TYPE]_[DATE]_[BRIEF_DESCRIPTION]`

2. **Media Staging Rules** (Documented Guidelines)
   - What file types are acceptable (txt, pdf, jpg, png, m4a, mp3, wav, mp4, mov)
   - File size limits (to be determined)
   - Storage location: `/private-vault/whatsapp-intake/`
   - Access restrictions: Dean only until system is proven

3. **Manual Metadata Template** (Spreadsheet or JSON Template)
   ```json
   {
     "deal_id": "DEAL_001",
     "group_name": "buyers-group",
     "date_range": "2026-05-01 to 2026-05-06",
     "upload_date": "2026-05-06",
     "key_contacts": ["contact_name_1", "contact_name_2"],
     "deal_stage": "IMFPA",
     "known_gaps": "payment terms TBD, shipping doc pending",
     "sensitive_items": "contains ID photo, bank details",
     "notes": "Dean approval notes go here"
   }
   ```

4. **Manual Classification Checklist** (Documented Template)
   For each extracted item, Dean manually tags:
   - Deal ID
   - Information type: [term update | compliance question | timeline | missing doc | risk flag | status update]
   - Confidence: [high | medium | low]
   - Source media: [chat | pdf | image | voice | video]
   - Requires verification: [yes | no]
   - Sensitive PII: [yes | no] + [ID | bank | phone | email | address]
   - Private to Dean: [yes | no]
   - Approved for sharing: [yes | no]
   - Approver notes

5. **Approval Queue Design** (Documented Process)
   - List of pending intakes (manually maintained spreadsheet or text file)
   - Column headers: Intake ID | Deal | Upload Date | Status [pending | reviewed | approved | rejected] | Approver | Date Approved | Notes
   - Manual sorting by priority (deals near closing first)
   - No automation; Dean reviews in batches

**Success Criteria**:
- At least one WhatsApp export organized in the folder structure
- Metadata template completed for that export
- Classification checklist applied to extracted information
- Manual approval log created and maintained
- Zero automated processing; all work is manual/human review

**Timeline**: 1-2 days (documentation + one test intake)

**Risks (Minimal for Phase 1)**:
- Only risk is manual overhead; offset by proving workflow before building UI

---

## Future Build (After Manual Workflow Is Proven)

### Phase 1b: Intake & Approval UI Infrastructure

Once the manual workflow has been used for 5-10 deals and proven effective, build automation on top:

**Future Deliverables** (NOT in Phase 1):
1. **Intake Interface**
   - Upload WhatsApp exports and media files
   - Auto-organize into deal-specific folders
   - Guided metadata entry based on deal context
   - Secure storage of all ingested materials

2. **Approval Workspace**
   - List pending extractions for review
   - Display extracted data with confidence indicators
   - Side-by-side comparison with source documents
   - One-click approve/reject/edit with comment capability
   - Manual override controls

3. **Archive Browser**
   - Browse all organized intakes by deal and date
   - Search by deal ID, contact name, commodity
   - View intake metadata and extraction history
   - Complete audit trail of all approvals

4. **Extraction Review System**
   - Structured storage for intake records
   - Approval and decision tracking
   - Audit trail maintenance

**When to build Phase 1b**: After manual workflow has been used successfully on 5-10 real deals, prove that the classification and approval process works, and confirm the need for UI acceleration.

---

## 13b. n8n Role & Restrictions

**Purpose**: n8n is reserved for low-risk automation AFTER the manual workflow is proven and only for well-defined, human-reviewed processes.

### n8n Use Cases (Phase 2+ Only)
- New file added to Drive folder → create tracker row in spreadsheet
- Send Dean a daily summary of new documents uploaded
- Move approved documents to finalized folder after human review
- Update document review status in tracking sheet after approval
- Send reminder notifications for pending approvals

### n8n Strictly OUT OF SCOPE
- **Live WhatsApp API integration**: Too risky; WhatsApp data must be manually downloaded and staged first
- **Autonomous WhatsApp replies**: Cannot be automated; all responses require human approval
- **Autonomous CRM updates**: No auto-updating deal fields; CRM changes must be manual or human-triggered
- **Processing sensitive documents**: Passports, IDs, bank statements, private contracts cannot be auto-processed; human review mandatory
- **Autonomous compliance checks**: KYC, AML, sanctions list verification requires human expert review
- **Auto-generating customer responses**: Drafts only; Dean must approve all customer communications

### Implementation Rule
Before using n8n for ANY automation:
1. Prove the manual workflow works (Phase 1)
2. Identify low-risk, repetitive tasks (file organization, notifications)
3. Get Dean's explicit approval for the specific n8n workflow
4. Build with audit trails and manual override capability
5. Test with dummy data before running on real deals

---

## 15. Suggested Phased Roadmap

### Phase 1: Manual Workflow (Days 1-2)
**Goal**: Prove the manual intake + approval process without code
- Deliverables: folder structure, metadata template, classification checklist, approval queue log
- Success: Dean can organize and approve one WhatsApp export manually
- No database, no UI, no API routes, no bots
- Timeline: 1-2 days to document and test with one deal

### Phase 1b: Intake & Approval UI (After Phase 1 proven on 5-10 deals)
**Goal**: Automate proven manual workflow
- Deliverables: intake upload UI, approval review page, archive display, database schema
- Success: Dean can ingest and approve WhatsApp exports via web UI instead of manual filing
- No publishing yet; still internal only
- Timeline: 2-3 weeks after Phase 1 is proven

### Phase 2: Knowledge Publishing (Weeks following Phase 1b)
**Goal**: Approved extractions → shareholder knowledge base
- Deliverables: knowledge proposal UI, RLS updates, `/knowledge` enhancements
- Success: Approved internal/shareholder summaries become available after review
- Still no automated customer responses; all external communication drafted manually
- Full approval workflow before any publication

### Phase 3: Customer Response Drafts (Weeks following Phase 2)
**Goal**: Generate draft shareholder/customer responses based on approved knowledge
- Deliverables: draft response generation engine, approval UI, email/message draft templates
- Success: Dean receives draft responses for shareholder inquiries; reviews and approves before sending
- Drafts only; no autonomous messaging or auto-sending
- All generated responses remain drafts pending explicit human approval
- All customer communications remain manual and human-approved
- Soft rollout: test with 1-2 trusted shareholders first

### Phase 4: Private Lead Intelligence (Weeks following Phase 3)
**Goal**: Dean-only analytics and sales strategy tools
- Deliverables: private lead dashboard, competitive intelligence, deal prioritization scoring
- Success: Dean can analyze deals privately and make faster decisions
- No customer access; no sharing to team

### Phase 5: Team Collaboration (Weeks following Phase 4)
**Goal**: Delegate approvals, enable team intelligence
- Deliverables: role-based access (approver, viewer, team intelligence access)
- Success: Multiple team members can assist with approvals; intelligence is shared appropriately
- Guardrails: private data still isolated from shared knowledge

### Phase 6: Low-Risk n8n Automation (Weeks following Phase 5)
**Goal**: Automate file organization and notifications
- Deliverables: n8n workflows for file moving, status updates, notification reminders
- Success: Files are automatically organized after manual review, Dean receives notifications
- Strict rules: only low-risk tasks; no processing of sensitive docs, no autonomous replies

### Phase 7: Advanced Capabilities (Ongoing, requires Phase 6 stability)
**Goal**: ML, webhooks, external integrations
- Potential: automated compliance checks, deal close probability, WhatsApp API integration, advanced bots
- Criteria: only if Phase 1-6 is stable and delivering value for 2+ months

---

## 16. Practical Success Metrics

### Phase 1: Manual Workflow (Early Metrics)
- **WhatsApp exports organized**: number of complete folder structures created (target: ≥ 5 deals)
- **Media files classified**: number of images/documents/voice files tagged with type and confidence (target: ≥ 50 files)
- **Sensitive items flagged**: number of files correctly identified as containing PII/sensitive data (target: 100% accuracy)
- **Missing information identified**: number of gaps discovered in deal records during intake review (target: identify ≥ 10 gaps across deals)
- **Manual approvals logged**: number of extracted items reviewed and approved/rejected by Dean (target: ≥ 100 items)
- **Zero PII leaks**: No sensitive information published to shared knowledge or customers during Phase 1 testing (target: 100% - this is non-negotiable)

### Phase 1b+: UI & Database Automation
- **Intake turnaround**: days from WhatsApp export to organized folder (target: ≤ 2 days)
- **Approval cycle time**: days from extraction to approval (target: ≤ 3 days)
- **Extraction quality**: % of approved extractions that did not require manual correction during use (measured after Phase 1b, not yet predictable)

### Phase 2+: Publishing Metrics
- **Knowledge freshness**: deal information updated from WhatsApp within 1 week of extraction (Phase 2+)
- **Shareholder visibility**: deals with at least one published update per month (Phase 2+)
- **Risk escalation**: % of identified compliance/timeline risks documented in approval log (Phase 2+)

### Phase 3+: Business Metrics
- **Response drafting**: time from shareholder inquiry to draft response generated (Phase 3+)
- **Deal velocity**: track average days from KYC to SPA before/after system is live
- **Risk capture**: number of risks identified by system vs. deals that encounter issues later (measure after Phase 2+)

### Ongoing System Health
- **Data integrity**: All uploads retained, no accidental deletions, audit trail maintained (100% non-negotiable)
- **Approval backlog**: Pending items do not exceed 50 (Phase 1b+)
- **Manual errors**: Extracted data does not contain fabricated or hallucinated information (100% - verify by spot-check)

---

## Core Design Principle

**The system's first purpose is operational clarity and organizational memory — not automation for its own sake.**

Every system component should enable Dean and the team to understand deal status, extract missing information, manage risk, and maintain an accurate historical record. Automation should only be introduced after the manual workflow has proven its value and is stable enough that speeding it up serves the business, not the infrastructure.

---

## Immediate Next Action

**Before building any UI, database, or API routes:**

1. **Create the manual WhatsApp Intake Folder Structure** in `/private-vault/whatsapp-intake/`
   - Create a sample: `DEAL_001_2026-05-06_sample-group/`
   - Add subfolders: `images/`, `documents/`, `voice/`, `video/`
   - Document the folder naming convention

2. **Create a Metadata Template** (JSON or spreadsheet)
   - Save as `/private-vault/INTAKE_METADATA_TEMPLATE.json`
   - Include all fields: deal_id, group_name, date_range, key_contacts, deal_stage, known_gaps, sensitive_items, notes

3. **Create a Classification Checklist** (Spreadsheet or simple form)
   - Document what to tag for each extracted information item
   - Save as `/private-vault/CLASSIFICATION_CHECKLIST.md`
   - Include all tag categories: deal context, information type, privacy, risk/compliance

4. **Create an Approval Queue Log** (Spreadsheet)
   - Save as `/private-vault/APPROVAL_QUEUE.csv`
   - Columns: intake_id, deal_id, upload_date, status, approver, date_approved, notes
   - Manually update this log as Dean reviews intakes

5. **Test with One Real WhatsApp Export**
   - Download a WhatsApp group export for an active deal
   - Organize it using the folder structure
   - Complete the metadata template
   - Apply the classification checklist to extracted information
   - Record approval decisions in the queue log

**Success**: Prove that the manual workflow works before building any code.

---

## Appendix: File Structure & Locations

### Phase 1: Manual Workflow (Current)
```
/Users/deanfox/Desktop/Pentacore/pentracore-crm/private-vault/
├── whatsapp-intake/
│   ├── DEAL_001_2026-05-06_sample-group/
│   │   ├── export.txt
│   │   ├── images/
│   │   ├── documents/
│   │   ├── voice/
│   │   ├── video/
│   │   └── metadata.json
│   └── ...
├── INTAKE_METADATA_TEMPLATE.json       (Template for manual use)
├── CLASSIFICATION_CHECKLIST.md         (Extraction tagging guide)
├── APPROVAL_QUEUE.csv                  (Manual approval log)
└── dean-only/
    ├── leads/
    ├── strategy/
    └── competitive-intel/
```

### Phase 1b+: UI & Database (Future - After Manual Workflow Proven)
```
/Users/deanfox/Desktop/Pentacore/pentracore-crm/
├── app/
│   ├── crm/
│   │   ├── intake/                   (PHASE 1b: WhatsApp intake UI)
│   │   └── approvals/                (PHASE 1b: approval workflows)
│   └── api/
│       ├── intakes/                  (PHASE 1b: intake API routes)
│       └── approvals/                (PHASE 1b: approval API routes)
├── lib/
│   ├── supabase.ts                   (existing)
│   └── extraction-engine.ts          (PHASE 1b: text/media parsing)
└── supabase/
    └── migrations/
        └── 004_intelligence_schema.sql (PHASE 1b: intake/extraction tables)
```

---

## End of Plan

This document is a strategic blueprint for a cautious, proven rollout. Phase 1 is entirely manual—no code, no database, no UI. Only after the manual workflow has been tested with 5-10 real deals do we move to Phase 1b infrastructure and beyond. All feedback and revisions welcome.

