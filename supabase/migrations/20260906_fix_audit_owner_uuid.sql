-- Repairs the first production-controls install: audit rows must store UUIDs,
-- not the text extracted from JSON.

create or replace function public.audit_business_change() returns trigger language plpgsql security definer set search_path = public as $$
declare row_data jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
declare prior_data jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
begin
  insert into public.audit_events (owner_id, actor_id, entity_type, entity_id, action, before_state, after_state)
  values ((row_data ->> 'owner_id')::uuid, auth.uid(), tg_table_name, (row_data ->> 'id')::uuid, lower(tg_op), prior_data, case when tg_op = 'DELETE' then null else row_data end);
  return coalesce(new, old);
end;
$$;
