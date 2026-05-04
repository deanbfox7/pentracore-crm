# PentraCore Supabase Manual Deploy

This folder is for the manual path when the Supabase CLI login is blocked.

Use `complete_dashboard_deploy.sql` in the Supabase Dashboard SQL Editor. It creates:

- `pentracore_knowledge` schema and tables
- `dean_crm` schema and tables
- `audit` schema and tables
- Seed data for products, services, process, policies, contacts, FAQs, news, and KPIs
- A public `pentracore_data_room` view for a clean one-table display in Supabase

Run order:

1. Open Supabase Dashboard.
2. Go to SQL Editor.
3. Open `complete_dashboard_deploy.sql`.
4. Paste the whole file into a new query.
5. Run it.

If you want me to run it from terminal, get the database password from Supabase:

Project Settings -> Database -> Database password

Then run:

```bash
bash scripts/push-supabase-sql.sh
```

