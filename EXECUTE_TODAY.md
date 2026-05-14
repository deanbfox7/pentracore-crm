# EXECUTE TODAY (May 3-4, 2026)

## Go-Live Checklist

### 1. Create Supabase Project (15 min)
- [ ] Go to https://supabase.com/dashboard
- [ ] Create new project: `pentracore-crm`
- [ ] Wait for project to initialize
- [ ] Go to **Settings → API** and copy:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (in **Service Role Secret**)

### 2. Set Up Environment (5 min)
```bash
cd /Users/deanfox/Desktop/Pentacore/pentracore-crm
cp .env.local.example .env.local
# Edit .env.local and paste your 3 Supabase values
```

### 3. Run Database Migrations (10 min)
```bash
# Go to Supabase Dashboard → SQL Editor → New Query
# Copy-paste ENTIRE contents of: supabase/migrations/001_init_schemas.sql
# Click "Run"

# Then do the same with: supabase/migrations/002_rls_policies.sql
# Click "Run"
```

### 4. Update RLS Policies (5 min)
In Supabase Dashboard → Authentication → Users:
- [ ] Complete your first login (magic link)
- [ ] Copy your **User ID**

In Supabase Dashboard → SQL Editor → New Query:
```sql
-- Replace 'your-user-id-here' with your actual UUID
UPDATE auth.users WHERE email = 'deanbfox@gmail.com';
-- Copy the ID column value

-- Then update all RLS policies:
-- In policies, replace:
--   'dean-user-id' → your actual UUID
--   'deanbfox@gmail.com' → your email
```

### 5. Load Knowledge Base (20 min)
```bash
# Export your knowledge_base.json to CSV:
node scripts/export-knowledge.js

# Then in Supabase Dashboard:
# Go to pentracore_knowledge → company_info table → Import Data
# Upload the CSV file
```

### 6. Install & Run (5 min)
```bash
npm install
npm run dev
# Visit http://localhost:3000
```

### 7. Test Auth Flow (5 min)
- [ ] Click "Sign In with Magic Link"
- [ ] Enter deanbfox@gmail.com
- [ ] Check your email for link
- [ ] Click link (should authenticate)

### 8. Test Shareholder Access (5 min)
- [ ] Visit http://localhost:3000/knowledge
- [ ] Should see Products (from DB)

### 9. Test CRM Access (5 min)
- [ ] Visit http://localhost:3000/crm
- [ ] Should see your leads (empty at first)

### 10. Deploy to Vercel (10 min)
```bash
vercel login
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel deploy --prod
```

---

## Immediate Next Steps (May 5-11)

### Week 1: Dashboards
- [ ] Build deal pipeline UI (Inquiry → Settlement)
- [ ] Add lead creation form
- [ ] Add opportunity creation
- [ ] Commission calculator

### Week 2: Automation
- [ ] Set up n8n on your machine
- [ ] Build WhatsApp chatbot (knowledge lookup)
- [ ] Build email responder (escalation to you)

### Week 3: Chatbots
- [ ] WhatsApp live (test with real number)
- [ ] Email responder live
- [ ] Enforce NCNDA gate in bot responses

### Week 4: Ops
- [ ] Lead scoring bot
- [ ] Commission tracker
- [ ] Referral workflow

---

## Critical Decisions (Decide Today)

1. **Shareholder logins:**
   - [ ] Separate accounts for Alex, Paul, Barry? OR
   - [ ] Shared "view-only" account?
   - *Recommend: Separate (audit trail)*

2. **WhatsApp number:**
   - [ ] Do you have Twilio set up? OR
   - [ ] Skip for now and do email first?
   - *Recommend: Start with email (easier)*

3. **Knowledge base seed data:**
   - [ ] Use existing `pentracore_knowledge_base.json`? OR
   - [ ] Start with minimal test data?
   - *Recommend: Minimal first, import JSON later*

---

## Troubleshooting

### "No auth token" when visiting /crm
- You haven't completed the magic link login yet
- Go back to http://localhost:3000 and log in

### RLS policy errors
- Make sure you replaced `'dean-user-id'` with your actual Supabase User ID
- Check Supabase Dashboard → Authentication → Users for your UUID

### Can't connect to Supabase
- Verify `.env.local` has correct URL and keys
- Restart dev server: `npm run dev`

### "SPA cannot be signed before IMFPA" error
- This is by design (hard rule enforcement)
- Make sure deal has `imfpa_signed_date` before `spa_signed_date`

---

## Files You Need to Know

| File | What to Edit |
|------|--------------|
| `.env.local` | Add your Supabase credentials here |
| `supabase/migrations/` | Database schema (run in Supabase) |
| `app/api/crm/` | Private API endpoints (currently read leads/deals) |
| `app/knowledge/` | Authenticated shareholder portal |
| `app/crm/` | Your dashboard (private) |

---

## Success Criteria

By Friday (May 8), you should have:
- ✅ Supabase project with 2 schemas
- ✅ RLS policies enforced
- ✅ Local dev server running
- ✅ Can log in with magic link
- ✅ Can view /knowledge as shareholder
- ✅ Can view /crm as Dean (private)
- ✅ Deployed to Vercel

Then you can start adding n8n bots and scaling.
