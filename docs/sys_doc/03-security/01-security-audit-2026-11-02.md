# KagoBuild source security review — 2026-11-02

> **Status:** Current (2 Nov 2026). Offline static review only; not a penetration test or certification. Open items are tracked in [Project status](../00-overview/01-project-status.md).

**Review type:** offline static review + limited tests, not a comprehensive penetration test. Original input: `KagoBuild.zip`. Output: v4 secure starter, not a verified production site.

## Observed defects in original upload

| Severity | Finding in original | Work performed / outstanding |
|---|---|---|
| Critical | `frontend/pages/signin.html` submitted login by navigating straight to `dashboard.html` | Replaced with server call; server authenticates via Supabase Auth (needs keys/provider); private pages guarded |
| High | Admin HTML and role label were not a real security boundary | Server `/pages/admin/*` requires authenticated role bound in PostgreSQL; admin frontend role label fetched from server; demo CRUD not connected |
| High | Original `backend/` and `server.js`, `package.json` were empty | Created separate Fastify starter with schema validation, role checks, payment references and project owner filters |
| High | Premium UI had no proven real payment processing | Starter hosted checkout + signed webhook + idempotency + reconcile; not approved for real-world payment until sandbox end-to-end + refunds/reversals done |
| Medium | 33 inline executable script tags across legacy pages, 12 inline `onerror` attributes on index | Extracted inline scripts into separate files and removed legacy inline HTML error handlers; strict script-src self in Helmet CSP |
| Medium | DOM `innerHTML` widespread in frontend | **Not fully resolved**: requires review of every user-data rendering path. CSP mitigates but cannot guarantee safety |
| Medium | `localStorage` contains demo state and fake API key UI | Keep as demonstration only; never put real secrets, personal credentials, or payment truth in browser storage |
| Medium | Source archive contained `.git` history (~large) and an empty `.env` | Omitted both from distributable output; do not assume historical Git objects are secret-free without separate history scan |
| High | Production auth/DB privileges, JWT signing mode, CSP function, identity reset and BOLA were not exercised | **Block production until configured and tested.** |
| High | No lockfile/dependency baseline, npm advisory check unavailable | Package manifests supplied; **cannot claim dependency upgrade or npm vulnerability audit completed** (registry DNS inaccessible) |

## Completed checks and results

- 40 website HTML pages processed; 33 inline scripts extracted; no inline executable script or `onerror` event attributes remaining in HTML source per offline scanner.
- `.env`, Git history, bundled keys and source screenshots not included in new distributable.
- All created backend JS files and extracted authentication JS passed `node --check`.
- Two Node built-in tests passed for webhook HMAC verification/tampering and fail-closed config checks.
- Seven preserved warehouse ETL unit tests passed (deduplication, immutable financial events, invalid amount quarantine, idempotency and pending-payment update).

## Checks NOT completed (must not claim otherwise)

1. `npm install`, `npm audit`, dependency updates and transitive vulnerability report: package registry unreachable, lockfile absent. Pin reviewed exact versions and regenerate lockfile before deployment.
2. End-to-end Fastify runtime/PG/Redis/Auth/Paystack tests: integrations not configured, so no verified live checkout or access control.
3. XSS penetration testing, CSP browser compatibility tests for every original page, DOM sink review, SQL injection fuzzing and OWASP ZAP.
4. API/object authorization abuse tests with multiple real accounts (BOLA/BFLA), permission revocation checks and password reset callback.
5. Payment provider failure/retry tests, chargebacks, refunds, webhook signature/raw-body integration and distributed concurrency load.
6. Production TLS, DNS/WAF, API gateway, DB firewall/backup/PITR, RLS/permissions, key rotation, CI supply-chain scans, image scanning and rollback drills.

## Required security signoff before production

- All app dependencies installed from a reviewed lockfile; no unresolved high/critical advisories.
- Register/manage users only through genuine identity provider; enable MFA for privileged accounts and secure email/password-reset callback.
- Verify `.env`/secret manager entries in deployment (never put secret key into frontend), confirm trusted proxy CIDRs and exact CORS origins.
- Prevent admin access for ordinary users; inspect all endpoints for user ownership, property allowlists and shared-workspace permissions.
- Delete/replace unsafe legacy UI `innerHTML` usage where user-controlled content is inserted; test CSP as enforced at runtime.
- Verify hosted payment webhook from raw request body, reconcilers, duplicate and out-of-order webhook events, full and partial refund policies, disputes and confirmed entitlements.
- Run DAST and an external review proportional to payment/private-data risk; review compliance obligations (POPIA, payment provider rules and building regulatory context).

**Security truth:** no review can guarantee “no mistakes.” Treat this as a reproducible improvement baseline, not a security certificate.

### Additional privacy observation
Some existing pages reference external demo images (`picsum.photos`, `randomuser.me`), which may reveal visitors' IP addresses to third parties. Replace them with licensed locally hosted assets before go-live or obtain appropriate privacy approval. Google Fonts also loads external resources, subject to the chosen privacy policy and CSP.
