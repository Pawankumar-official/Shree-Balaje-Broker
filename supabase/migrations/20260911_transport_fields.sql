-- Transport cloud columns (Phase 2 foundation)
-- Adds a dedicated transporter `routes` column and a truck `driver_phone` column
-- so transport memory survives in cloud mode. Additive + RLS-neutral; the RLS
-- "owner" policy uses `for all` on these tables, so no policy change is required.

-- 1) Transporter routes: preserve any routes previously stored in `notes`.
alter table public.transporters
  add column if not exists routes text not null default '';

update public.transporters set routes = notes where routes = '' and notes is not null and notes <> '';

-- 2) Truck driver phone (phone only — driver name is intentionally never stored).
alter table public.trucks
  add column if not exists driver_phone text not null default '';

-- No new grants needed: `grant ... on public.transporters, public.trucks ... to authenticated`
-- from the initial schema covers these columns (table-level grant, not column-level).