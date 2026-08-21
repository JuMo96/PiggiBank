begin;

-- The initial signup trigger covers new accounts. Backfill any Auth users that
-- existed before the Piggi schema was applied so they receive the same complete
-- first-run state without client-side repair logic.
insert into public.profiles (id, email)
select users.id, users.email
from auth.users as users
on conflict (id) do nothing;

insert into public.user_financial_state (user_id)
select users.id
from auth.users as users
on conflict (user_id) do nothing;

commit;
