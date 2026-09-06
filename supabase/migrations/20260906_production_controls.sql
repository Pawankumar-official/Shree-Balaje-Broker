-- Production controls: server-side Deal numbering, immutable financial history,
-- audit events, and monthly accounting snapshots.

create table public.monthly_ledger_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  month_start date not null check (month_start = date_trunc('month', month_start)::date),
  snapshot jsonb not null,
  finalized_at timestamptz not null default now(),
  finalized_by uuid not null references public.profiles(id) on delete restrict,
  unique (owner_id, month_start)
);
alter table public.monthly_ledger_snapshots enable row level security;
create policy "snapshot owner reads" on public.monthly_ledger_snapshots for select using (owner_id = auth.uid());
grant select on public.monthly_ledger_snapshots to authenticated;

-- Payment entries are append-only; corrections require a later audited reversal flow.
revoke update, delete on public.payment_entries from authenticated;

create or replace function public.audit_business_change() returns trigger language plpgsql security definer set search_path = public as $$
declare row_data jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
declare prior_data jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
begin
  insert into public.audit_events (owner_id, actor_id, entity_type, entity_id, action, before_state, after_state)
  values (row_data ->> 'owner_id', auth.uid(), tg_table_name, (row_data ->> 'id')::uuid, lower(tg_op), prior_data, case when tg_op = 'DELETE' then null else row_data end);
  return coalesce(new, old);
end; $$;
create trigger audit_parties after insert or update or delete on public.parties for each row execute procedure public.audit_business_change();
create trigger audit_transporters after insert or update or delete on public.transporters for each row execute procedure public.audit_business_change();
create trigger audit_trucks after insert or update or delete on public.trucks for each row execute procedure public.audit_business_change();
create trigger audit_deals after insert or update or delete on public.deals for each row execute procedure public.audit_business_change();
create trigger audit_trips after insert or update or delete on public.deal_trips for each row execute procedure public.audit_business_change();
create trigger audit_obligations after insert or update or delete on public.payment_obligations for each row execute procedure public.audit_business_change();
create trigger audit_payments after insert on public.payment_entries for each row execute procedure public.audit_business_change();

-- The cloud client calls this RPC instead of locally calculating serials.
create or replace function public.create_deal(p_deal_date date, p_buyer_party_id uuid, p_seller_party_id uuid, p_commodity text, p_quantity_qtl numeric, p_rate_per_qtl_paise bigint, p_route text, p_expected_payment_date date) returns public.deals language plpgsql security invoker set search_path = public as $$
declare current_owner uuid := auth.uid(); result public.deals; next_daily integer; next_monthly integer;
begin
  if current_owner is null then raise exception 'Authentication is required'; end if;
  if p_quantity_qtl <= 0 or p_rate_per_qtl_paise < 0 or length(trim(p_commodity)) = 0 then raise exception 'Invalid Deal quantity, rate, or commodity'; end if;
  perform pg_advisory_xact_lock(hashtext(current_owner::text));
  select coalesce(max(daily_serial), 0) + 1 into next_daily from public.deals where owner_id = current_owner and deal_date = p_deal_date;
  select coalesce(max(monthly_serial), 0) + 1 into next_monthly from public.deals where owner_id = current_owner and date_trunc('month', deal_date) = date_trunc('month', p_deal_date);
  insert into public.deals (owner_id, deal_number, deal_date, daily_serial, monthly_serial, buyer_party_id, seller_party_id, commodity, quantity_qtl, rate_per_qtl_paise, route, stage)
  values (current_owner, format('D%s-%s', to_char(p_deal_date, 'YYYYMMDD'), lpad(next_daily::text, 3, '0')), p_deal_date, next_daily, next_monthly, p_buyer_party_id, p_seller_party_id, trim(p_commodity), p_quantity_qtl, p_rate_per_qtl_paise, coalesce(p_route, ''), 'matching') returning * into result;
  insert into public.payment_obligations (deal_id, owner_id, ledger, amount_paise, expected_payment_date) values (result.id, current_owner, 'commodity', (p_quantity_qtl * p_rate_per_qtl_paise)::bigint, p_expected_payment_date);
  return result;
end; $$;
grant execute on function public.create_deal(date, uuid, uuid, text, numeric, bigint, text, date) to authenticated;

-- Captures a finalized month while retaining editable live Deal records.
create or replace function public.finalize_monthly_ledger(p_month_start date) returns public.monthly_ledger_snapshots language plpgsql security invoker set search_path = public as $$
declare current_owner uuid := auth.uid(); result public.monthly_ledger_snapshots;
begin
  if current_owner is null then raise exception 'Authentication is required'; end if;
  if p_month_start <> date_trunc('month', p_month_start)::date then raise exception 'Use the first day of the month'; end if;
  insert into public.monthly_ledger_snapshots (owner_id, month_start, finalized_by, snapshot)
  values (current_owner, p_month_start, current_owner, jsonb_build_object('deals', coalesce((select jsonb_agg(to_jsonb(d) order by d.deal_date, d.daily_serial) from public.deals d where d.owner_id = current_owner and d.deal_date >= p_month_start and d.deal_date < (p_month_start + interval '1 month')::date), '[]'::jsonb), 'payments', coalesce((select jsonb_agg(to_jsonb(p) order by p.payment_date, p.recorded_at) from public.payment_entries p where p.owner_id = current_owner and p.payment_date >= p_month_start and p.payment_date < (p_month_start + interval '1 month')::date), '[]'::jsonb)))
  on conflict (owner_id, month_start) do update set snapshot = excluded.snapshot, finalized_at = now(), finalized_by = current_owner returning * into result;
  return result;
end; $$;
grant execute on function public.finalize_monthly_ledger(date) to authenticated;
