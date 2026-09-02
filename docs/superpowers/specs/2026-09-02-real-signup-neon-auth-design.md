# BH’S Real Signup + Neon Authentication Design

## Goal
Replace the demo-only entrance with real customer accounts stored in Neon, verified by a server-generated email OTP that expires after exactly 5 minutes.

## Architecture
- Neon Postgres is the source of truth for customer profiles, password hashes, sessions, and OTP records.
- The BH’S backend owns signup, login, OTP verification, session validation, and logout endpoints.
- Passwords and OTPs are never stored in plaintext; only one-way hashes are persisted.
- Email delivery uses Resend only as the transactional email transport; its API key is backend-only. Neon remains the application data/authentication store.
- The banking interface renders only after a valid BH’S session is established.

## User flows
1. Sign up with full name, email, phone, password, and confirmation.
2. Server creates the customer, generates a six-digit OTP, stores only its hash with a five-minute expiry, and emails the OTP.
3. User enters OTP; the server verifies expiry, single-use state, and attempt limits, then marks email verified and creates a session.
4. Login uses email/password. Verified accounts receive a session. Unverified accounts are sent back to the OTP verification flow.
5. Logout invalidates the session.
6. Returning sessions are restored from local storage and validated server-side.

## Security requirements
- OTP lifetime: 5 minutes.
- OTP is single-use and consumed after successful verification.
- OTP verification is rate limited by attempt count and resend cooldown.
- Passwords use a slow one-way password hash with per-password salt.
- Sessions use cryptographically random bearer tokens stored only as hashes in Neon.
- No credential, OTP, database URL, or email API key is shipped to the browser.
- No real-money movement is enabled by this change; existing sandbox transfer behavior remains sandboxed.

## Success criteria
A new tester can create an account, receive an actual email OTP, verify within five minutes, enter the BH’S banking interface, sign out, and log back in with the same account without re-registering.
