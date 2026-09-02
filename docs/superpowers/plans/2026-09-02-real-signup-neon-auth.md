# Real Signup + Neon Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Put a real Neon-backed signup/login gate in front of BH’S with five-minute email OTP verification.

**Architecture:** React renders an authentication shell until a server-issued BH’S session is valid. The backend uses Neon Postgres for users, sessions, and OTP records, with Resend as email transport; banking API calls use the BH’S session token supplied by the authenticated client.

**Tech Stack:** React 19, TypeScript, AppDeploy API transport, Neon Postgres, `@neondatabase/serverless`, Web Crypto/Node crypto, Resend REST API.

**Spec:** `docs/superpowers/specs/2026-09-02-real-signup-neon-auth-design.md`

## Global Constraints
- OTP expiry is exactly 5 minutes.
- Passwords and OTPs are never stored as plaintext.
- Secrets are backend-only.
- The banking UI is inaccessible until authentication succeeds.
- Existing transfers remain sandbox-only.

### Task 1: Authentication backend
**Files:** Create `backend/auth.ts`; modify `backend/index.ts`; modify `package.json`.

- [ ] Add Neon serverless driver dependency.
- [ ] Implement signup, OTP verification, login, session validation, resend, and logout routes.
- [ ] Hash passwords and OTPs server-side; generate random OTPs and session tokens server-side.
- [ ] Send OTP emails through the Resend REST API using backend secrets.
- [ ] Enforce five-minute OTP expiry, single use, resend cooldown, and failed-attempt limits.
- [ ] Convert existing transactions endpoint to validate the BH’S session token.

### Task 2: Authentication UI
**Files:** Create `src/AuthScreen.tsx`; modify `src/App.tsx`; modify `src/index.css`.

- [ ] Add signup, login, OTP verification, resend, and logout screens.
- [ ] Restore a valid session on reload.
- [ ] Keep the banking interface behind the authentication gate.
- [ ] Display the authenticated customer’s name in the account surface.

### Task 3: Test coverage
**Files:** Modify `tests/tests.txt`.

- [ ] Cover signup → email verification → banking interface.
- [ ] Cover login/logout and protected interface behavior.
- [ ] Cover invalid/expired OTP guardrails.
- [ ] Cover validation for bad signup credentials.

### Task 4: Deploy and verify
- [ ] Configure backend secret entries for the Neon connection string and Resend API key without exposing values.
- [ ] Deploy the updated AppDeploy version.
- [ ] Poll deployment to a terminal state and inspect QA/errors.
- [ ] Verify the authentication shell and protected banking interface.
- [ ] Push the same source changes to GitHub `main`.
