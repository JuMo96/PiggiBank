# Piggi

Piggi is an Expo + React Native prototype for gamified savings commitments. This version uses mock data only and does not connect to banks or process payments.

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

## Project structure

- `app/` — Expo Router routes and screen composition
- `src/components/` — reusable presentation components
- `src/domain/` — framework-independent savings calculations
- `src/data/` — mock data access
- `src/hooks/` — UI-facing state and business orchestration
- `src/models/` — shared TypeScript models
- `src/theme/` — design tokens
