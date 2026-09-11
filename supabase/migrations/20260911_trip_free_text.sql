-- Trip free-text truck + driver (manual entry, no truck inventory required)
-- deal_trips already stores driver_phone; the blocker to manually-typed truck
-- numbers was the required truck_id FK. Add a free-text truck_number and let
-- truck_id stay NULL when there is no pre-registered truck.
-- Additive + RLS-neutral: the "trip owner" policy uses `for all` on deal_trips,
-- so no policy change is required.

alter table public.deal_trips
  add column if not exists truck_number text not null default '';

alter table public.deal_trips
  alter column truck_id drop not null;

-- Backfill the free-text number from any linked truck for existing rows.
update public.deal_trips t
  set truck_number = tr.registration_number
  from public.trucks tr
  where t.truck_id = tr.id and t.truck_number = '';