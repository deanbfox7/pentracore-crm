# PentraCore CRM: Safe AI Coding Instructions

**Project:** PentraCore International commodity CRM (Deal tracking, KYC/NCNDA/LOI/SPA document management, buyer/seller verification)  
**Owner:** Dean (operations coordinator)  
**Date:** 2026-05-11  
**Status:** Production (deals in execution; changes must preserve stability)

Parent memory: `/Users/deanfox/Desktop/Pentacore/CLAUDE.md`

---

## APP STRUCTURE

**Type:** Next.js 14 app with Supabase (auth + PostgreSQL)

**Two isolated systems:**
- `/knowledge` — Public shareholder/company knowledge base (not modified by bot)
- `/crm` — Private CRM (Dean-only; operational deals + documents)

**Key directories:**
- `/app/crm/` — Deal pages, analytics
- `/app/api/crm/` — Deal/counterparty/document APIs
- `/lib/auth-context.tsx` — Auth logic (do not modify)
- `/supabase/` — Database schema + migrations

---

## CODING DISCIPLINE (KARPATHY-STYLE)

### RULE #1: SMALLEST SAFE CHANGE FIRST

**Before coding anything:**
1. Read the relevant file completely
2. Identify the smallest change that solves the problem
3. Explain the exact file path + line numbers in your response
4. Get approval before touching code

**Example (DO NOT DO THIS):**
```
I'll refactor the entire deals API to add filtering.
```

**Example (DO THIS):**
```
File: /app/api/crm/deals/route.ts, lines 10-16
Change: Add `query` parameter to GET; filter by deal_name if provided
Before reading code: Explain what will change and verify it doesn't break existing calls
```

### RULE #2: INSPECT BEFORE EDITING

**Always read the full file first.** Use the Read tool to understand:
- Current logic
- Dependencies
- Error handling
- What data flows in/out

**Never assume.** If you're unsure, ask: "Should I check for X before making this change?"

### RULE #3: PRESERVE EXISTING FUNCTIONALITY

**Existing CRM must keep working.** Before any change:
- Check: What existing code depends on this?
- Check: Will this break API contracts?
- Check: Does auth/verification still work?
- Test: Run `npm run build` to verify no TypeScript errors

**If you can't guarantee preservation, ask first.**

### RULE #4: AVOID LARGE REWRITES

**No "let me rebuild this component" unless explicitly asked.**

Bad:
- Rewriting 500 lines of deal tracking logic
- Completely restructuring the database schema
- Moving API endpoints to different folders

Good:
- Adding a 10-line filter to existing query
- Adding one new database column (with migration)
- Adding a new route alongside existing ones

### RULE #5: EXPLAIN FILE PATHS BEFORE CHANGING ANYTHING

**Template before editing:**
```
I'm going to modify:
- File: /app/api/crm/deals/route.ts
- Lines: 25-35
- Change: Add optional buyer_name filter to GET query
- Why: Enable filtering deals by buyer
- Risk: None (optional parameter, existing code path unchanged)
```

---

## WHAT NEVER CHANGES

🔴 **NEVER:**
- Edit `.env.local` (contains secrets)
- Modify `/lib/auth-context.tsx` (breaks all auth)
- Change Supabase RLS policies without asking
- Touch `/app/page.tsx` login page
- Run destructive migrations without approval
- Add external API dependencies (Claude, ChatGPT, Stripe, etc.)

🟡 **ONLY WITH APPROVAL:**
- Database schema changes (requires migration + testing)
- Authentication flow changes
- API contract changes (dealId → deal_id, etc.)
- Changes to `/crm` page access restrictions

---

## PENTRACORE CONTEXT

**What this CRM tracks:**
- Deals (coal, copper, chrome, iron ore, PGM commodities)
- Buyers (Japanese, Chinese, South Africa buyers)
- Sellers (Orathu, FGMS, Shatadi, etc.)
- Documents: NCNDA, LOI, FCO, SPA, IMFPA, KYC
- Deal stages: inquiry → opportunity → LOI → FCO → SPA → execution

**Critical gates:**
- NCNDA signed before LOI
- KYC complete before SPA
- IMFPA signed before SPA
- Buyer company verified (not phantom)
- Seller bank details confirmed

**Why this matters:**
- Live deals ($14-15M at risk)
- Regulatory compliance (KYC/AML)
- Deal closure deadlines (May 10 for coal, May 13 for copper)
- Operational visibility for Dean and CEO (Alex)

**Never invent deal data.** Only read from Supabase.

---

## CURRENT PROJECT PRIORITIES (IN ORDER)

1. **Deal Readiness Panel** — Show at a glance: which deals are signature-ready, which are blocked, why
2. **Internal Deal Assistant** — Chat interface to query deal status, missing docs, next actions
3. **Document generation improvements** — Better NCNDA/LOI/SPA/KYC templates
4. **Operational tracking** — Timeline visibility, deadline tracking
5. **Future: Autonomous outreach** — NOT YET (requires manual approvals first)

**Current work:** Building deal readiness assessment (which deals close this week?)

---

## TESTING & VERIFICATION

**Before committing any change:**

```bash
# 1. Check TypeScript errors
npm run build

# 2. Test the specific change
npm run dev
# Visit affected route in browser
# Verify: Data displays, no console errors

# 3. Check API contracts
# If modifying /api/crm/*, verify existing calls still work

# 4. Review file diffs
# Show the exact before/after code
```

**If any of these fail, do not commit.**

---

## COMMANDS

```bash
# Development
npm run dev                          # Start local server (port 3000)
npm run build                        # Build for production + type-check

# Database
node scripts/build-manual-supabase-sql.mjs    # Build SQL migrations
bash scripts/push-supabase-sql.sh             # Push to remote Supabase

# Never run without asking:
# - Destructive migrations
# - npm run build after major changes (verify locally first)
```

---

## IMPORTANT ROUTES & FILES

**Pages:**
- `/` — Login page (do not modify)
- `/knowledge` — Public knowledge base
- `/crm` — CRM dashboard (Dean-only, auth protected)
- `/crm/deals` — Deal list
- `/crm/deals/[dealId]` — Deal detail
- `/crm/analytics` — Analytics (deal summary)
- `/crm/assistant` — Internal deal assistant (under development)

**APIs:**
- `/api/crm/deals` — GET all deals, POST new deal
- `/api/crm/counterparties` — GET buyers/sellers, POST new
- `/api/crm/deals/[dealId]/documents` — Document tracking
- `/api/crm/deals/[dealId]/generate-*` — Generate NCNDA, LOI, SPA, IMFPA, KYC

**Database schema:** `dean_crm` (deals, counterparties, documents, opportunities)

---

## SECRETS & SECURITY

**NEVER:**
- Print `.env.local` contents
- Commit secrets to git
- Expose Supabase service-role keys
- Log sensitive data (buyer names in production logs OK, bank details NOT OK)

**Safe to reference:**
- Deal names (Coal RB3, Copper Cathode, etc.)
- Buyer/seller company names (Orathu, FGMS, etc.)
- Commodity types (coal, copper, chrome)
- Deal stages and dates

---

## COMMON CHANGES (SAFE PATTERNS)

**Safe to do without approval:**

✅ Add a new optional field to a form (no schema change)  
✅ Add filtering/sorting to existing list view  
✅ Improve UI display (colors, tooltips, layout)  
✅ Fix TypeScript errors  
✅ Add console logging for debugging  
✅ Simplify existing code (no behavior change)  

**Requires approval:**

🟡 Add new database column (schema migration)  
🟡 Change API response format (breaking change)  
🟡 Modify authentication logic  
🟡 Add new external service integration  

---

## WORKFLOW

**For every change:**

1. **Inspect** — Read the file(s) you'll modify completely
2. **Explain** — State the file path, lines, and exact change
3. **Verify** — `npm run build` to check TypeScript
4. **Show diffs** — Present the before/after code
5. **Test** — Confirm the change works locally (`npm run dev`)
6. **Report** — Explain what changed and why

**Example workflow:**
```
I want to add a "Deal Status" column to the deals list.

File: /app/crm/deals/page.tsx, lines 120-140
Change: Add <td>{deal.stage}</td> to the table row
Why: Provides quick visibility into deal progression stage
Risk: None (read-only display, no data changes)

Before/after:
- Before: Only showing deal name and commodity
- After: Also showing deal stage (inquiry, opportunity, LOI, FCO, SPA, execution)

TypeScript check: npm run build ✓ (no errors)
Local test: npm run dev → /crm/deals → new column visible ✓
```

---

## CURRENT STATE

- ✅ CRM is functional and in production (live deals)
- ✅ Auth system working (Dean-only access)
- ✅ Deal tracking API complete
- ✅ Basic document generation working
- 🔄 Deal readiness assessment in progress
- ⏸️ Internal assistant bot (queued)

**Last change:** Added deal readiness logic to help identify signature-ready deals

---

## IF SOMETHING BREAKS

**STOP IMMEDIATELY.** Do not commit.

1. **Identify what broke** — Which endpoint? Which page?
2. **Revert the change** — Go back to last working state
3. **Explain the error** — Show the exact error message
4. **Ask for help** — Describe what you tried and what failed
5. **Do NOT** — Try to "fix it with another change"

---

## APPROVAL & ESCALATION

**For small changes (adding a field, fixing a bug):**
- Make the change, explain it, test it
- No approval needed if TypeScript passes + functionality preserved

**For medium changes (new API endpoint, new form):**
- Explain the change first
- Get feedback before coding

**For large changes (schema changes, auth modifications):**
- Ask Dean (via narrative explanation) before starting
- Wait for explicit approval

**For anything uncertain:**
- Ask first, code later
- Better to over-communicate than break production

