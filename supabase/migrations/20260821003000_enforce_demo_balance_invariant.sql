begin;

-- Block concurrent writes until the preflight and both trigger definitions are
-- committed. Runtime mutations lock financial state before reading Pigs, so
-- keep the same table order here.
lock table public.user_financial_state in share row exclusive mode;
lock table public.pigs in share row exclusive mode;

-- Refuse to install the invariant over inconsistent existing data. Operators
-- must reconcile the affected account explicitly; migrations never mutate a
-- user's balance or commitments to make the constraint fit.
do $$
begin
  if exists (
    select 1
    from public.pigs as active_pig
    left join public.user_financial_state as financial_state
      on financial_state.user_id = active_pig.user_id
    where active_pig.status = 'locked'
      and financial_state.user_id is null
  ) then
    raise exception
      'Piggi cannot enable the Safe to Spend invariant while an active Pig has no financial state.';
  end if;

  if exists (
    select 1
    from public.user_financial_state as financial_state
    join public.pigs as active_pig
      on active_pig.user_id = financial_state.user_id
     and active_pig.status = 'locked'
    group by financial_state.user_id, financial_state.mock_bank_balance
    having sum(active_pig.protected_amount) > financial_state.mock_bank_balance
  ) then
    raise exception
      'Piggi cannot enable the Safe to Spend invariant while an account is over-protected.';
  end if;
end;
$$;

-- Serialize Pig creation with demo-balance changes by locking the user's one
-- financial-state row. Derived Safe to Spend remains application logic; this
-- trigger only protects its underlying cross-table invariant from stale devices.
create or replace function public.enforce_pig_within_demo_balance()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_balance numeric(14, 2);
  other_protected numeric(14, 2);
begin
  if new.status <> 'locked' then
    return new;
  end if;

  select financial_state.mock_bank_balance
  into current_balance
  from public.user_financial_state as financial_state
  where financial_state.user_id = new.user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'piggi_financial_state_missing';
  end if;

  select coalesce(sum(existing_pig.protected_amount), 0)
  into other_protected
  from public.pigs as existing_pig
  where existing_pig.user_id = new.user_id
    and existing_pig.status = 'locked'
    and existing_pig.id <> new.id;

  if other_protected + new.protected_amount > current_balance then
    raise exception using
      errcode = 'P0001',
      message = 'piggi_safe_to_spend_conflict';
  end if;

  return new;
end;
$$;

create trigger pigs_enforce_demo_balance
before insert or update on public.pigs
for each row execute function public.enforce_pig_within_demo_balance();

create or replace function public.enforce_demo_balance_covers_locked_pigs()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  active_protected numeric(14, 2);
begin
  select coalesce(sum(active_pig.protected_amount), 0)
  into active_protected
  from public.pigs as active_pig
  where active_pig.user_id = new.user_id
    and active_pig.status = 'locked';

  if new.mock_bank_balance < active_protected then
    raise exception using
      errcode = 'P0001',
      message = 'piggi_demo_balance_below_protected';
  end if;

  return new;
end;
$$;

create trigger financial_state_enforce_protected_money
before insert or update on public.user_financial_state
for each row execute function public.enforce_demo_balance_covers_locked_pigs();

revoke execute on function public.enforce_pig_within_demo_balance()
from public, anon, authenticated;
revoke execute on function public.enforce_demo_balance_covers_locked_pigs()
from public, anon, authenticated;

commit;
