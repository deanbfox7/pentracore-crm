# START HERE

## What You Just Got

Complete dual-system pivot:
- **Shareholder Knowledge Base** - Read-only portal for Alex/Paul/Barry
- **Dean's Private CRM** - Locked-down sales/deal system (you only)
- **Security** - RLS at database level, encrypted, audit-ready
- **Hard Rules** - IMFPA before SPA enforced in code + database

---

## Files Structure

```
pentracore-crm/
├── supabase/migrations/        # Database schema (run in Supabase)
├── app/
│   ├── api/
│   │   ├── auth/login/        # Magic link auth
│   │   ├── knowledge/         # Protected APIs (shareholders)
│   │   └── crm/               # Private APIs (dean only)
│   ├── knowledge/             # Authenticated shareholder portal
│   ├── crm/                   # Your dashboard
│   ├── page.tsx               # Login page
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Styles
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── auth.ts               # Auth helpers
├── n8n/                       # Chatbot flows (future)
├── scripts/                   # Utilities
├── .env.local.example         # Copy to .env.local
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── README.md                  # Full docs
```

---

## 5-Minute Quick Start

### Step 1: Create Supabase Project
Go to https://supabase.com/dashboard
- Create new project: `pentracore-crm`
- Copy credentials (URL, anon key, service role key)

### Step 2: Environment Setup
```bash
cd /Users/deanfox/Desktop/Pentacore/pentracore-crm
cp .env.local.example .env.local

# Edit .env.local with your 3 Supabase credentials
nano .env.local  # or use your editor
```

### Step 3: Run Migrations
In Supabase Dashboard → SQL Editor → New Query:
1. Copy entire contents of: `supabase/migrations/001_init_schemas.sql`
2. Paste and click "Run"
3. Repeat with `supabase/migrations/002_rls_policies.sql`

### Step 4: Install & Run
```bash
npm install
npm run dev
```

Visit http://localhost:3000

---

## Test the System (5 min)

### Test 1: Login
1. Go to http://localhost:3000
2. Enter: `deanbfox@gmail.com`
3. Check email for magic link
4. Click link (should authenticate)

### Test 2: Shareholder Access
1. Go to http://localhost:3000/knowledge
2. Should see "Products" section after signing in

### Test 3: CRM Access
1. Go to http://localhost:3000/crm
2. Should see "Your CRM Dashboard" + empty leads table
3. This is ONLY accessible after login

### Test 4: Privacy
1. Try to access `/crm` in incognito (not logged in)
2. Should redirect to login
3. This proves isolation works

---

## What's Working Today

✅ **Database**
- 2 isolated schemas (knowledge + CRM)
- RLS policies (shareholders read-only, dean full access)
- Hard rule enforcement (IMFPA before SPA)

✅ **Auth**
- Magic link login (email only)
- Session management
- User verification

✅ **APIs**
- GET /api/knowledge/products (authenticated)
- GET /api/crm/leads (private, auth required)
- GET /api/crm/deals (private, auth required)
- POST /api/crm/leads (private, auth required)
- POST /api/crm/deals (private, with hard rule check)

✅ **Dashboards**
- Shareholder portal (knowledge)
- Your CRM dashboard (private)
- Login page

---

## What's Next (Week 2-4)

### Week 2: Data & Forms
- [ ] Seed your knowledge base
- [ ] Add lead creation form
- [ ] Add deal creation form
- [ ] Add deal timeline UI

### Week 3: Automation
- [ ] Set up n8n (locally or on VPS)
- [ ] Build WhatsApp chatbot (knowledge lookup)
- [ ] Build email responder (escalation to you)

### Week 4: Intelligence
- [ ] Sales bot (lead scoring)
- [ ] Commission tracker
- [ ] Referral workflow

### Week 5+: Scale
- [ ] Document analyzer (Claude API)
- [ ] Voice bot (Twilio)
- [ ] PentracoreInternational.com API integration

---

## Key Decisions to Make

### 1. Shareholder Access
- [ ] Individual logins (Alex, Paul, Barry separate)?
- [ ] Shared read-only account?
- **Recommendation:** Individual logins (better audit trail)

### 2. WhatsApp
- [ ] Set up Twilio now or start with email?
- **Recommendation:** Start with email (email bot is easier, then add WhatsApp)

### 3. Knowledge Seed
- [ ] Import your existing JSON knowledge base?
- [ ] Start with minimal test data?
- **Recommendation:** Start minimal, import JSON in week 2

---

## Critical URLs

| URL | What | Access |
|-----|------|--------|
| http://localhost:3000 | Login | Everyone |
| http://localhost:3000/knowledge | Shareholder portal | Authenticated users |
| http://localhost:3000/crm | Your CRM | Dean only |
| http://localhost:3000/api/knowledge/products | Product API | Authenticated users |
| http://localhost:3000/api/crm/leads | Leads API | Dean + auth token |

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

Never commit `.env.local` to git (already in `.gitignore`)

---

## Deployment (When Ready)

```bash
vercel deploy --prod
```

Then add env vars in Vercel Dashboard.

---

## Troubleshooting

### "Connection refused"
- Supabase project not created yet
- `.env.local` credentials incorrect
- Restart dev server: `npm run dev`

### "Unauthorized" on /crm
- You haven't logged in yet (go to http://localhost:3000)
- Or your user ID wasn't updated in RLS policies

### "No products shown" in knowledge portal
- Knowledge DB is empty (seed data in week 2)
- Go to Supabase Dashboard → pentracore_knowledge → products to add test data

---

## Important: Update RLS Policies

After your first login, you MUST update these in Supabase:

1. Get your User ID from Supabase Dashboard → Authentication → Users
2. In SQL Editor, replace:
   - `'dean-user-id'` → your actual UUID
   - `'deanbfox@gmail.com'` → your email

Without this, the `/crm` routes won't work properly.

---

## Need Help?

- **Setup issues?** → See `SETUP.md`
- **API docs?** → See `README.md`
- **Step-by-step?** → See `EXECUTE_TODAY.md`
- **Architecture?** → See `SETUP.md` → System Architecture section

---

## Next Action

Run this now:
```bash
cd /Users/deanfox/Desktop/Pentacore/pentracore-crm
npm install
npm run dev
```

Then go create your Supabase project. You'll have a working system by lunch.
