# PentraCore CRM: Quick Reference

## Credentials Needed

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from Settings → API)
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from Settings → API → Service Role Secret)
```

## URLs

| Page | URL | Access | Purpose |
|------|-----|--------|---------|
| Login | http://localhost:3000 | Anyone | Magic link authentication |
| Knowledge | http://localhost:3000/knowledge | Authenticated | Public knowledge base |
| CRM Dashboard | http://localhost:3000/crm | Dean only | Main dashboard |
| Deal Pipeline | http://localhost:3000/crm/deals | Dean only | Deal management |
| Supabase | https://supabase.com/dashboard | Your account | Database management |
| Vercel | https://vercel.com/dashboard | Your account | Production deployment |

## One-Minute Setup

```bash
cd /Users/deanfox/Desktop/Pentacore/pentracore-crm

# 1. Create .env.local
cp .env.local.example .env.local
# Edit .env.local with your 3 Supabase values

# 2. Run master setup
bash MASTER_SETUP.sh
# (Follow prompts for migrations and RLS updates)

# 3. Start dev server
npm run dev

# 4. Visit http://localhost:3000
```

## Database Stages

Deal stages (in order):
1. **inquiry** — Initial contact
2. **ncnda** — Non-circumvention agreement signed
3. **kyc** — Know-your-customer verified
4. **imfpa** — Proof of funds/ability confirmed
5. **spa** — Sales agreement signed (⚠️ requires IMFPA first)
6. **settlement** — Funds delivered, deal closed

## API Endpoints

All require `Authorization: Bearer {token}` header (except /login)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/login | Magic link auth |
| GET | /api/knowledge/products | List products |
| GET | /api/crm/leads | List leads |
| POST | /api/crm/leads | Create lead |
| GET | /api/crm/opportunities | List opportunities |
| POST | /api/crm/opportunities | Create opportunity |
| GET | /api/crm/deals | List deals |
| POST | /api/crm/deals | Create deal |
| GET | /api/crm/counterparties | List counterparties |
| POST | /api/crm/counterparties | Create counterparty |

## Key Credentials

**Login Email:** deanbfox@gmail.com  
**Magic Link:** Sent to email (valid 24 hours)  
**RLS Enforcement:** Based on auth.uid() = your_uuid

## Supabase Schemas

```sql
pentracore_knowledge.*  -- Public read (authenticated users)
dean_crm.*             -- Private (Dean only)
audit.*                -- Audit logs (Dean only)
```

## Environment Setup

```bash
# Install Supabase CLI (optional but helpful)
npm install -g supabase

# Run migrations locally
supabase db push

# Reset database (careful!)
supabase db reset
```

## Troubleshooting Commands

```bash
# Check Node version
node --version  # Should be 18+

# Install dependencies fresh
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Check Supabase connection
# Edit lib/supabase.ts and test credentials

# Build locally before deploying
npm run build

# Test production mode
npm run build && npm start

# Check environment
cat .env.local
```

## Files to Know

| File | What It Does |
|------|--------------|
| `.env.local` | Your Supabase credentials (KEEP SECRET) |
| `supabase/migrations/*.sql` | Database schema |
| `app/page.tsx` | Login page |
| `app/crm/page.tsx` | CRM dashboard |
| `app/crm/deals/page.tsx` | Deal pipeline UI |
| `app/api/crm/*` | API endpoints |
| `lib/auth-context.tsx` | Authentication state |
| `n8n/workflows/*.json` | Automation workflows |

## Commission Calculation

```
Standard: 2-3% of deal value
Split: 50/50 between buyer and seller broker

Example:
Deal value: $10,000,000
Commission: $200,000-$300,000
Split: $100,000-$150,000 per side
```

## Commodities Available

- Iron Ore (Fe 65%, ICMM certified)
- Cobalt (Grade A, battery-grade)
- Gold (99.99%, LBMA certified)
- Copper (Grade A, COMEX compliant)
- Lithium (Battery grade, ICMM sourced)
- Aluminum (99.7%, aerospace-grade)
- Tin (Grade A, electronics-grade)
- Diamonds (Conflict-free, Kimberley certified)

## Team Access

| Person | Email | Access |
|--------|-------|--------|
| Dean | deanbfox@gmail.com | Full CRM |
| Alex | alex@pentracore.co.za | Knowledge only (if registered) |
| Paul | paul@pentracore.co.za | Knowledge only (if registered) |
| Barry | barry@pentracore.co.za | Knowledge only (if registered) |

## Deployment Checklist

- [ ] .env.local configured
- [ ] npm install ran
- [ ] Migrations executed in Supabase
- [ ] RLS policies updated with your UUID
- [ ] npm run dev works
- [ ] Can log in at http://localhost:3000
- [ ] /knowledge loads
- [ ] /crm loads
- [ ] Vercel account linked
- [ ] vercel deploy --prod executed
- [ ] Live URL confirmed

## Support Docs

| Doc | Purpose |
|-----|---------|
| MASTER_SETUP.sh | Automated setup orchestration |
| DEPLOY_NOW.md | 5-minute deployment walkthrough |
| SETUP.md | Detailed setup instructions |
| START_HERE.md | Feature overview |
| README_COMPLETE.md | Complete guide (this package) |
| QUICK_REFERENCE.md | This file |

---

**Need help?** Start with MASTER_SETUP.sh, then refer to other docs as needed.
