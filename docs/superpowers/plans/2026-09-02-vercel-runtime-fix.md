# Vercel Runtime Fix

## Goal
Make BH’S deployable on Vercel by removing the unavailable AppDeploy frontend client/runtime and routing `/api/*` through a Vercel serverless function while keeping Neon-backed authentication and transfer behavior.

## Tasks
1. Add a small local HTTP client using `fetch()` with the same `{ data }` response contract used by the UI.
2. Add a Node test covering successful JSON requests and surfaced API errors before changing the UI imports.
3. Replace `@appdeploy/client` imports in `src/App.tsx` and `src/AuthScreen.tsx` with the local client.
4. Add `api/[...path].ts` as the Vercel catch-all API handler for health, auth, and transfer endpoints, reusing `backend/auth.ts` and Neon.
5. Verify the Vite production build and inspect the resulting diff; push all changes to `main`.

## Verification
- `npm test`
- `npm run build`
- Confirm no source imports reference `@appdeploy/client` or `@appdeploy/sdk` in the deployed request path.
