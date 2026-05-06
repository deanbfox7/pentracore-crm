# WhatsApp Intake Workflow Template

## Purpose

This template provides a manual workflow for organizing, classifying, and preparing WhatsApp group exports and associated media for PentraCore deal intake. It bridges WhatsApp communication (raw exports, media) to the CRM database without requiring immediate automation or database integration.

Use this template when:
- A WhatsApp group containing buyer/seller discussions is ready for intake
- Media files (PDFs, images, voice notes, videos) need to be organized
- Deal information must be extracted and validated before CRM entry
- Sensitive information must be flagged for human review only

---

## Folder Structure for Each Intake Batch

Create one batch folder per WhatsApp group intake. Name it clearly with date and deal type.

```
whatsapp-intake/
├── 2026-05-06_GOLD_BUYER_GROUP_ABC/
│   ├── 00_METADATA.md                    (metadata file for this batch)
│   ├── 01_TEXT_EXPORT/                   (WhatsApp text export)
│   │   └── messages.txt
│   ├── 02_MEDIA/                         (organized media files)
│   │   ├── certificates/
│   │   ├── test_results/
│   │   ├── contracts/
│   │   ├── invoices/
│   │   ├── images/
│   │   ├── voice_notes/
│   │   └── videos/
│   ├── 03_CLASSIFIED_CONTENT/            (manually classified by purpose)
│   │   ├── buyer_info.md
│   │   ├── seller_info.md
│   │   ├── product_specs.md
│   │   ├── pricing_discussion.md
│   │   ├── payment_terms.md
│   │   ├── logistics_notes.md
│   │   └── compliance_flags.md
│   ├── 04_SENSITIVE_INFO_REPORT.md       (flags only, no data extraction)
│   ├── 05_MISSING_INFO_TRACKER.md        (what needs to be followed up)
│   ├── 06_REVIEW_CHECKLIST.md            (pre-approval checks)
│   └── 07_APPROVED_FOR_CRM.txt           (human sign-off timestamp)
```

---

## File Naming Rules

### Text Export
- Format: `messages_YYYYMMDD_HHmm.txt` (e.g., `messages_20260506_1430.txt`)
- Include export timestamp and timezone

### Media Files
- Format: `{CATEGORY}_{DESCRIPTION}_{DATE}_{SEQUENCE}.{ext}`
- Examples:
  - `certificate_assay_gold_purity_20260505_001.pdf`
  - `invoice_seller_acme_minerals_20260503_001.pdf`
  - `image_container_shipment_view_20260506_001.jpg`
  - `voicenote_buyer_intro_call_20260502_001.m4a`
  - `video_mine_walkthrough_site_A_20260504_001.mp4`

### Classified Content Files
- Format: `{CATEGORY}_extracted_YYYYMMDD.md`
- Examples: `buyer_info_extracted_20260506.md`, `pricing_discussion_extracted_20260506.md`

### Sensitive Info Report
- Fixed name: `SENSITIVE_INFO_REPORT.md`
- Never include actual data; only flag presence and category

---

## Metadata Template

**File:** `00_METADATA.md`

```markdown
# Intake Batch Metadata

## Batch Identity
- **Batch ID:** 2026-05-06_GOLD_BUYER_GROUP_ABC
- **Created Date:** 2026-05-06
- **Intake Manager:** [Your Name]
- **WhatsApp Group Name:** [Exact name from export]
- **Group Created Date:** [If known]
- **Primary Commodity:** Gold
- **Estimated Deal Value:** [USD range if known, or "TBD"]

## Export Details
- **Export Source:** WhatsApp (iOS/Android)
- **Export Date:** 2026-05-05
- **Export Time Range:** 2026-04-01 to 2026-05-06
- **Total Messages:** [Count from text export]
- **Total Media Files:** [Count of media]
- **Export Format:** .txt + media folder

## Primary Participants
- **Buyer Organization:** [Name or "TBD"]
- **Seller Organization:** [Name or "TBD"]
- **Buyer Contact:** [Name and role, NO phone/email here]
- **Seller Contact:** [Name and role, NO phone/email here]
- **Group Admin:** [Name, role]

## Deal Status
- **Approximate Stage:** [Inquiry / LOI / IMFPA / SPA / Closed]
- **Last Activity Date:** [Date of last message in group]
- **Next Expected Action:** [From group discussion, if clear]

## Classification Status
- **Buyer Info Extracted:** [ ] Yes [ ] No [ ] Partial
- **Seller Info Extracted:** [ ] Yes [ ] No [ ] Partial
- **Product Specs Extracted:** [ ] Yes [ ] No [ ] Partial
- **Pricing Extracted:** [ ] Yes [ ] No [ ] Partial
- **Sensitive Info Flagged:** [ ] Yes [ ] No

## Intake Approval
- **Human Review Date:** [TBD]
- **Approved by:** [Name, initials]
- **Approval Date:** [TBD]
- **Ready for CRM Entry:** [ ] Yes [ ] No
```

---

## Manual Classification Checklist

As you review the WhatsApp export and media, manually extract and classify information into these categories:

### Buyer Information
- [ ] Company/Organization name
- [ ] Business type (mining, import, trader, investment, other)
- [ ] Country of operation
- [ ] Number of key contacts identified
- [ ] Buyer's experience with commodity (first-time, repeat, expert)
- [ ] Buyer's stated requirements (quantity, quality, timeline)
- [ ] Communication style (professional, informal, urgent, patient)

### Seller Information
- [ ] Company/Organization name
- [ ] Primary commodity source
- [ ] Mining/Production location (country, region)
- [ ] Seller's capacity (tons/month, annual production)
- [ ] Quality certifications (ISO, conflict-free, verified assay)
- [ ] Previous transaction history (if mentioned)
- [ ] Pricing baseline (if stated)

### Product Specifications
- [ ] Commodity type (Gold, cobalt, iron ore, etc.)
- [ ] Quantity discussed (kg, tons, units)
- [ ] Purity/Grade (if for gold: 22K, 24K, assay %)
- [ ] Quality tests completed (yes/no)
- [ ] Certification documents present (yes/no)
- [ ] Impurities/contaminants identified
- [ ] Storage/condition notes

### Pricing Discussion
- [ ] Price per unit quoted ($/kg, $/oz, $/ton)
- [ ] Total deal value (if calculable)
- [ ] Price negotiation range
- [ ] Pricing basis (spot, premium, fixed, indexed)
- [ ] Payment currency
- [ ] Price validity date (if stated)

### Payment Terms
- [ ] Payment method discussed (bank transfer, escrow, other)
- [ ] Payment timeline (advance, upon delivery, COD)
- [ ] Escrow provider mentioned (yes/no, which)
- [ ] Payment milestones (if phased deal)
- [ ] Currency confirmed
- [ ] Bank details exchanged (flag in sensitive report only)

### Logistics & Delivery
- [ ] Shipping method (air, sea, truck)
- [ ] Origin location (mine, warehouse, port)
- [ ] Destination location
- [ ] Estimated shipping timeline
- [ ] Freight cost (if discussed)
- [ ] Insurance discussed (yes/no)
- [ ] Port of discharge (if applicable)

### Compliance & Legal
- [ ] KYC status (started, pending, completed)
- [ ] IMFPA mentioned (yes/no)
- [ ] SPA discussed (yes/no)
- [ ] Non-circumvention clause awareness
- [ ] Regulatory requirements discussed (yes/no)
- [ ] Conflict minerals discussed (yes/no)
- [ ] Trade finance discussed (yes/no)

---

## Sensitive Information Checklist

**CRITICAL:** Do NOT extract or copy sensitive data into shared outputs or CRM imports.

### Categories to Flag (Mark Only as "[Sensitive info present — human review required]")

- [ ] **Personal IDs:** Passport numbers, driver license numbers, national IDs
- [ ] **Financial Data:** Bank account numbers, SWIFT codes, payment details
- [ ] **Personal Contact:** Phone numbers, personal email addresses, home addresses
- [ ] **Medical/Biometric:** Health records, biometric data, visa details
- [ ] **Private Contracts:** Unsigned agreements, confidential pricing, proprietary terms
- [ ] **Compliance Docs:** KYC documents, compliance questionnaires, legal memos
- [ ] **Authentication Codes:** OTP codes, API keys, security credentials
- [ ] **Litigation Data:** Dispute details, ongoing legal cases, regulatory investigations

### Sensitive Info Report Template

**File:** `04_SENSITIVE_INFO_REPORT.md`

```markdown
# Sensitive Information Flag Report

## Batch ID
2026-05-06_GOLD_BUYER_GROUP_ABC

## Summary
This report flags categories of sensitive information present in the WhatsApp batch.
**No actual sensitive data is extracted or listed below.**

## Flags Present

- **Passport/ID Data:** [Sensitive info present — human review required]
  - Context: Page 2 of certificate PDF; vendor passport copy attached
  - Action: Keep in offline archive; do not import to CRM

- **Bank Details:** [Sensitive info present — human review required]
  - Context: Message thread on 2026-05-03; buyer bank wire details shared
  - Action: Escalate to Dean; consider separate escrow coordinate

- **Personal Phone Numbers:** [Sensitive info present — human review required]
  - Context: Multiple voice notes and text messages; phone numbers in signatures
  - Action: Extract only role/name for CRM; do not store numbers in shared systems

- **Compliance Documents:** [Sensitive info present — human review required]
  - Context: KYC questionnaire PDF attached; internal audit notes in seller media
  - Action: Keep in secure folder; reference only in human notes

## Approval for CRM Entry
- [ ] Approved — no sensitive data conflicts with CRM import plan
- [ ] Escalate — Dean to review sensitive categories before CRM entry
- [ ] Block — sensitive data prevents automated or standard import

## Reviewed By
- Name: ___________
- Date: ___________
- Signature: ___________
```

**WARNING: Never upload raw sensitive documents into shared AI tools without explicit approval.** If you use Claude, ChatGPT, or other LLMs to help classify or summarize WhatsApp batches, first redact or remove:
- Personal IDs, passport copies, visa documents
- Bank account numbers, SWIFT codes, routing numbers
- Personal phone numbers and home addresses
- Private KYC forms and compliance questionnaires
- Proprietary contracts or confidential pricing

Use the flag approach only: "Sensitive info present — human review required."

---

## Buyer/Seller Matching Fields

Use these fields to track and match buyer/seller pairs for future deal linkage.

### Buyer Profile
```markdown
## Buyer Record

**Batch Link:** 2026-05-06_GOLD_BUYER_GROUP_ABC

**Buyer Name:** [Company name, exact spelling]
**Buyer Type:** [Mining, Trading, Import, Investment, Other]
**Buyer Country:** [Primary country of operation]
**Buyer Region:** [Specific region/city if known]

**Key Contacts:**
1. Name: [First Last], Role: [Title], Focus: [What they handle]
2. Name: [First Last], Role: [Title], Focus: [What they handle]

**Buyer Stated Requirements:**
- Commodity: Gold
- Form: [Bars, Dust, Ore, Refined, Scrap, Other]
- Quantity: [Weight range, e.g., 100-500 kg]
- Purity Requirement: [e.g., 22K minimum, 999.9 fine, 95% assay]
- Timeline: [ASAP, 30/60/90 days, flexible]
- Purchase Frequency: [One-time, recurring monthly, quarterly, annual]

**Buyer Credibility Indicators:**
- [ ] References provided
- [ ] Previous transaction history
- [ ] Professional communication
- [ ] Fast response time to inquiries
- [ ] Serious about terms (not just browsing)

**Buyer KYC Status:**
- [ ] Started
- [ ] In Progress
- [ ] Completed
- [ ] Escalated for review

**Previous Deals with Buyer:** [Link to prior batches, CRM records, or "New"]
```

### Seller Profile
```markdown
## Seller Record

**Batch Link:** 2026-05-06_GOLD_BUYER_GROUP_ABC

**Seller Name:** [Company name, exact spelling]
**Seller Country:** [Country of operation]
**Seller Region:** [Specific region/city, mine location, warehouse]
**Source Type:** [Miner, Refinery, Exporter, Trader, Scrap Processor, Other]

**Key Contacts:**
1. Name: [First Last], Role: [Title], Focus: [What they handle]
2. Name: [First Last], Role: [Title], Focus: [What they handle]

**Production/Supply Capacity:**
- Primary Commodity: Gold
- Monthly Supply: [Kg or oz per month, if stated]
- Annual Production: [Tons or oz per year, if known]
- Quality Grade: [24K, 22K, 18K, assay %, recycled %, etc.]
- Consistency: [Regular, seasonal, variable]

**Quality Certifications:**
- [ ] Assay certificates available
- [ ] Conflict-free certified
- [ ] ISO certified
- [ ] Refinery certified
- [ ] Third-party tested

**Pricing Information:**
- Quoted Price: [$/kg, $/oz, or spot + premium]
- Minimum Order: [Quantity]
- Payment Terms Proposed: [Advance, COD, Escrow, other]
- Valid Until: [Date, if stated]

**Seller KYC Status:**
- [ ] Started
- [ ] In Progress
- [ ] Completed
- [ ] Escalated for review

**Previous Deals with Seller:** [Link to prior batches, CRM records, or "New"]
```

---

## Commodity/Deal Fields

Track commodity and deal-specific details for future CRM import.

### Commodity Record
```markdown
## Commodity Details

**Batch ID:** 2026-05-06_GOLD_BUYER_GROUP_ABC
**Primary Commodity:** Gold
**Secondary Commodities:** [If any others mentioned]

**Physical Specifications:**
- Form: [Bars, Dust, Ore, Refined, Scrap, Unrefined, Other]
- Total Quantity: [Weight, unit: kg/oz/ton]
- Purity/Grade: [22K, 24K, assay %, fineness, etc.]
- Density/Weight per Unit: [If units are pieces/bars]
- Impurities Identified: [Elements, percentages if known]

**Quality Assay Results:**
- [ ] Assay completed: Yes / No
- [ ] Assay Method: [Fire assay, XRF, ICP, other]
- [ ] Results Attached: Yes / No
- [ ] Assay Lab: [Name, if known]
- [ ] Assay Date: [YYYY-MM-DD]
- [ ] Certified By: [Lab name, certifier]

**Storage & Condition:**
- Current Location: [Warehouse, mine site, refinery, vault, other]
- Container Type: [Sealed bags, steel drums, vault, bulk pile, other]
- Storage Duration: [How long in current location]
- Condition: [Good, compromised, needs inspection, TBD]
- Insurance: [Yes / No / Proposed]

**Logistics & Movement:**
- Ready to Ship: [Yes / No / Date TBD]
- Shipping Method: [Air, Sea, Truck, Rail, Multi-modal]
- Origin Port/Location: [City/Port]
- Destination Port/Location: [City/Port]
- Estimated Transit Time: [Days/weeks]
- Freight Cost: [USD or currency, if quoted]

**Regulatory/Compliance:**
- Conflict Minerals Verified: [Yes / No / Pending]
- Export License Required: [Yes / No / Unknown]
- Import License Required: [Yes / No / Unknown]
- Custom Tariffs Estimated: [Percentage/amount if known]
- Regulatory Concerns: [None / List any]
```

### Deal Record
```markdown
## Deal Details

**Deal ID (Temporary):** 2026-05-06_GOLD_ABC_BUYER_SELLER

**Parties:**
- Buyer: [Company name]
- Seller: [Company name]
- Commodity Broker: [If applicable]

**Commodity:**
- Type: Gold
- Quantity: [Weight, unit]
- Purity: [Grade/assay %]

**Financial Terms:**
- Unit Price: [$/kg or $/oz]
- Total Deal Value: [USD or currency]
- Payment Method: [Bank wire, escrow, other]
- Payment Timeline: [Advance %, upon delivery %, COD]
- Currency: [USD, EUR, other]

**Timeline:**
- Inquiry Date: [YYYY-MM-DD]
- LOI Discussed: [Yes / No / Date]
- IMFPA Expected: [Yes / No / Target date]
- SPA Target: [Target date if known]
- Delivery Target: [Target date if known]

**Current Stage:**
- [ ] Inquiry
- [ ] LOI Stage
- [ ] IMFPA Stage
- [ ] SPA Stage
- [ ] Payment & Delivery
- [ ] Closed

**Next Actions:**
1. [Action], due [Date], owner: [Who]
2. [Action], due [Date], owner: [Who]
3. [Action], due [Date], owner: [Who]

**Deal Risks/Notes:**
- [Risk or note 1]
- [Risk or note 2]
- [Risk or note 3]
```

---

## Missing Information Tracker

As you review the WhatsApp batch, note what information is absent but needed.

**File:** `05_MISSING_INFO_TRACKER.md`

```markdown
# Missing Information Tracker

**Batch ID:** 2026-05-06_GOLD_BUYER_GROUP_ABC

## Critical Missing Data (Blocks Deal Progress)

| Field | Required For | Status | Follow-up Action | Owner | Due Date |
|-------|--------------|--------|-------------------|-------|----------|
| Buyer Legal Name & Address | KYC completion | Missing | Email buyer for official company details | [Name] | 2026-05-10 |
| Assay Certificate | Product verification | Not provided | Request latest assay from seller | [Name] | 2026-05-12 |
| Payment Terms Final | SPA execution | Draft only | Confirm with buyer on advance % | [Name] | 2026-05-09 |
| Shipping Timeline | Delivery planning | TBD | Get seller's production timeline | [Name] | 2026-05-11 |
| Compliance Questionnaire | Regulatory approval | Not started | Send KYC form to buyer | [Name] | 2026-05-08 |

## Important Missing Data (Needed for CRM Context)

| Field | Nice-to-Have | Status | Follow-up Action | Owner | Due Date |
|-------|--------------|--------|-------------------|-------|----------|
| Seller Production Capacity | Supplier profile | Not mentioned | Ask seller about annual output | [Name] | 2026-05-15 |
| Buyer Previous Experience | Risk assessment | Not provided | Query buyer's transaction history | [Name] | 2026-05-14 |
| Freight Quotation | Cost planning | Not available | Get shipping quote from logistics partner | [Name] | 2026-05-13 |
| Insurance Provider | Risk mitigation | Not discussed | Propose insurance options to buyer | [Name] | 2026-05-12 |
| Final Purity Specification | QA | Discussed as "99.9% gold" but not formal spec | Formalize assay target with seller | [Name] | 2026-05-10 |

## Data That Can Be Deferred

- [ ] Detailed mining history (not needed before IMFPA)
- [ ] Buyer's full shareholder list (not needed before SPA)
- [ ] Seller's environmental certifications (needed for compliance but not blocking intake)
- [ ] Historic transaction data (nice-to-have for relationship context)
```

---

## Approval Queue Template

This template tracks the intake batch through human review and approval before CRM entry.

**File:** `06_REVIEW_CHECKLIST.md`

```markdown
# Pre-CRM Approval Checklist

**Batch ID:** 2026-05-06_GOLD_BUYER_GROUP_ABC
**Submitted By:** [Your name]
**Submission Date:** [YYYY-MM-DD]

## Intake Completeness

- [ ] **Text Export Complete:** WhatsApp messages exported in full date range
- [ ] **Media Organized:** All referenced files located and sorted by category
- [ ] **Metadata Filled:** 00_METADATA.md completed with batch identity
- [ ] **Classification Done:** All content manually sorted into 03_CLASSIFIED_CONTENT/
- [ ] **Sensitive Flagged:** 04_SENSITIVE_INFO_REPORT.md completed

## Data Quality Checks

- [ ] **Buyer Information Consistent:** No conflicting company names or roles
- [ ] **Seller Information Consistent:** No conflicting source names or capacities
- [ ] **Pricing Clear:** Unit price, quantity, and total value reconcile
- [ ] **Timeline Realistic:** Proposed delivery date is feasible given current stage
- [ ] **Contacts Valid:** Names and roles match industry standards and make sense
- [ ] **Commodity Specs Complete:** Purity, form, and quantity clearly stated

## Compliance Readiness

- [ ] **KYC Not Required Yet:** Batch contains sufficient info for KYC initiation
- [ ] **No Blocked Parties:** No known sanctioned entities or red flags identified
- [ ] **Sensitive Data Handled:** All private info flagged; none leaked into classified content
- [ ] **Conflict Minerals:** No conflict zones or suspicious supply chains noted
- [ ] **Legal Signature:** No unsigned/non-binding documents imported as final terms

## CRM Mapping Readiness

- [ ] **Buyer Matches Existing Record OR New Entry Ready:** Buyer linkable or creatable
- [ ] **Seller Matches Existing Record OR New Entry Ready:** Seller linkable or creatable
- [ ] **Deal Structure Clear:** Buyer/seller pairing, commodity, value, timeline all mapped
- [ ] **Missing Info Tracked:** 05_MISSING_INFO_TRACKER.md lists follow-ups, not roadblocks
- [ ] **Next Actions Defined:** Clear owner and due dates for follow-ups

## Human Review Sign-Off

### Initial Intake Review (Within 24 hours of submission)

**Reviewer Name:** ___________
**Review Date:** ___________
**Review Status:**
- [ ] Approved for CRM import
- [ ] Approved with conditions (list below)
- [ ] Rejected — needs revision (list issues below)

**Comments:**
_____________________________________________________________________
_____________________________________________________________________

### Senior Review (For deals > $100K or new buyer/seller)

**Senior Reviewer Name:** ___________
**Review Date:** ___________
**Review Status:**
- [ ] Approved
- [ ] Needs clarification (list below)
- [ ] Hold pending (reason: __________________)

**Comments:**
_____________________________________________________________________
_____________________________________________________________________

## Final Approval

**Approved For CRM By:** ___________
**Date Approved:** ___________
**CRM Import Planned For:** [YYYY-MM-DD]

**Any Deviations from Standard Import:**
_____________________________________________________________________

---

## Approval Queue Status

- [ ] **Submitted:** [Date]
- [ ] **Initial Review Complete:** [Date]
- [ ] **Revisions Requested:** [Yes/No] — [Date completed if yes]
- [ ] **Senior Review Complete:** [Yes/No] — [Date]
- [ ] **Final Approval:** [Date]
- [ ] **Ready for CRM Entry:** [Yes/No]
```

---

## Human Review Rules

When reviewing a WhatsApp intake batch before CRM entry, follow these rules:

### Rule 1: Flag Buyer & Seller Identity
- Check names against global sanctions lists (OFAC, EU, UN) — flag if matches found
- Note any contradictions between stated and inferred business type for review
- Flag if buyer/seller roles seem reversed or unclear

### Rule 2: Note Commodity Specifications Clarity
- Flag if purity/grade is not stated in measurable units (%, K, assay)
- Flag if quantity is missing or ambiguous
- Flag if form is unclear (bars, dust, ore, scrap, refined, unrefined)
- Flag if assay result is claimed but certificate is missing

### Rule 3: Cross-Check Financial Terms
- Check if unit price × quantity ≈ total deal value (rough sanity check)
- Flag if payment method seems unusual for the deal size or stage
- Flag if payment timeline contradicts the stated deal stage
- Flag if currency is mixed without clear conversion rate

### Rule 4: Note Timeline Observations
- Note if timeline matches typical deal progression or deviates significantly
- Typical ranges: Inquiry → LOI (1-4 weeks), LOI → IMFPA (2-6 weeks), IMFPA → SPA (1-4 weeks), SPA → Delivery (1-3 months)
- Flag any stage that seems unusually fast or stalled

### Rule 5: Note Non-Circumvention Awareness
- Check if buyer/seller have discussed direct dealing
- Flag if non-circumvention clause clarity is uncertain
- Note if broker/middleman role is ambiguous

### Rule 6: Identify Potential Concerns
- **Pressure tactics:** Rushed timelines, artificial scarcity claims
- **Unclear financing:** References to loans, crypto, or unusual payment routes
- **Identity inconsistencies:** Changing names, roles, or company details mid-conversation
- **Compliance hesitation:** Resistance to KYC, IMFPA, or escrow requests
- **Unrealistic promises:** Claims of unlimited supply, delivery speed incompatible with stated logistics

Flag these for human review; do not assume fraud.

### Rule 7: Protect Sensitive Data
- Verify that NO personal IDs, bank details, or compliance docs are in classified content
- Confirm that SENSITIVE_INFO_REPORT.md uses only flag statements, no actual data
- Check that classified content files contain no phone numbers or home addresses
- Mark archive folder for offline/secure storage only

### Rule 8: Validate Attachment References
- Every reference to a PDF, image, voice note, or video in classified content should have a corresponding file in 02_MEDIA/
- Flag missing attachments in MISSING_INFO_TRACKER.md
- Note if attachment is corrupted/unreadable

### Rule 9: Note Batch Consistency
- Check buyer narrative across messages for consistency or obvious contradictions
- Check seller's product specs (purity, quantity, price) for consistency across offers
- Verify deal timeline flow (no SPA signed before IMFPA, per hard rule)

### Rule 10: Approve, Escalate, or Hold
- **Approve:** Batch is complete, internally consistent, and ready for CRM import
- **Escalate:** Batch contains items flagged for review, missing data, or sensitive data that needs Dean attention
- **Hold:** Batch has missing critical operational data or unexplained contradictions

---

## Operational Priority Levels

Not every WhatsApp message has operational value. The purpose of intake is signal extraction, not total archival obsession.

Prioritize intake by operational urgency:

### Priority 1: Active Deal Signal
- [ ] Active buyer/seller discussions (current week)
- [ ] Current deal documents (LOI, IMFPA drafts, pricing sheets)
- [ ] Current pricing quotes and specifications
- [ ] Assay results and quality certifications
- [ ] Shipping/logistics updates or confirmations
- [ ] Payment term discussions in progress

**Action:** Extract completely. Flag for immediate review. Escalate if decision-ready.

### Priority 2: Historical Context
- [ ] Earlier conversations in same deal thread (past 2-3 weeks)
- [ ] Older expired deals (reference only; low operational value)
- [ ] General networking group discussions (initial contact context)
- [ ] Market intelligence or commodity price discussions
- [ ] Non-critical follow-ups or administrative messages

**Action:** Extract summary. Flag for reference only. Include in batch but do not delay approval.

### Priority 3: Noise
- [ ] Memes, casual chat, unrelated media
- [ ] Duplicate messages or forwarded content
- [ ] Off-topic conversations (sports, weather, personal)
- [ ] System notifications or group management messages

**Action:** Exclude from intake. Do not organize or classify.

**Principle:** Stop looking for "everything." Extraction is about capturing deal signal clearly, not achieving 100% archival completeness.

---

## What NOT to Process Yet

**Do NOT process the following categories yet.** These are reserved for future automation, database design, or separate workflows:

### Not Yet Automated
- [ ] Automatic entity matching (buyer/seller de-duplication)
- [ ] Automatic assay data extraction from PDFs
- [ ] Automatic pricing intelligence or market comparison
- [ ] Automatic compliance risk scoring
- [ ] Automatic document OCR or text extraction from images

### Not Yet Integrated with CRM
- [ ] Automatic deal creation in CRM
- [ ] Automatic contact creation or linking
- [ ] Automatic timeline prediction
- [ ] Automatic commission calculation
- [ ] Automatic task assignment to team members

### Not Yet Autonomous Operations
- [ ] Autonomous customer responses (no chatbot replies to WhatsApp groups)
- [ ] Autonomous deal negotiation (no automatic counter-offers or terms proposals)
- [ ] Autonomous pricing recommendations (no pricing suggestions without human review)
- [ ] Automatic buyer credibility scoring (no AI-generated legitimacy assessments)

### Not Yet Part of n8n Workflows
- [ ] WhatsApp message forwarding or archival to Supabase
- [ ] Media file cloud upload or permanent storage
- [ ] Automatic email notifications to team
- [ ] Slack integration or deal alerts
- [ ] Calendar event creation for follow-ups

### Not Yet Supported Commodities
- [ ] While template supports "future commodities beyond gold," do NOT process batches for:
  - Cobalt, copper, lithium, tin (no buyer/seller matching rules yet)
  - Diamonds (different market, compliance, and logistics)
  - Iron ore (bulk commodity, different pricing model)
- Process gold batches only until commodity-specific rules are defined

### Not Yet Handled Formats
- [ ] Audio transcription of voice notes (manual notes only for now)
- [ ] Video summarization or keyframe extraction
- [ ] Handwritten document scanning/OCR
- [ ] Encrypted or password-protected PDFs
- [ ] Multiple-language translations (English only for now)

### Not Yet Policy Areas
- [ ] Commission tracking or disputes
- [ ] Referral attribution or bonus calculation
- [ ] Multi-party deal structures (only buyer-seller pairs for now)
- [ ] Sub-broker or agent relationships
- [ ] Financing or payment guarantees

---

## Example: Gold Deal Intake Batch

This is a real-world example of how to organize and classify a WhatsApp gold buyer/seller group.

### Batch Identity
```
Folder: 2026-05-01_GOLD_BUYER_ACME_INDUSTRIES/

Context:
- Acme Industries (South Korea buyer) inquired about 500 kg of 22K gold bars
- Connected via introduction from broker
- Discussion started 2026-04-10 in group "Acme Gold Import Group"
- Buyer has shown serious interest; shared company details
- Seller (West African miner) responsive and has samples
- Multiple media files: assay cert, company registration, production timeline
```

### Folder Structure
```
2026-05-01_GOLD_BUYER_ACME_INDUSTRIES/
├── 00_METADATA.md
│   └── [Pre-filled with batch details]
│
├── 01_TEXT_EXPORT/
│   └── messages_20260501_1200.txt
│       └── [450 messages, 2026-04-10 to 2026-05-01]
│
├── 02_MEDIA/
│   ├── certificates/
│   │   ├── assay_gold_purity_22k_batch_2026_001.pdf
│   │   └── seller_company_registration_20260415.pdf
│   │
│   ├── test_results/
│   │   ├── xrf_assay_results_batch_2026_001.jpg
│   │   └── density_weight_test_20260420.pdf
│   │
│   ├── contracts/
│   │   ├── draft_loi_acme_seller_20260425.pdf
│   │   └── [NO signed contracts yet]
│   │
│   ├── invoices/
│   │   ├── proforma_invoice_500kg_22k_usd_20260430.pdf
│   │   └── freight_quote_sea_shipment_20260428.pdf
│   │
│   ├── images/
│   │   ├── image_gold_bars_storage_20260418_001.jpg
│   │   ├── image_packaging_container_20260420_001.jpg
│   │   └── image_warehouse_exterior_20260420_002.jpg
│   │
│   ├── voice_notes/
│   │   ├── voicenote_buyer_intro_call_20260410_001.m4a
│   │   └── voicenote_seller_production_timeline_20260425_001.m4a
│   │
│   └── videos/
│       └── [None in this batch]
│
├── 03_CLASSIFIED_CONTENT/
│   ├── buyer_info.md
│   ├── seller_info.md
│   ├── product_specs.md
│   ├── pricing_discussion.md
│   ├── payment_terms.md
│   ├── logistics_notes.md
│   └── compliance_flags.md
│
├── 04_SENSITIVE_INFO_REPORT.md
│   └── [Flags only; no actual data]
│
├── 05_MISSING_INFO_TRACKER.md
│   └── [Lists follow-ups needed]
│
├── 06_REVIEW_CHECKLIST.md
│   └── [Human review sign-off template]
│
└── 07_APPROVED_FOR_CRM.txt
    └── [Timestamp if approved]
```

### Example Metadata Entry

```markdown
# Intake Batch Metadata

## Batch Identity
- **Batch ID:** 2026-05-01_GOLD_BUYER_ACME_INDUSTRIES
- **Created Date:** 2026-05-01
- **Intake Manager:** [Your name]
- **WhatsApp Group Name:** Acme Gold Import Group
- **Group Created Date:** 2026-04-10
- **Primary Commodity:** Gold
- **Estimated Deal Value:** $825,000 USD (500 kg × $1,650/kg)

## Export Details
- **Export Source:** WhatsApp (iOS)
- **Export Date:** 2026-05-01
- **Export Time Range:** 2026-04-10 to 2026-05-01
- **Total Messages:** 450
- **Total Media Files:** 12
- **Export Format:** .txt + media folder

## Primary Participants
- **Buyer Organization:** Acme Industries (South Korea)
- **Seller Organization:** West African Gold Collective (Ghana)
- **Buyer Contact:** Park Min-jun, Procurement Manager
- **Seller Contact:** Kwesi Osei, Production Manager
- **Group Admin:** Broker intermediary (role unclear)

## Deal Status
- **Approximate Stage:** LOI Stage (verbally agreed, document pending signature)
- **Last Activity Date:** 2026-05-01 13:30 UTC
- **Next Expected Action:** Buyer to sign LOI and return within 48 hours

## Classification Status
- **Buyer Info Extracted:** [X] Yes [ ] No [ ] Partial
- **Seller Info Extracted:** [X] Yes [ ] No [ ] Partial
- **Product Specs Extracted:** [X] Yes [ ] No [ ] Partial
- **Pricing Extracted:** [X] Yes [ ] No [ ] Partial
- **Sensitive Info Flagged:** [X] Yes [ ] No

## Intake Approval
- **Human Review Date:** 2026-05-02 (pending)
- **Approved by:** [TBD]
- **Approval Date:** [TBD]
- **Ready for CRM Entry:** [ ] Yes [ ] No (awaiting review)
```

### Example Classified Content: buyer_info.md

```markdown
# Buyer Information Extract

**Batch:** 2026-05-01_GOLD_BUYER_ACME_INDUSTRIES

## Company Profile
**Company Name:** Acme Industries Co., Ltd.
**Company Type:** Gold Importer & Refinery
**Country:** South Korea
**City:** Seoul
**Business Focus:** Precious metals import and refinement; local distribution to jewelry manufacturers

## Key Contacts
1. **Park Min-jun** — Procurement Manager
   - Role: Lead negotiator for gold acquisition
   - Communication Style: Professional, responsive (replies within hours)
   - Decision-Making Authority: Yes (based on urgency of communications)

2. **Kim Soo-hwa** — Finance Manager
   - Role: Payment terms discussion, authorization
   - Communication Style: Formal, deliberate
   - Decision-Making Authority: Confirmed payment authority

## Stated Requirements
- **Commodity:** Gold
- **Form:** Bars (cast or refined)
- **Quantity:** 500 kg minimum; interested in 1,000 kg if price favorable
- **Purity:** 22K minimum (99% fine)
- **Quantity Timeline:** First shipment in 90 days; repeat quarterly if quality confirmed
- **Payment Method:** Bank wire (50% advance, 50% upon delivery)
- **Shipping Method:** Sea freight (cost-sensitive)

## Buyer Credibility Assessment
- [X] Professional communication
- [X] Quick response time (< 4 hours typical)
- [X] Specific requirements (not vague inquiry)
- [X] Company details verifiable (Korea Trade Commission registration provided)
- [X] Multiple decision-makers engaged (procurement + finance)
- [X] Serious timeline commitment (quarterly repeat potential)

**Credibility Score:** High

## Previous Transaction History
- New buyer to this seller
- Acme Industries reports 5+ years in gold importing; no prior transactions with PentraCore

## KYC Status
- KYC not yet started
- Buyer ready to provide compliance documentation
- No red flags noted

## Risk Factors
- None identified so far
- Buyer communication consistent and transparent

## Next Actions
1. Send KYC questionnaire (owner: Dean, due: 2026-05-03)
2. Confirm LOI signature date (owner: Park Min-jun, due: 2026-05-02)
3. Prepare IMFPA template for buyer review (owner: Dean, due: 2026-05-05)
```

---

## Recommended First Manual Workflow

Start simple. This is your first test of the intake process. Do not over-engineer it.

### Step 1: Export
- Export one active WhatsApp group (gold buyer/seller, current discussions only)
- Keep only last 2-4 weeks of messages
- Create batch folder: `whatsapp-intake/YYYY-MM-DD_COMMODITY_BUYER_SELLER/`

### Step 2: Organize Media
- Create `02_MEDIA/` subfolders (certificates/, invoices/, images/, etc.)
- Sort media by type and date
- Do not process every single message; focus on deal-relevant files

### Step 3: Fill Metadata
- Complete `00_METADATA.md` with batch identity and participant names
- Note deal stage (inquiry, LOI, IMFPA, SPA)
- Estimate deal value if clear

### Step 4: Classify Content
- Create `03_CLASSIFIED_CONTENT/buyer_info.md` — extract buyer company, contacts, stated requirements
- Create `03_CLASSIFIED_CONTENT/seller_info.md` — extract seller company, supply capacity, pricing
- Create `03_CLASSIFIED_CONTENT/product_specs.md` — commodity, quantity, purity, assay results
- Create `03_CLASSIFIED_CONTENT/pricing_discussion.md` — unit price, total value, payment method
- Skip the other categories if they're not in this batch; you can add them later

### Step 5: Flag Sensitive Info
- Create `04_SENSITIVE_INFO_REPORT.md`
- List categories only (no actual data)
- Example: "Bank details present — human review required"

### Step 6: Human Review
- Self-review using `06_REVIEW_CHECKLIST.md`
- Check: Is buyer clear? Is seller clear? Is price clear? Are specs clear?
- If yes, mark as approved

### Step 7: Optional CRM Import
- You can now optionally import this batch into the CRM later
- Or just use it as a reference document

**Time estimate:** 1-2 hours for a 2-week batch with 8-10 key messages.

**Expected output:** One folder with clear buyer, seller, commodity, and pricing signal. No automation. No guarantees. Just clarity.

---

## Core Principle

**The goal is to improve organizational memory and deal clarity — not to replace human commercial judgment.**

This template is a tool for organizing WhatsApp signal so that you can see patterns, track deal progress, and avoid re-reading the same messages. It is not:
- A fraud detection system
- A compliance validation engine
- A deal recommendation tool
- A substitute for your own assessment of buyer/seller legitimacy

Use it to see what is actually being discussed in WhatsApp groups. Use your judgment to decide what to do with that signal.

---

## Immediate Next Action

You now have a complete WhatsApp intake workflow template.

### Step 1: Review This Template
- Read through all sections
- Provide feedback on structure, clarity, or missing elements
- Confirm if adjustments are needed

### Step 2: Save Locally (When Ready)
Once approved, this file will be saved to:
```
/Users/deanfox/Desktop/Pentacore/pentracore-crm/WHATSAPP_INTAKE_WORKFLOW_TEMPLATE.md
```

### Step 3: Use as Manual Process (Phase 1)
- Print or reference this template for organizing WhatsApp batches
- Create intake batch folders following the structure
- Extract and classify content manually (no automation yet)
- Use example gold batch as reference

### Step 4: Future Integration (Phase 2)
- Once manual process is validated, design n8n workflows to:
  - Auto-organize media by category
  - Extract structured data (buyer, seller, commodity, pricing)
  - Validate for compliance flags
  - Create CRM records in bulk
  - Notify team of pending approvals

### What Comes Next
After this template is approved:
1. Test template on one real gold batch (manual intake)
2. Document learnings and template adjustments
3. Design n8n WhatsApp intake automation
4. Build CRM data import pipeline
5. Create front-end WhatsApp intake UI

---

**Template Version:** 1.0  
**Created:** 2026-05-06  
**Status:** Review pending
