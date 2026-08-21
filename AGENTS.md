# Piggi Development Instructions

Piggi is a mobile savings commitment application.

## Technology

- React Native
- Expo
- TypeScript
- Expo Router

## Development Principles

- Prefer simple, readable code.
- Avoid unnecessary abstractions.
- Keep UI separate from financial and business logic.
- Do not duplicate balance calculations.
- Reuse components when appropriate.
- Use descriptive variable and function names.
- Avoid very large React components.
- Keep files organized by responsibility.
- Continue using local mock data unless another data source is explicitly requested.

## Financial Rules

- Bank Balance is the actual or mock account balance.
- Protected Money is the total value of active Pigs.
- Safe to Spend is Bank Balance minus Protected Money.
- Safe to Spend should never be below zero during normal Pig creation.
- When a Pig is broken or completed, its protected amount returns to Safe to Spend.

Real financial integrations will be added later. Do not add Plaid, Stripe, banking APIs, payment functionality, or real-money movement unless explicitly requested.

## Workflow

For significant features:

1. Inspect the existing implementation.
2. Briefly describe the intended implementation.
3. Make the changes.
4. Run the relevant project checks and tests.
5. Fix errors before considering the task complete.
6. Commit and push each completed change to Git.
