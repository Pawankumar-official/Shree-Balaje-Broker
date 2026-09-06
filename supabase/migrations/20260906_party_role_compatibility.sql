-- Compatibility cleanup for early database installs that stored buyer/seller
-- flags on Party. A Party is role-neutral; buyer and seller are Deal roles.

alter table public.parties drop constraint if exists parties_check;
alter table public.parties drop column if exists is_buyer;
alter table public.parties drop column if exists is_seller;
