begin;

-- Piggi stores only user-owned profile, demo financial, and Pig commitment
-- records. Progress, stages, Protected Money, and Safe to Spend stay derived in
-- the application and are intentionally absent from this schema.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length
    check (display_name is null or char_length(trim(display_name)) between 1 and 80),
  constraint profiles_updated_after_creation check (updated_at >= created_at)
);

create table public.user_financial_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  mock_bank_balance numeric(14, 2) not null default 6840.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_financial_state_nonnegative_balance check (mock_bank_balance >= 0),
  constraint user_financial_state_updated_after_creation check (updated_at >= created_at)
);

create table public.pigs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text default 'classic',
  protected_amount numeric(14, 2) not null,
  -- These are calendar commitments, not moments in time. Keeping them as date
  -- preserves the app's local YYYY-MM-DD progression semantics across zones.
  created_at date not null default current_date,
  unlock_date date not null,
  status text not null default 'locked',
  broken_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint pigs_name_length check (char_length(trim(name)) between 1 and 80),
  constraint pigs_icon_length check (icon is null or char_length(icon) between 1 and 32),
  constraint pigs_positive_protected_amount check (protected_amount > 0),
  constraint pigs_unlock_after_creation check (unlock_date > created_at),
  constraint pigs_valid_status check (status in ('locked', 'broken', 'completed')),
  constraint pigs_status_timestamps_consistent check (
    (status = 'locked' and broken_at is null and completed_at is null)
    or
    (
      status = 'broken'
      and broken_at is not null
      and completed_at is null
    )
    or
    (
      status = 'completed'
      and completed_at is not null
      and broken_at is null
    )
  )
);

create index pigs_user_created_idx on public.pigs (user_id, created_at desc);
create index pigs_user_status_unlock_idx on public.pigs (user_id, status, unlock_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_financial_state_set_updated_at
before update on public.user_financial_state
for each row execute function public.set_updated_at();

create trigger pigs_set_updated_at
before update on public.pigs
for each row execute function public.set_updated_at();

-- SECURITY DEFINER is required because Auth inserts the user before a client
-- session exists. An empty search_path and fully qualified names prevent object
-- shadowing while the trigger atomically creates both required app records.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.user_financial_state (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_financial_state enable row level security;
alter table public.pigs enable row level security;

create policy "Users can select their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can delete their own profile"
on public.profiles for delete
to authenticated
using ((select auth.uid()) = id);

create policy "Users can select their own financial state"
on public.user_financial_state for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own financial state"
on public.user_financial_state for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own financial state"
on public.user_financial_state for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own financial state"
on public.user_financial_state for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can select their own Pigs"
on public.pigs for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own Pigs"
on public.pigs for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own Pigs"
on public.pigs for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own Pigs"
on public.pigs for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Supabase commonly grants public-schema tables to API roles by default. Make
-- the intended API surface explicit: anonymous clients get no table access;
-- authenticated clients still pass through the ownership policies above.
revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.user_financial_state from public, anon, authenticated;
revoke all on table public.pigs from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_financial_state to authenticated;
grant select, insert, update, delete on table public.pigs to authenticated;

-- Neither trigger function is part of the public client API.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

comment on column public.user_financial_state.mock_bank_balance is
  'Development/demo balance only; this is not a connected financial account.';
comment on column public.pigs.protected_amount is
  'Savings commitment amount stored as an exact decimal; no money is moved.';
comment on column public.pigs.created_at is
  'Local calendar date chosen by the client; intentionally not a UTC instant.';
comment on column public.pigs.unlock_date is
  'Local calendar unlock date used by the date-derived progression engine.';

commit;
