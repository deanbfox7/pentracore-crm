# PentraCore Intelligence Cleanup Plan
**Date:** May 14, 2026  
**Status:** INSPECTION COMPLETE — AWAITING APPROVAL BEFORE EXECUTION  
**Goal:** Establish single source of truth, eliminate duplicates and stale exports, organize by freshness and operational relevance

---

## EXECUTIVE SUMMARY

**Current State:** Extreme duplication across 4 locations (Desktop, Downloads, iCloud Drive, Documents). 40+ WhatsApp export versions. Multiple obsolete spreadsheet iterations. Old intelligence reports scattered and superseded.

**Scope:** 
- ✅ DO move/organize files
- ❌ DO NOT delete permanently (archive instead)
- ❌ DO NOT touch code, .env.local, or CRM app files
- ❌ DO NOT move active work in progress

**Critical Artifacts (KEEP CURRENT):**
1. `WhatsApp Chat - Commodity Supply EXG - Renier (15).zip` (Latest = May 14, Downloads)
2. `WhatsApp Chat - ADMIN&LEGAL&MARKETING PENTRACORE (14).zip` (Latest = May 14, iCloud)
3. Three active delta reports in CRM repo (MAY14_DELTA_INGESTION_REPORT, TOP_10_OPERATIONAL_CHANGES, DELTA_MATRIX_UPDATES_NEEDED)
4. `PentraCore_Operations_CommandCenter_MAY15_LATEST_CLEAN.xlsx` (Desktop root)

---

## PROPOSED STRUCTURE

```
/Users/deanfox/Desktop/Pentacore/pentracore-crm/

CURRENT_SOURCE_OF_TRUTH/
  ├── LATEST_WHATSAPP_EXPORTS/
  │   ├── WhatsApp Chat - Commodity Supply EXG - Renier (15).zip [CURRENT]
  │   └── WhatsApp Chat - ADMIN&LEGAL&MARKETING PENTRACORE (14).zip [CURRENT]
  │
  ├── ACTIVE_SPREADSHEET/
  │   ├── PentraCore_Operations_CommandCenter_MAY15_LATEST_CLEAN.xlsx [CURRENT]
  │   └── PentraCore_Operations_CommandCenter_MAY15_EXECUTIVE_COCKPIT.xlsx [CURRENT]
  │
  ├── ACTIVE_REPORTS/
  │   ├── MAY14_DELTA_INGESTION_REPORT.md [339 lines, comprehensive]
  │   ├── TOP_10_OPERATIONAL_CHANGES_MAY14.md [295 lines, ranked]
  │   ├── DELTA_MATRIX_UPDATES_NEEDED.md [249 lines, surgical]
  │   └── PENTRACORE_INTELLIGENCE_SYSTEM_PLAN.md [34K, architecture]
  │
  └── ACTIVE_DOCUMENTS/
      └── (Link to current LOI, KYC templates, etc.)

ARCHIVE_OLD_INTELLIGENCE/
  ├── OLD_WHATSAPP_EXPORTS/
  │   ├── ADMIN_numbered_versions/ (versions 1-13)
  │   ├── EABC_Global_versions/
  │   ├── Shaun_Jerome_versions/
  │   ├── Renier_earlier_versions/
  │   └── README_VERSION_LOG.txt
  │
  ├── SUPERSEDED_REPORTS/
  │   ├── PentraCore_Intelligence_System_old_May7/ (40+ markdown files)
  │   ├── MICRO_DELTA_ADMIN11_EXG12_MAY15.md
  │   ├── LATEST_COMMANDCENTER_DELTA_LOG_MAY15.md
  │   ├── WHATSAPP_DELTA_UPDATE_MAY15.md
  │   ├── ALEX_PRIORITY_DELTA_MAY15.md
  │   └── README_REPORT_HISTORY.txt
  │
  ├── OLD_SPREADSHEETS/
  │   ├── PentraCore_Operations_CommandCenter_MAY15_LATEST.xlsx (v1)
  │   ├── PentraCore_Operations_CommandCenter_MAY15_ALEX_READY.xlsx
  │   ├── PentraCore_Operations_CommandCenter_MAY15_FINAL_CLEAN_LAYOUT.xlsx
  │   ├── Old_03_ARCHIVE_LOW_PRIORITY_versions/
  │   └── README_SPREADSHEET_VERSIONS.txt
  │
  ├── DUPLICATES_REVIEW/
  │   ├── iCloud_extracted_folders/ (ADMIN 1, 2, 3)
  │   ├── Gold_Supply_duplicates/
  │   ├── Documents_folder_copies/
  │   └── README_DUPLICATES.txt
  │
  ├── OLD_PDFS/
  │   ├── LOI_versions/ (multiple drafts of same LOI)
  │   ├── Mandate_agreements/
  │   ├── Generated_reports_May_early/
  │   └── README_PDF_ARCHIVE.txt
  │
  └── WORKSPACE_LEGACY/
      ├── /Users/deanfox/PentraCore/ copy
      ├── Old_downloads/
      └── iCloud_Drive_legacy_zips/ (Gold, NB, etc.)
```

---

## DETAILED FILE INVENTORY

### SECTION 1: WHATSAPP EXPORTS (Location: Scattered — Downloads, iCloud, Documents)

#### Current (KEEP IN PLACE, SYMLINK TO CURRENT_SOURCE_OF_TRUTH)
| File | Location | Size | Date | Status |
|------|----------|------|------|--------|
| WhatsApp Chat - Commodity Supply EXG - Renier (15).zip | /Users/deanfox/Downloads | ~20M | May 14 14:35 | ✅ CURRENT |
| WhatsApp Chat - Commodity Supply EXG - Renier.zip | /Users/deanfox/Downloads | ~20M | May 14 14:35 | ✅ CURRENT (duplicate name in same folder) |
| WhatsApp Chat - ADMIN&LEGAL&MARKETING PENTRACORE (14).zip | iCloud Drive | ~20M | May 14 21:18 | ✅ CURRENT |

#### Old/Duplicate (ARCHIVE TO: ARCHIVE_OLD_INTELLIGENCE/OLD_WHATSAPP_EXPORTS/)

**ADMIN Group Versions (iCloud Drive — 24 files):**
- Versions 1-14 numbered ZIPs: sizes range 8.9K to 20M, dates May 11-14
- "Original" (8.9M, May 7) — earliest version
- "Updated" variant (May 11)
- **ACTION:** Keep ONLY version (14) as current. Archive versions 1-13 + originals.
- **REASON:** Incremental exports with new messages appended; (14) is complete.

**EABC Global Commodity Supply (iCloud Drive — 4 files):**
- Versions 1, original, "Updated", "updated" (typo variant)
- Sizes: 1.7M to 2.1M, dates May 12-13
- **ACTION:** Unclear which is true latest (no version 15). Archive all. Note: May not have corresponding Renier export.

**Shaun Jerome Arrons PentraCore (iCloud Drive — 5 files):**
- Versions 1, 2, 3, original, "Updatedd" (typo)
- Sizes: 2.5M to 3.6M, dates May 7-13
- **ACTION:** Archive all (lower operational priority; Renier/ADMIN are critical path).

**Renier Earlier Versions (Documents folder):**
- WhatsApp Chat - Commodity Supply EXG - Renier.zip (Documents root)
- **ACTION:** Archive (older copy, Downloads has current).

**Extracted Folders (iCloud Drive):**
- WhatsApp Chat - ADMIN&LEGAL PENTRACORE (1, 2, 3) — Folders
- **ACTION:** Archive extracted versions; keep only ZIPs. Extract as needed from (14).

#### Risky/Verify
- EABC Global (4 versions) — unclear if we need all 4, may be test exports. Requires user confirmation of which is "golden."

---

### SECTION 2: ACTIVE SPREADSHEETS (Location: Desktop root, subdirectories)

#### Current (KEEP IN PLACE, COPY TO CURRENT_SOURCE_OF_TRUTH)
| File | Location | Size | Date | Status |
|------|----------|------|------|--------|
| PentraCore_Operations_CommandCenter_MAY15_LATEST_CLEAN.xlsx | /Users/deanfox/Desktop | 52K | May 14 16:39 | ✅ CURRENT |
| PentraCore_Operations_CommandCenter_MAY15_EXECUTIVE_COCKPIT.xlsx | /Users/deanfox/Desktop | 52K | May 14 14:20 | ✅ CURRENT |
| PentraCore_Operations_CommandCenter_MAY15_LATEST_CLEAN.xlsx (iCloud) | iCloud Drive | 52K | May 14 16:25 | ✅ CURRENT (same file) |

#### Old Versions (ARCHIVE TO: ARCHIVE_OLD_INTELLIGENCE/OLD_SPREADSHEETS/)
| File | Location | Size | Date | Reason |
|------|----------|------|------|--------|
| PentraCore_Operations_CommandCenter_MAY15.xlsx | Desktop | 46K | May 14 14:46 | Earlier MAY15 version |
| PentraCore_Operations_CommandCenter_MAY15_LATEST.xlsx | Desktop | — | — | Version before "LATEST_CLEAN" |
| PentraCore_Operations_CommandCenter_MAY15_FINAL_CLEAN_LAYOUT.xlsx | 03_ARCHIVE_LOW_PRIORITY/old_commandcenter_versions | 52K | — | Archive subfolder version |
| PentraCore_Operations_CommandCenter_MAY15_ALEX_READY.xlsx | 03_ARCHIVE_LOW_PRIORITY/old_commandcenter_versions | — | — | Variant for Alex |

#### Risky/Verify
- Two "CURRENT" versions on Desktop (`MAY15_LATEST_CLEAN.xlsx` and `EXECUTIVE_COCKPIT.xlsx`) — are these both actively used or is one superseded? Requires user confirmation.
- iCloud copy of `MAY15_LATEST_CLEAN.xlsx` — is this actively synced or old backup? User to confirm if it should be removed or kept for sync.
- Lock file: `~$PentraCore_Operations_CommandCenter_MAY15_LATEST_CLEAN.xlsx` (165 bytes, May 14) — temp lock, safe to delete after moving.

---

### SECTION 3: ACTIVE REPORTS (Location: CRM repo root)

#### Current (KEEP IN PLACE)
| File | Lines | Date | Status | Content |
|------|-------|------|--------|---------|
| MAY14_DELTA_INGESTION_REPORT.md | 339 | May 14 21:30 | ✅ CURRENT | Comprehensive WhatsApp delta from May 11 exports |
| TOP_10_OPERATIONAL_CHANGES_MAY14.md | 295 | May 14 21:31 | ✅ CURRENT | Ranked operational changes with P0/P1/P2 priorities |
| DELTA_MATRIX_UPDATES_NEEDED.md | 249 | May 14 21:32 | ✅ CURRENT | Surgical spec for matrix updates (awaiting approval) |
| PENTRACORE_INTELLIGENCE_SYSTEM_PLAN.md | 34K | May 6 18:12 | ⚠️ REFERENCE | Architecture plan; still valid |

#### Old/Superseded (ARCHIVE TO: ARCHIVE_OLD_INTELLIGENCE/SUPERSEDED_REPORTS/)

**Desktop Root (May 15 micro-deltas):**
- MICRO_DELTA_ADMIN11_EXG12_MAY15.md — superseded by full MAY14 reports
- LATEST_COMMANDCENTER_DELTA_LOG_MAY15.md — tactical; superseded by MAY14 comprehensive reports
- WHATSAPP_DELTA_UPDATE_MAY15.md — superseded by MAY14 delta ingestion
- ALEX_PRIORITY_DELTA_MAY15.md — superseded by TOP_10 ranked list

**PentraCore_Intelligence_System/ (May 7 — 40+ files):**
- EXECUTION_BOTTLENECKS.md
- WHATSAPP_CHAOS_TO_STRUCTURE_MAP.md
- TOP_5_LIVE_DEALS.md
- OPERATIONAL_TRUTH_AUDIT.md
- LIVE_DEAL_COMMAND_CENTER.md
- ENTITY_VERIFICATION_QUEUE.md
- DEAL_RISK_REGISTER.md
- COMPLIANCE_GATEWAYS.md
- DEAL_EXECUTION_CHECKLISTS.md
- UNVERIFIED_ENTITIES.md
- VERIFIED_ENTITIES.md
- And ~25 others, all dated May 6-7 23:xx
- **REASON:** Created before current operational approach; superseded by CRM-based workflow and May 14 analysis.

**PentraCore_Intelligence_System/04_NEW_WHATSAPP_EXPORTS_MAY12/:**
- PENTRACORE_MASTER_INTELLIGENCE_MATRIX.md (May 12)
- PDF_READY_2_MASTER_COMMODITY_MATRIX.md (May 12)
- PAUL_MASTER_DEAL_MATRIX_TABLES.md (May 12)
- **REASON:** Older versions of matrices being updated by current work.

#### Risky/Verify
- PENTRACORE_INTELLIGENCE_SYSTEM_PLAN.md — is this still the reference architecture, or replaced by operational practice? User to confirm if archive or keep active.
- Files in /Desktop/01_IMPORTANT_OPERATIONAL_WORKING_FILES/ — check if "IMPORTANT" tag means still in use or historical.

---

### SECTION 4: OLD DOCUMENTS (Location: Downloads, iCloud Drive, /Users/deanfox/PentraCore)

#### PDFs & Documents (ARCHIVE TO: ARCHIVE_OLD_INTELLIGENCE/OLD_PDFS/)

**Downloads (LOI Drafts — identical templates, multiple versions):**
- LOI - Copper PentraCore - JCM MINING LIMITED.pdf (332K, May 6)
- LOI - Copper PentraCore - KALE COOPERATIVE MINERALS SPRL.pdf (332K, May 6)
- LOI - Copper PentraCore - FIRST GRADE MINERALS.pdf (332K, May 6)
- LOI - Thermal Coal Supply-Pentracore-EABC Global Ventures (346K, May 6)
- LOI#CoalSupply... (5 copies, Apr 29-May 6, sizes 323K)
- **ACTION:** Likely template copies for different counterparties. Archive versions 2-5 of coal LOI. Confirm with user whether all 3 copper LOI variants should be archived or are actively compared.

**Downloads (Agreements & Reports):**
- MANDATE COMMISSION AGREEMENT BBD Serving PentraCore (2 versions, 70K each)
- Pentracore Mandate and Com Agreement.pdf (719K)
- PentraCore_Consolidated_Report.pdf (1.4M, Apr 30)
- Pentracore PGM Deal Documents.docx (May 12)
- Pentracore TiO2 Deal Documents.docx (May 12)
- **ACTION:** Archive older versions; check if PGM/TiO2 documents are references or templates.

**Downloads (Metadata & Profile):**
- PENTRACORE INTERNATIONAL - company profile.docx (21K, May 6)
- PentraCore_ Advancing Africa's Mineral Future.png (3.2M, May 6)
- **ACTION:** Company profile — check if current or superseded by knowledge base. Archive if in CRM.

**Downloads (Audio & Old Guides):**
- WhatsApp Audio 2026-04-29 through 05-03 (8 files, 30K-218K) — Audio from commodity supply chats
- pentracore-n8n-guide.docx, _1.docx, _2.docx (19K each, Apr 7)
- PENTRACORE_ECHO_PLAN.md (17K, May 1)
- **ACTION:** Audio files — low priority for archival. n8n guides — check if superseded. ECHO_PLAN — check if active.

**iCloud Drive (Large Legacy ZIPs):**
- Gold (Au) Pentracore.zip (11M)
- Pentracore NB.zip (230M) — likely notebook backup
- Pentracore images, whatsapp images.zip (6.1M)
- PentraCore & WellBud Systems... (3.6K)
- **ACTION:** Likely backups; archive to workspace legacy.

**Old Workspace (/Users/deanfox/PentraCore/):**
- Automation/ scripts (May be reference)
- docs/ (API_SCHEMA.md, SETUP_INSTRUCTIONS.md)
- n8n-workflows/ (phase2-readme)
- Shareholder_Reports/ (May 2 recovered deal intelligence)
- Stakeholders/ (May 2 stakeholder register)
- **ACTION:** Archive as workspace legacy reference.

#### Risky/Verify
- PGM & TiO2 deal documents (May 12) — are these active deal templates or completed examples? User confirmation needed.
- ECHO_PLAN.md — operational or historical? User confirmation.
- Audio files in Downloads — are they reference material or noise? User confirmation before archival.

---

### SECTION 5: QUARANTINE & DUPLICATES (Already partially sorted)

#### Already in Quarantine (REVIEW & MOVE TO ARCHIVE)

**PENTRACORE_CLEANUP_QUARANTINE_MAY14/02_DUPLICATES/:**
- WhatsApp Chat - Gold Supply & Investment Opportunity 🇿🇦.zip (982B)
- WhatsApp Chat - Gold Supply & Investment Opportunity Updated.zip (9.3M)
- WhatsApp with media - Gold Supply & Investment Opportunity 🇿🇦.zip (1.9M)
- **ACTION:** Move to ARCHIVE_OLD_INTELLIGENCE/DUPLICATES_REVIEW/ with log.

**PENTRACORE_CLEANUP_QUARANTINE_MAY14/03_OLD_WORKING_DRAFTS/, 04_FAILED_EXPORTS/, 05_LOW_VALUE_MISC/, 06_KEEP_FOR_REFERENCE/:**
- **ACTION:** Review contents and move to appropriate archive folders per existing categorization.

---

### SECTION 6: WORKSPACE LEGACY (Reference, not operational)

#### Location: /Users/deanfox/PentraCore/

**Likely Archive to: ARCHIVE_OLD_INTELLIGENCE/WORKSPACE_LEGACY/**
- Everything in Automation/ (older routine definitions)
- docs/ (API_SCHEMA.md, SETUP_INSTRUCTIONS.md — check if superseded by current CRM docs)
- n8n-workflows/ (old workflow definitions)
- Shareholder_Reports/ (May 2 — older)
- Stakeholders/ (May 2 — older)

**Risky:**
- May contain references that newer work depends on. Review before archival.

---

## MASTER ARCHIVE LOG (To be created)

After cleanup, create index file: `ARCHIVE_OLD_INTELLIGENCE/ARCHIVE_MANIFEST_MAY14.md`

Contents:
- Date archived: May 14, 2026
- Reason archived: Superseded by May 14 delta analysis and current CRM workflow
- File count by category
- Search index (if file restored, how to find what version)
- Retention policy: Keep 90 days (until Aug 14), then review for permanent deletion

---

## FILES MARKED FOR SPECIAL HANDLING

### 1. Temp Lock File (Safe to delete)
- `~$PentraCore_Operations_CommandCenter_MAY15_LATEST_CLEAN.xlsx` (165 bytes)
- **ACTION:** Delete after organizing spreadsheets.

### 2. Dual-Location Files (Create symlinks or consolidate)
- `WhatsApp Chat - Commodity Supply EXG - Renier.zip` exists in both:
  - /Users/deanfox/Downloads/ (20M)
  - /Users/deanfox/Documents/ (older copy)
- **ACTION:** Keep Downloads version current. Create symlink in CURRENT_SOURCE_OF_TRUTH. Archive Documents copy.

- `PentraCore_Operations_CommandCenter_MAY15_LATEST_CLEAN.xlsx` exists in both:
  - /Users/deanfox/Desktop/ (52K, May 14 16:39)
  - iCloud Drive (52K, May 14 16:25)
- **ACTION:** Confirm if iCloud is synced copy or backup. If synced, leave both. If backup, archive iCloud version.

### 3. Unclear Versions (Require user confirmation)
- EABC Global Commodity Supply (4 versions, unclear which is "true" latest)
- Two concurrent command center spreadsheets (`LATEST_CLEAN` and `EXECUTIVE_COCKPIT`)
- Files in `/Desktop/01_IMPORTANT_OPERATIONAL_WORKING_FILES/` (check if still active)

---

## EXECUTION CHECKLIST (Once approved)

### PHASE 1: Preparation
- [ ] User confirms CURRENT files list
- [ ] User identifies any "Risky/Verify" items that must stay current
- [ ] Create ARCHIVE_OLD_INTELLIGENCE folder structure
- [ ] Create CURRENT_SOURCE_OF_TRUTH folder structure

### PHASE 2: Consolidation
- [ ] Copy current WhatsApp ZIPs to CURRENT_SOURCE_OF_TRUTH/LATEST_WHATSAPP_EXPORTS/
- [ ] Copy current spreadsheets to CURRENT_SOURCE_OF_TRUTH/ACTIVE_SPREADSHEET/
- [ ] Verify 3 active reports are in CURRENT_SOURCE_OF_TRUTH/ACTIVE_REPORTS/
- [ ] Create symlinks from original locations to CURRENT_SOURCE_OF_TRUTH/ for key files

### PHASE 3: Archival
- [ ] Move all old WhatsApp versions to ARCHIVE_OLD_INTELLIGENCE/OLD_WHATSAPP_EXPORTS/
- [ ] Move all old spreadsheet versions to ARCHIVE_OLD_INTELLIGENCE/OLD_SPREADSHEETS/
- [ ] Move old markdown reports to ARCHIVE_OLD_INTELLIGENCE/SUPERSEDED_REPORTS/
- [ ] Move PDFs to ARCHIVE_OLD_INTELLIGENCE/OLD_PDFS/
- [ ] Move duplicates to ARCHIVE_OLD_INTELLIGENCE/DUPLICATES_REVIEW/
- [ ] Move workspace legacy to ARCHIVE_OLD_INTELLIGENCE/WORKSPACE_LEGACY/

### PHASE 4: Documentation
- [ ] Create README files in each archive folder (why, version log, search guide)
- [ ] Create ARCHIVE_MANIFEST_MAY14.md with file count and retention policy
- [ ] Update this cleanup plan with "EXECUTED" timestamp
- [ ] Create symlinks from old locations to archive (optional, for user convenience)

### PHASE 5: Verification
- [ ] Confirm all current files are accessible from CURRENT_SOURCE_OF_TRUTH/
- [ ] Spot-check archive folders for correct categorization
- [ ] Delete temp lock files
- [ ] Update user's working folder links if any

---

## RISK ASSESSMENT

| Risk | Likelihood | Mitigation |
|------|------------|-----------|
| User has active reference to old file | MEDIUM | Phase 1: Get confirmation on "Risky/Verify" items |
| Archive folder becomes unmaintained | LOW | Create retention policy doc |
| Symlinks break if folders moved | MEDIUM | Document symlink locations in manifest |
| Confusion about what's "current" | HIGH | CURRENT_SOURCE_OF_TRUTH/ is single source; README in each section |
| EABC Global exports version confusion | MEDIUM | User to specify which is golden version |
| Dual-location spreadsheet sync issues | MEDIUM | User to clarify iCloud sync intent |

---

## NEXT STEPS

1. **User reviews this cleanup plan** — confirm no files wrongly categorized, no missed items
2. **User approves** — signals to proceed with execution
3. **User specifies "Risky/Verify" decisions** — which files stay active, which versions to keep, EABC export golden version, etc.
4. **Execute PHASE 1-5** — move, archive, document, verify

---

**Status:** ✅ **INSPECTION COMPLETE — AWAITING USER APPROVAL**  
**Date Created:** May 14, 2026  
**Prepared By:** Claude Code (read-only analysis, no files moved yet)
