# PentraCore Pivot: Dual-System Architecture

## Overview

Secure, isolated systems for:
1. **Shareholder Knowledge Base** - Read-only access to approved company information
2. **Dean's Private CRM** - Personal lead/deal management (locked to Dean only)

## Quick Start

```bash
# 1. Clone and install
npm install

# 2. Set up Supabase (see SETUP.md)
cp .env.local.example .env.local
# Fill in credentials

# 3. Run migrations
# Copy SQL from supabase/migrations/ into Supabase Dashboard

# 4. Start
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────┐
│  Public: http://localhost:3000          │
├─────────────────────────────────────────┤
│  /              - Login (magic link)     │
│  /knowledge     - Authenticated knowledge portal     │
│  /crm           - Dean's dashboard       │
│  /api/knowledge/* - Protected APIs       │
│  /api/crm/*     - Private APIs (auth)    │
└─────────────────────────────────────────┘

DATABASE (Supabase)
├─ pentracore_knowledge.* (READ-ONLY to authenticated users)
├─ dean_crm.* (WRITE access to Dean only)
└─ audit.* (Audit logs)
```

## Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/` | Database schema + RLS |
| `app/api/` | All API endpoints |
| `app/knowledge/` | Authenticated knowledge portal |
| `app/crm/` | Dean's dashboard |
| `lib/supabase.ts` | Supabase client |
| `lib/auth.ts` | Auth helpers |

## Security

- ✅ RLS enforced at database level
- ✅ No anonymous external access (magic link auth only)
- ✅ Hard rules encoded (IMFPA before SPA)
- ✅ Audit trail ready (append-only tables)
- ✅ Secrets in `.env.local` (never committed)

## Environment Variables

Copy `.env.local.example` → `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=       # From Supabase Dashboard
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # From Supabase Dashboard
SUPABASE_SERVICE_ROLE_KEY=      # Secret - never expose
```

## API Examples

### Get Products (Authenticated)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/knowledge/products
```

### Get Leads (Private - requires auth)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/crm/leads
```

### Create Deal (Private - with hard rule check)
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"commodity":"chrome","tonnage":100,"imfpa_signed_date":"2024-05-03"}' \
  http://localhost:3000/api/crm/deals
```

## Deployment

### Vercel
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel deploy
```

## Roadmap

- [x] Database schema (knowledge + CRM)
- [x] RLS policies (hard isolation)
- [x] Auth (magic link)
- [x] Knowledge API
- [x] CRM API (private)
- [ ] WhatsApp chatbot (n8n)
- [ ] Email responder (n8n)
- [ ] Sales bot (lead scoring)
- [ ] Document analyzer (Claude API)
- [ ] Commission tracker
- [ ] PentracoreInternational.com API integration

## Support

See `SETUP.md` for full setup instructions.

## Hard Rules Enforced

1. **IMFPA before SPA** - Constraint + API check
2. **No buyer/seller mixing** - Access control + audit
3. **KYC before binding** - RLS masks unverified counterparties
4. **NCNDA first** - Future: enforce in deal creation flow
