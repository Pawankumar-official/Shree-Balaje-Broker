# Shree Balaje Brokerage Deal Management System

Real-world web application for a Bihar grain brokerage business. The product baseline is in [the workflow and data-model document](docs/business-workflow-data-model-v1.md).

## Current milestone

The local interface supports the Milestone 1 workflow: Parties, quick Deal entry, explicit stage changes, cancellation history, partial payment entries, offers/requirements, transport reference data, To-Do items, Daily Register CSV export, and a printable monthly view.

The repository also includes a production PostgreSQL/Supabase migration with authentication-linked ownership and Row Level Security. Cloud synchronization is not activated until a Supabase project is configured and the app repository is wired to it.

Read [the production readiness gate](docs/production-readiness.md) before entering real business data.

## Run locally

```powershell
npm install
npm run dev
```

Run quality checks with:

```powershell
npm run build
npm run lint
```

## Configure cloud data

1. Create a Supabase project.
2. In its SQL editor, run [the initial migration](supabase/migrations/20260906_initial_brokerage_schema.sql).
3. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the project Connect panel.
4. Restart the local dev server.

Do not commit `.env.local`, service-role/secret keys, or real business data. The browser only needs the publishable key; Row Level Security protects records for authenticated users.

## Important project rules

- Do not delete or silently overwrite historical transactions.
- A deal starts in `Matching`; status changes remain user-controlled.
- Commodity, buyer commission, and seller commission are separate ledgers.
- Driver names are intentionally not stored.
- Before material changes, create and test a Git checkpoint.
