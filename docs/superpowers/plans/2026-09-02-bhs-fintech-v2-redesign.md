# BH’S Fintech V2 Redesign — Implementation Plan

## Goal
Implement the approved Nigerian fintech redesign in the existing BH’S React/Vite + AppDeploy app, using familiar high-speed wallet-app interaction patterns without copying OPay/PalmPay branding or proprietary UI.

## Global constraints
- Preserve BH’S identity and sandbox-only money movement.
- Mobile-first, thumb-friendly, polished on desktop.
- Avoid generic AI aesthetics, excessive nested cards, and purple gradients.
- No plaintext secrets, PINs, CVVs, API keys, or database credentials.
- Use existing AppDeploy SDK/auth/backend patterns; do not add unsupported dependencies.
- Every changed user-visible workflow must be represented in tests/tests.txt.
- Validate the live deployment before calling the increment complete, then push the validated source to GitHub immediately.

## Task 1 — Redesign application shell and Home
Files: src/App.tsx, src/index.css
- Five-area product model: Home, Wallet, Cards, Activity, More.
- Nigerian fintech service hub: Send, Receive, Airtime, Data, Electricity, TV, International, Multi-currency.
- Keep balance masking and wallet switching.
- More sheet sections for Profile, Security, KYC, Support and Settings.
- Explicit sandbox messaging and polished state handling.

## Task 2 — Transfer/review/detail interaction
Files: src/App.tsx, backend/index.ts
- Recipient → amount → review → result interaction.
- Visible processing/success/failed/reversed states while retaining sandbox semantics.
- Preserve authenticated transfer persistence and validation.
- Transaction-detail view from Activity/recent transactions.
- Never imply real settlement.

## Task 3 — Wallet, Cards, Activity and More surfaces
Files: src/App.tsx, src/index.css
- Wallet: NGN/USD/GBP/EUR, add/withdraw/convert entry points, Safe & Spend UI.
- Cards: virtual-card presentation, freeze/unfreeze, spending and online controls.
- Activity: search/filter, transaction detail, status and receipt-style summary.
- More: Security center, Profile, KYC status, Support, Settings and future-feature placeholders.

## Task 4 — Reconcile tests and verify
File: tests/tests.txt
- Maintain 3–5 focused end-to-end tests, exactly one [sanity].
- Cover changed workflows, mobile behavior, validation/error guardrails and protected backend transfer behavior.
- Run deployment QA and inspect frontend/network/backend errors.

## Task 5 — Publish validated increment
- Deploy AppDeploy increment.
- Poll until terminal ready/failed state; fix QA/runtime issues if needed, up to three automatic attempts.
- Push the exact validated source changes to GitHub main.
- Verify GitHub contains the deployed source and report live URL/commit.
