# BH'S Banking App

BH'S (Transaction Beyond Borders) is a mobile-first fintech banking prototype for local and international money movement.

## Current status

- Sandbox/demo money movement only; no real funds are moved.
- Multi-currency wallet UI: NGN, USD, GBP, EUR.
- Send-money flow with protected backend transfer persistence.
- Transaction activity, virtual card UI, card controls, and responsive mobile layout.
- AppDeploy is the current deployment runtime.

## Project structure

- `src/` — React/Vite frontend
- `backend/` — AppDeploy backend routes and realtime helpers
- `tests/` — end-to-end QA scenarios
- `appdeploy.auth-login.json` — authentication UI configuration

## Security

Do not commit passwords, transaction PINs, API keys, database URLs, card secrets, or other credentials. Real financial functionality must use properly licensed providers and secure server-side integrations.
