begin;

-- broken_at remains the real UTC event instant. Pig progression is based on
-- local calendar days, so preserve that logical day separately to keep a
-- broken Pig frozen at the same progress after timezone travel.
alter table public.pigs
add column broken_on date;

-- Existing rows have no originating timezone metadata. UTC is the only stable
-- deterministic backfill; new writes always provide the user's local day.
update public.pigs
set broken_on = (broken_at at time zone 'UTC')::date
where status = 'broken';

-- Keep older app builds compatible during rollout. New builds submit the true
-- user-local day; older builds receive a stable UTC fallback rather than
-- failing the lifecycle constraint.
create or replace function public.fill_missing_broken_on()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'broken' and new.broken_on is null and new.broken_at is not null then
    new.broken_on := (new.broken_at at time zone 'UTC')::date;
  end if;

  return new;
end;
$$;

create trigger pigs_fill_missing_broken_on
before insert or update on public.pigs
for each row execute function public.fill_missing_broken_on();

alter table public.pigs
drop constraint pigs_status_timestamps_consistent;

alter table public.pigs
add constraint pigs_status_timestamps_consistent check (
  (
    status = 'locked'
    and broken_at is null
    and broken_on is null
    and completed_at is null
  )
  or
  (
    status = 'broken'
    and broken_at is not null
    and broken_on is not null
    and completed_at is null
  )
  or
  (
    status = 'completed'
    and completed_at is not null
    and broken_at is null
    and broken_on is null
  )
);

comment on column public.pigs.broken_on is
  'User-local calendar day on which the commitment ended; used for stable progression.';

revoke execute on function public.fill_missing_broken_on()
from public, anon, authenticated;

commit;
