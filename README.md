# Piggi

Piggi is an Expo + React Native app for playful savings commitments. Users
authenticate with Supabase, and their Pigs and demo balance are stored in a
user-owned Supabase database. The balance is still mock data: Piggi does not
connect to banks, move money, or process payments.

## Supabase setup

1. Create a Supabase project with email/password authentication enabled.
2. Apply the checked-in migration as described in
   [`supabase/README.md`](supabase/README.md).
3. Copy `.env.example` to `.env` and add the project's public URL and anon key:

   ```text
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
   ```

Never use a Supabase service-role key in the mobile app. Existing locally
stored development Pigs are intentionally ignored; each authenticated account
starts with an empty Pig list and its own default demo balance.

## Run locally

From Windows PowerShell on this machine, use the included launcher (no global
Node.js or pnpm installation is required):

```powershell
.\start-piggi.cmd
```

For a standard Node.js development environment:

```bash
pnpm install
pnpm start
```

Then scan the QR code with Expo Go, or press `a`, `i`, or `w` in the Expo terminal.

Run the automated checks with:

```bash
pnpm test
pnpm typecheck
```

## Project structure

- `app/` — Expo Router routes and screen composition
- `src/components/` — reusable presentation components
- `src/domain/` — framework-independent savings calculations
- `src/data/` — database/domain mapping and exact money serialization
- `src/hooks/` — UI-facing state and business orchestration
- `src/models/` — shared TypeScript models
- `src/repositories/` — authenticated Supabase data access
- `src/services/` — the shared Supabase client and device services
- `src/state/` — authentication and user-data providers
- `src/theme/` — design tokens
- `supabase/` — reproducible SQL migrations and RLS verification steps
