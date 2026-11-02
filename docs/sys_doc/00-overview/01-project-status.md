# Project Status

**As of:** 2 November 2026 (v4 package). **Rule of this page:** it says what exists, what is only designed, and what blocks production. Nothing here is a production-readiness claim.

## 1. Summary

KagoBuild has a complete static website (landing, auth, dashboard, projects, AI design, materials, estimator, reports, suppliers, teams, settings and 19 admin pages) running on **demonstration data**, a **Fastify reference backend** that is written but not yet connected to real services, and a **synthetic-data warehouse ETL** with passing tests. No real identity provider, database, AI model, supplier feed or payment provider is configured.

## 2. What exists

| Area | State | Where to read more |
|------|-------|--------------------|
| Static website (40 HTML pages) | Built; inline scripts moved to external files; fake login redirect replaced with a server call; admin and supplier UI still use demo data | [Security audit](../03-security/01-security-audit-2026-11-02.md) |
| Fastify 5 REST starter | Coded: health, auth via Supabase Auth, projects (owner-scoped), materials (cached), admin session/overview, checkout, payment status/reconcile, entitlements, Paystack webhook. Dependencies not installed or audited | [API inventory](../02-architecture/03-api-inventory.md) |
| Operational SQL | `001_operational.sql` in the v4 package, including RBAC roles and outbox table | [System design v4](../02-architecture/01-system-design-v4.md) |
| Warehouse ETL | Runnable on synthetic CSVs; star schema for SQLite and PostgreSQL; 7 unit tests reported passing | [Warehouse design](../05-data-warehouse/01-warehouse-etl-design.md) |
| Security checks | Offline static scan and 2 Node tests reported passing; no live testing | [Security audit](../03-security/01-security-audit-2026-11-02.md) |
| Frontend API client | `frontend/scripts/api.js` is an **empty file** in the v4 package, so pages are not yet wired to the REST API | [Implementation plan](03-implementation-plan.md) |

## 3. Designed but not built

| Item | Notes |
|------|-------|
| AI generation worker and SSE progress (`/api/v1/generations/{jobId}/events`) | Architecture only; the UI still simulates generation |
| Outbox worker, payment reconciliation scheduler | Outbox table exists; no consumer ships |
| Refunds, chargebacks, partial reversals | State machine documented in [Payments](../04-payments/01-payment-reliability.md); not coded |
| Admin analytics endpoint, support chat | Designed, not coded |
| Supplier feeds, marketplace CRUD, price provenance | Not built |
| Redis invalidation on catalogue edits | Cache-aside coded; invalidation not integrated |
| WebSockets, GraphQL, gRPC | Deliberately deferred |

## 4. Blockers before real users or real money

1. Install dependencies from a reviewed lockfile; run `npm audit`, `npm test`, `npm run check` (the registry was unreachable when v4 was assembled).
2. Provision your own Supabase Auth project (asymmetric JWT signing keys), PostgreSQL and Redis; finish the password-reset callback and admin MFA.
3. Test Paystack in sandbox end to end (duplicate, late and out-of-order webhooks; refunds; reconciliation) before enabling any real price.
4. Replace unsafe `innerHTML` sinks that render user-controlled data; verify CSP in a real browser.
5. Run multi-account authorisation tests (BOLA/BFLA), DAST (e.g. OWASP ZAP), restore drills and an external review.
6. Replace external demo images (`picsum.photos`, `randomuser.me`) and review Google Fonts under your privacy policy.
7. Load-test the scale hypotheses; none are measured yet.

Full checklists: [Security audit](../03-security/01-security-audit-2026-11-02.md) and [Deployment](../06-operations/01-deployment.md).

## 5. Where decisions are still open

See the [Decision register](02-decision-register.md).
