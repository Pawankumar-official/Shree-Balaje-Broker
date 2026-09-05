-- Shree Balaje Brokerage Deal Management System
-- Initial production schema. Apply through the Supabase SQL editor or CLI migration flow.

create extension if not exists pgcrypto;

create type public.deal_stage as enum ('matching', 'truck_assigned', 'in_transit', 'delivered', 'payment_pending', 'closed', 'cancelled');
create type public.ledger_type as enum ('commodity', 'buyer_commission', 'seller_commission');
create type public.trust_level as enum ('high', 'normal', 'watch');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  contact_person text not null default '', phone text not null default '', alternate_phone text not null default '',
  address text not null default '', location text not null default '', notes text not null default '',
  is_buyer boolean not null default false, is_seller boolean not null default false,
  trust public.trust_level not null default 'normal', risk_flags text[] not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (is_buyer or is_seller)
);

create table public.transporters (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (length(trim(name)) > 0), phone text not null default '', notes text not null default '',
  reliability public.trust_level not null default 'normal', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.trucks (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete restrict,
  transporter_id uuid not null references public.transporters(id) on delete restrict,
  registration_number text not null, capacity_qtl numeric(12,2), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (owner_id, registration_number)
);

create table public.deals (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete restrict,
  deal_number text not null, deal_date date not null, daily_serial integer not null check (daily_serial > 0), monthly_serial integer not null check (monthly_serial > 0),
  buyer_party_id uuid not null references public.parties(id) on delete restrict, seller_party_id uuid not null references public.parties(id) on delete restrict,
  commodity text not null check (length(trim(commodity)) > 0), quantity_qtl numeric(12,2) not null check (quantity_qtl > 0), rate_per_qtl_paise bigint not null check (rate_per_qtl_paise >= 0),
  route text not null default '', stage public.deal_stage not null default 'matching',
  cancelled_at timestamptz, cancelled_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (owner_id, deal_number), unique (owner_id, deal_date, daily_serial)
);

create table public.deal_trips (
  id uuid primary key default gen_random_uuid(), deal_id uuid not null references public.deals(id) on delete restrict,
  owner_id uuid not null references public.profiles(id) on delete restrict, transporter_id uuid not null references public.transporters(id) on delete restrict,
  truck_id uuid not null references public.trucks(id) on delete restrict, route text not null default '', quantity_qtl numeric(12,2) check (quantity_qtl > 0),
  freight_paise bigint check (freight_paise >= 0), driver_phone text not null default '', assigned_at timestamptz, loaded_at timestamptz, delivered_at timestamptz, notes text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.payment_obligations (
  id uuid primary key default gen_random_uuid(), deal_id uuid not null references public.deals(id) on delete restrict,
  owner_id uuid not null references public.profiles(id) on delete restrict, ledger public.ledger_type not null,
  amount_paise bigint not null check (amount_paise >= 0), expected_payment_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (deal_id, ledger)
);

create table public.payment_entries (
  id uuid primary key default gen_random_uuid(), deal_id uuid not null references public.deals(id) on delete restrict,
  owner_id uuid not null references public.profiles(id) on delete restrict, ledger public.ledger_type not null,
  amount_paise bigint not null check (amount_paise > 0), payment_date date not null, reference text not null default '', note text not null default '',
  recorded_at timestamptz not null default now(), recorded_by uuid not null references public.profiles(id) on delete restrict
);

create table public.offers (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete restrict,
  seller_party_id uuid not null references public.parties(id) on delete restrict, commodity text not null, quantity_qtl numeric(12,2) not null check (quantity_qtl > 0),
  rate_per_qtl_paise bigint not null check (rate_per_qtl_paise >= 0), location text not null default '', status text not null default 'open' check (status in ('open','converted','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.requirements (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete restrict,
  buyer_party_id uuid not null references public.parties(id) on delete restrict, commodity text not null, quantity_qtl numeric(12,2) not null check (quantity_qtl > 0),
  target_rate_paise bigint not null check (target_rate_paise >= 0), delivery_location text not null default '', status text not null default 'open' check (status in ('open','converted','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.todos (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete restrict,
  text text not null check (length(trim(text)) > 0), due_date date, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key, owner_id uuid not null references public.profiles(id) on delete restrict,
  actor_id uuid not null references public.profiles(id) on delete restrict, entity_type text not null, entity_id uuid not null, action text not null,
  before_state jsonb, after_state jsonb, occurred_at timestamptz not null default now()
);

create index deals_owner_date_idx on public.deals(owner_id, deal_date desc);
create index payment_entries_deal_ledger_idx on public.payment_entries(deal_id, ledger, payment_date desc);
create index deal_trips_transporter_route_idx on public.deal_trips(transporter_id, route, delivered_at desc);

-- A new authenticated user receives an application profile.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', '')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Keep modification times consistent without client clock dependence.
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger parties_updated before update on public.parties for each row execute procedure public.touch_updated_at();
create trigger transporters_updated before update on public.transporters for each row execute procedure public.touch_updated_at();
create trigger trucks_updated before update on public.trucks for each row execute procedure public.touch_updated_at();
create trigger deals_updated before update on public.deals for each row execute procedure public.touch_updated_at();
create trigger trips_updated before update on public.deal_trips for each row execute procedure public.touch_updated_at();
create trigger obligations_updated before update on public.payment_obligations for each row execute procedure public.touch_updated_at();
create trigger offers_updated before update on public.offers for each row execute procedure public.touch_updated_at();
create trigger requirements_updated before update on public.requirements for each row execute procedure public.touch_updated_at();
create trigger todos_updated before update on public.todos for each row execute procedure public.touch_updated_at();

-- Every business record belongs to its creator for the single-business initial release.
alter table public.profiles enable row level security;
alter table public.parties enable row level security; alter table public.transporters enable row level security; alter table public.trucks enable row level security;
alter table public.deals enable row level security; alter table public.deal_trips enable row level security; alter table public.payment_obligations enable row level security; alter table public.payment_entries enable row level security;
alter table public.offers enable row level security; alter table public.requirements enable row level security; alter table public.todos enable row level security; alter table public.audit_events enable row level security;
create policy "profile owner" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "party owner" on public.parties for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "transporter owner" on public.transporters for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "truck owner" on public.trucks for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "deal owner" on public.deals for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "trip owner" on public.deal_trips for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "obligation owner" on public.payment_obligations for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "payment owner" on public.payment_entries for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "offer owner" on public.offers for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "requirement owner" on public.requirements for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "todo owner" on public.todos for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "audit owner" on public.audit_events for select using (owner_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles, public.parties, public.transporters, public.trucks, public.deals, public.deal_trips, public.payment_obligations, public.payment_entries, public.offers, public.requirements, public.todos to authenticated;
grant select on public.audit_events to authenticated;
