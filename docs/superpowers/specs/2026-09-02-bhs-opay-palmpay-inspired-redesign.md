# BH’S Nigerian Fintech Redesign

## Goal
Transform BH’S from the current banking prototype into a polished Nigerian fintech experience with the breadth, speed, and mobile interaction patterns users expect from leading wallet apps such as OPay and PalmPay, while retaining a distinct BH’S visual identity.

## Product direction
BH’S will benchmark familiar Nigerian fintech interaction patterns rather than copy proprietary branding or layouts. The experience will be mobile-first, thumb-friendly, dense where useful, and focused on fast completion of everyday money tasks.

## Primary navigation
- Home: balance, quick actions, recent activity, service shortcuts, wallet highlights.
- Wallet: NGN, USD, GBP, EUR balances and wallet actions.
- Cards: virtual card, freeze/unfreeze, limits and online controls.
- Activity: searchable/filterable transaction history and transaction detail.
- More: profile, security, KYC, support, settings, international transfer and future investment features.

## Home experience
- Available balance with visibility toggle.
- Primary wallet/currency selector.
- Fast actions for Send, Receive, Airtime and Bills.
- Additional service shortcuts for Data, Electricity, TV and other billers.
- International transfer and multi-currency entry points.
- Recent transactions with clear money-in/money-out states.
- Notification and account/security access.

## Money movement
- Bank transfer flow with recipient, amount, review and confirmation stages.
- Beneficiary/account verification architecture ready for a legitimate Nigerian account-verification provider.
- Explicit pending, processing, successful, failed and reversed states.
- Idempotent transaction handling when real-money integrations are introduced.
- Transaction receipts and detail views.
- V1/V2 sandbox behavior must never imply that simulated transfers are real settlement.

## Wallets
- Server-side source-of-truth ledger architecture.
- NGN/USD/GBP/EUR wallet views.
- Add/withdraw/convert entry points.
- Safe & Spend separation with authenticated transfers between them.

## Cards
- Virtual-card presentation.
- Freeze/unfreeze controls.
- Spending and online-payment controls.
- Provider-backed card issuance architecture; never store raw CVV unless an approved provider explicitly requires it.

## Bills and services
Provide a service hub for Airtime, Data, Electricity, TV and future billers, with saved recipients/beneficiaries and clear transaction states.

## Security
The product architecture will support customer accounts, persistent sessions, transaction PINs stored only as one-way hashes, rate limiting/temporary lockouts, biometric confirmation through platform APIs without storing raw biometric data, trusted devices, sessions, account/card freezing and security alerts.

## KYC and regulated integrations
KYC will use a legitimate identity/KYC provider. BH’S will store verification status and provider references rather than building or storing its own facial-recognition database. Bank-account verification and international transfers will use legitimate providers when enabled.

## Visual system
- Distinct BH’S identity; do not clone OPay/PalmPay branding.
- Premium, restrained typography and spacing.
- No generic purple-gradient AI aesthetic.
- No excessive nested cards.
- Strong hierarchy, large touch targets and clear action affordances.
- Bottom sheets for focused transaction flows.
- Subtle motion only where it improves comprehension.
- Excellent loading, empty, error, pending and success states.
- Android-first responsive behavior while remaining polished on larger screens.

## Data and backend
Neon Postgres is intended to become the primary persistent database. The application must keep secrets server-side and never expose database credentials, PIN hashes, API keys or other sensitive values to the browser or GitHub.

Core future entities include users, profiles, wallets, ledger entries, beneficiaries, transfers, transactions, cards, bill payments, sessions/devices, security events and KYC status. Real-money movement remains disabled until legitimate regulated/payment integrations are configured.

## Delivery strategy
1. Redesign the existing mobile shell and navigation.
2. Expand Home into a Nigerian fintech service hub.
3. Build transfer/review/detail interaction states around the existing sandbox backend.
4. Improve Wallet, Cards and Activity into production-shaped screens.
5. Add Security/Profile/More surfaces.
6. Connect persistent data to Neon once the Neon organization/project is available.
7. Verify mobile and desktop behavior and deploy each validated increment.
8. Push every validated code update to the BH’S GitHub repository immediately.
