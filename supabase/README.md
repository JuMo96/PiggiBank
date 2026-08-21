# Supabase setup

Piggi uses Supabase Auth and three user-owned tables. The migration is the
source of truth for the database; do not recreate these objects only through
the Dashboard.

## Configure a project

1. Create a Supabase project and keep email/password authentication enabled.
2. Install the Supabase CLI, then initialize and link this checkout once:

   ```bash
   supabase init
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Preview and apply the recorded migration:

   ```bash
   supabase db push --dry-run
   supabase db push
   ```

4. Copy `.env.example` to `.env` and enter the project's public URL and anon
   key from **Project Settings > API**.
5. Restart Expo after changing environment variables.

Use `db push` for schema deployment so Supabase's migration history stays in
sync. Do not recreate or modify these tables with the remote Table Editor.

The anon key is intended for a public client and is safe only in combination
with RLS. Never put a service-role key in `.env` or the mobile application.
If **Confirm email** is enabled under Authentication settings, a new user must
confirm the link before signing in. For native redirect links, add the app's
`piggi://` scheme to the project's allowed redirect URLs when that flow is
enabled.

## What the migration creates

- `profiles`: one row keyed by `auth.users.id`.
- `user_financial_state`: one user-owned demo balance, defaulting to `$6,840`.
- `pigs`: exact decimal commitments, calendar dates, and lifecycle event times.
- A signup trigger that atomically creates the profile and demo financial row.
- A follow-up backfill for Auth users that existed before the schema was applied.
- `updated_at` triggers, ownership indexes, constraints, explicit API grants,
  and separate SELECT/INSERT/UPDATE/DELETE RLS policies on every table.

Pig stages, progress, Protected Money, and Safe to Spend are deliberately not
stored. They remain derived by the application. Existing AsyncStorage Pig data
is not uploaded into a newly authenticated account.

`pigs.created_at` and `pigs.unlock_date` use PostgreSQL `date` because Piggi's
progression is a local calendar-day commitment. This avoids a UTC conversion
changing the day a Pig opens. `broken_at`, `completed_at`, and `updated_at` are
UTC `timestamptz` event instants. Status constraints require the matching event
timestamp but intentionally do not compare that instant with a calendar-date
boundary, which would be unsafe across time zones.

## Verify two-user isolation

Create two accounts through Supabase Auth (User A and User B), then copy their
UUIDs from **Authentication > Users**. Confirm each UUID has one row in both
`profiles` and `user_financial_state`; this verifies the signup trigger.

Create one Pig for each account through the app. To exercise RLS directly from
the SQL editor, run the following transaction after replacing the placeholder
with User A's UUID:

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'PASTE_USER_A_UUID', true);

select id, user_id, name from public.pigs;
select user_id, mock_bank_balance from public.user_financial_state;
rollback;
```

Only User A's rows should be returned. Repeat with User B's UUID and expect only
User B's rows. Then prove that cross-user writes are blocked (replace all three
placeholders):

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'PASTE_USER_A_UUID', true);

update public.pigs
set name = 'Must not change'
where id = 'PASTE_USER_B_PIG_UUID';
-- Expected: UPDATE 0

delete from public.pigs where id = 'PASTE_USER_B_PIG_UUID';
-- Expected: DELETE 0
rollback;
```

Finally, run this separately. It must fail with a row-level security policy
violation because User A is attempting to create a row owned by User B:

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'PASTE_USER_A_UUID', true);

insert into public.pigs (
  user_id,
  name,
  protected_amount,
  unlock_date
)
values (
  'PASTE_USER_B_UUID',
  'Forbidden Pig',
  10.00,
  current_date + 30
);
rollback;
```

Dashboard queries normally run as a privileged database role and bypass RLS;
the `set local role authenticated` and JWT claim are therefore essential to
this manual verification. Keep the test transactions wrapped in `rollback`.
