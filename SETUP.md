# PentraCore Pivot: Setup Guide

## System Architecture

**Two isolated systems:**
1. **Shareholder Knowledge Base** (`/knowledge`) - Public, read-only
2. **Dean's Private CRM** (`/crm`) - Locked to dean@gmail.com only

## Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Vercel account (optional, for deployment)

## Setup Steps

### 1. Create Supabase Project

```bash
# Go to https://supabase.com and create a new project
# Save these values:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Create `.env.local`

```bash
cp .env.local.example .env.local
# Fill in your Supabase credentials
```

### 3. Run Migrations

```bash
# Option A: Via Supabase Dashboard (copy-paste SQL)
# Go to SQL Editor → New Query
# Paste contents of:
#   supabase/migrations/001_init_schemas.sql
#   supabase/migrations/002_rls_policies.sql

# Option B: Via Supabase CLI
supabase db push
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Update RLS Policies

In Supabase Dashboard, replace `'dean-user-id'` and `'deanbfox@gmail.com'` with your actual Supabase user ID and email:

```sql
-- Get your user ID from Auth → Users (after first login)
-- Then update policies:

CREATE POLICY crm_dean_all ON dean_crm.leads 
  USING (auth.uid() = 'your-actual-user-id');
```

### 6. Seed Knowledge Base (Optional)

```bash
# Export your pentracore_knowledge_base.json to CSV
# Import into pentracore_knowledge.company_info, products, etc. via Supabase UI
```

### 7. Start Dev Server

```bash
npm run dev
# Visit http://localhost:3000
```

## Security Checklist

- [ ] Updated `dean-user-id` in RLS policies to your real Supabase user ID
- [ ] Updated `deanbfox@gmail.com` in RLS policies to your email
- [ ] `.env.local` is in `.gitignore` (never commit secrets)
- [ ] Supabase RLS is ENABLED on all tables
- [ ] Shareholders can only read from `pentracore_knowledge.*`
- [ ] Only Dean can access `dean_crm.*` schema

## API Endpoints

### Protected (Shareholder-facing)
- `GET /api/knowledge/products` - All products after login

### Private (Dean only, requires Bearer token)
- `GET /api/crm/leads` - Your leads
- `POST /api/crm/leads` - Add lead
- `GET /api/crm/deals` - Your deals
- `POST /api/crm/deals` - Add deal (enforces IMFPA before SPA)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Public anon/publishable key
SUPABASE_SERVICE_ROLE_KEY     # Secret service role key (never expose)
```

## Hard Rules Enforced

1. **SPA cannot be signed before IMFPA** - DB constraint + API validation
2. **Shareholders cannot see Dean's deals** - RLS policy at DB level
3. **No external access** - Auth required on all CRM endpoints
4. **Audit trail** - Every query logged (future implementation)

## Deployment (Vercel)

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel deploy
```

## Next Steps

- [ ] Integrate with PentracoreInternational.com API (if available)
- [ ] Build n8n chatbots (WhatsApp + Email)
- [ ] Add deal timeline UI
- [ ] Implement document upload + analyzer
- [ ] Add commission tracking dashboard
