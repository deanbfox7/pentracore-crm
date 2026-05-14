# PentraCore CRM: Deploy Now (5 minutes)

## What's Ready

✅ Database schema (3 tables, RLS policies, audit logs)  
✅ Seed data (company info, products, services, processes, policies, FAQs, team, market data)  
✅ Deployment automation script  

## Deploy in 5 Steps

### Step 1: Create Supabase Project (2 min)

```bash
# Go to https://supabase.com/dashboard
# Click "New Project"
# Name: pentracore-crm
# Wait for initialization
```

### Step 2: Get Credentials (1 min)

In Supabase Dashboard:
- Go to **Settings → API**
- Copy these 3 values:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (under "Service Role Secret")

### Step 3: Add Credentials to .env.local (30 sec)

```bash
cd /Users/deanfox/Desktop/Pentacore/pentracore-crm
cp .env.local.example .env.local
# Edit .env.local, paste your 3 values
```

### Step 4: Deploy Database (1 min)

**In Supabase Dashboard:**

1. Go to **SQL Editor → New Query**
2. Copy **ALL** of this file:
   ```
   /Users/deanfox/Desktop/Pentacore/pentracore-crm/supabase/migrations/001_init_schemas.sql
   /Users/deanfox/Desktop/Pentacore/pentracore-crm/supabase/migrations/002_rls_policies.sql
   /Users/deanfox/Desktop/Pentacore/pentracore-crm/supabase/migrations/003_pentracore_seed_data.sql
   ```
3. Paste into SQL editor
4. Click **Run**

✅ All tables, policies, and data loaded.

### Step 5: Update RLS Policies (1 min)

**Get Your User ID:**
1. Go to http://localhost:3000
2. Click **Sign In → Magic Link**
3. Enter: `deanbfox@gmail.com`
4. Check email for link, click it
5. Go to Supabase **Authentication → Users**
6. Copy your UUID from the list

**Update Policies in Supabase SQL:**
```sql
-- Replace 'dean-user-id' with your actual UUID in ALL these policies:

UPDATE pentracore_knowledge.company_info SET id=id WHERE TRUE;
-- (This triggers the policies to refresh)

-- Then manually replace in Supabase Dashboard:
-- All instances of 'dean-user-id' → your_actual_uuid
-- All instances of 'deanbfox@gmail.com' → your_email
```

---

## Verify Deployment

### Run Dev Server:
```bash
npm install
npm run dev
```

### Test Public Knowledge (Everyone):
```
http://localhost:3000/knowledge
```
Should see: Products, Services, Processes, Policies, FAQs

### Test Private CRM (Dean Only):
```
http://localhost:3000/crm
```
Should see: Leads, Opportunities, Deals, Counterparties

---

## What's Deployed

### Knowledge Base (pentracore_knowledge schema)
- ✅ Company info (PentraCore International)
- ✅ 8 Products (Iron ore, cobalt, gold, copper, lithium, aluminum, tin, diamonds)
- ✅ 5 Services (Brokerage, KYC, Legal, Market intel, Logistics)
- ✅ 5 Processes (NCNDA → KYC → IMFPA → SPA → Delivery)
- ✅ 6 Policies (NCNDA, KYC/AML, Conflict of interest, Commission, Privacy, Documentation)
- ✅ 9 FAQs (Comprehensive Q&A about processes)
- ✅ 5 Team Contacts (Dean, Alex, Paul, Barry, Support)
- ✅ 5 News Updates (Market intel, product launches)
- ✅ 8 KPIs (Deal volume, transaction value, success rates, etc.)

### CRM (dean_crm schema)
- ✅ Leads
- ✅ Opportunities
- ✅ Counterparties
- ✅ Deals (with IMFPA→SPA enforcement)
- ✅ Deal Timeline
- ✅ Deal Documents
- ✅ Contact History
- ✅ Task Log
- ✅ Referrals

### Security
- ✅ RLS: Knowledge tables readable by authenticated users only
- ✅ RLS: CRM tables restricted to Dean (auth.uid()) only
- ✅ Audit logging (all changes tracked)
- ✅ IMFPA before SPA constraint (cannot bypass)

---

## Troubleshooting

**"Cannot connect to Supabase"**
- Verify `.env.local` has correct URL and keys
- Restart dev server: `npm run dev`

**"No auth token" on /crm**
- You haven't completed magic link login yet
- Go back to http://localhost:3000 and sign in

**RLS policy errors**
- Make sure you replaced 'dean-user-id' with your actual Supabase User UUID
- Check Supabase Dashboard → Authentication → Users for your UUID

**"SPA cannot be signed before IMFPA"**
- This is by design—hard rule enforcement
- Make sure deal has imfpa_signed_date before spa_signed_date

---

## Next Steps (After Deployment)

1. **Add team members** → Alex, Paul, Barry (separate logins)
2. **Build deal pipeline UI** → Visualize NCNDA→KYC→IMFPA→SPA flow
3. **Set up n8n workflows** → WhatsApp chatbot, email responder
4. **Deploy to Vercel** → `vercel deploy --prod`

---

**Deployed by:** Claude Code  
**Date:** 2026-05-03  
**Status:** ✅ Ready to deploy
