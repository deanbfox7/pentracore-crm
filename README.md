# Pentracore CRM (Commodities)

Pentracore CRM is a commodities-focused sales platform for lead tracking, pipeline management, RFQ-to-contract workflow, and reporting.

## Core Modules

- Leads and pipeline board (qualification through close)
- Accounts and contacts for buyers/suppliers/brokers
- Opportunities with commodity-specific deal metadata
- RFQ, quote, and contract workflow
- Tasks with overdue reminder checks
- Dashboard and reporting endpoints

## Tech Stack

- Next.js (App Router) + TypeScript
- Supabase (Auth, Postgres, RLS)
- Tailwind CSS

## Quick Start

1. Install dependencies:
   - `npm install`
2. Configure environment variables in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
3. Apply SQL migrations in Supabase in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_crm_mvp_expansion.sql`
   - `supabase/migrations/003_pentracore_deal_intelligence.sql`
   - `supabase/migrations/004_pentracore_wealth_engine.sql`
4. Run locally:
   - `npm run dev`

## Scheduled Jobs

- `/api/cron/process-sequences` (every 5 minutes)
- `/api/cron/send-reminders` (hourly)
- `/api/cron/score-new-leads` (daily)
- `/api/cron/notify-overdue-tasks` (hourly)

## Security and Ops

- RLS policies enforce per-owner data access.
- Profile roles supported: `admin`, `sales_manager`, `sales_rep`, `viewer`.
- Audit logs are written for lead/opportunity/RFQ/quote/contract/task events.
- Recommended backups: daily managed Postgres snapshot + weekly export.

## PentraCore Wealth Engine

- `/pentracore/import` imports `MASTER_DEAL_TRACKER.csv` and `MASTER_COUNTERPARTIES.csv`.
- `/pentracore/wealth-engine` gives the team a plain-English daily action queue.
- Wealth-engine database views:
  - `v_pentracore_deal_processing`
  - `v_pentracore_daily_actions`
  - `v_pentracore_supply_demand_match`
