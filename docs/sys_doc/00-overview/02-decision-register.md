# Decision Register

Single place for (A) **open business decisions** and (B) **conflicts between the baseline docs (Oct 2026) and the v4 design (2 Nov 2026)**. The v4 column is the working assumption because it is newer and states its reasons, but every row needs an owner's confirmation. Nothing in the source documents was rewritten to resolve these; the affected documents carry a status banner pointing here.

## A. Business decisions still open

| ID | Decision | Evidence | Needed from |
|----|----------|----------|-------------|
| B-01 | **One pricing table.** Landing page: Free / Pro R399 / Business R999. Premium page: Free / Starter R299 / Professional R699 / Enterprise R1,499. Admin finance: Homeowner R149 / Builder Pro R499. Annual discount: 17% (2 months free) vs 20% shown in UI | [PRD §5](../01-product/01-product-requirements.md) (proposal: Free R0, Starter R299, Professional R699, Business R1,499) | Product owner |
| B-02 | **Brand cleanup.** Footer, help and settings pages still say "BuildWise" and `support@buildwise.co.za` | PRD §5 | Product owner |
| B-03 | **Supplier list.** Admin pages use placeholder suppliers (BuildMart, Cape Roofing, SteelWorks); user pages use real ones (Builders Warehouse, Cashbuild, BUCO, ...) | PRD §5 | Product owner |
| B-04 | **Payment provider and model.** Paystack is the coded starter; confirm provider, payment methods, and whether KagoBuild bills only its own subscriptions or also takes payments for suppliers | [v4 §4, §9](../02-architecture/01-system-design-v4.md), [archive v2 notes](../archive/system-architecture-v2.md) | Product owner, finance |
| B-05 | **Refund and chargeback policy**, including what happens to entitlements | [Payments](../04-payments/01-payment-reliability.md) | Product owner, finance |
| B-06 | **Supplier price-feed rights** (API, CSV or manual) and data-sharing agreements | [TRD §7](../02-architecture/02-technical-requirements.md) | Business |
| B-07 | **Data residency, retention and consent** under POPIA, subject to financial-record retention | [Warehouse §7](../05-data-warehouse/01-warehouse-etl-design.md) | Legal |
| B-08 | **Real load targets and SLO budget** (see A-05, A-07) | [v4 §7](../02-architecture/01-system-design-v4.md) | Engineering lead |

## B. Baseline vs v4 conflicts

| ID | Topic | Baseline (Oct 2026) | v4 (2 Nov 2026) | Working assumption |
|----|-------|---------------------|-----------------|--------------------|
| A-01 | API framework | Node.js **Express** ([TRD §1](../02-architecture/02-technical-requirements.md)) | **Fastify 5** on Node.js 22, JSON Schema validation | v4 |
| A-02 | Operational datastores | **MongoDB** (users, projects, plans, jobs) + PostgreSQL + Redis ([Database schema](../02-architecture/04-database-schema.md)) | **PostgreSQL** OLTP + Redis + object storage; no MongoDB | v4. The baseline Mongo collections need mapping to Postgres tables |
| A-03 | Authentication | Custom: Argon2id, 15-min JWT, rotating refresh cookies, TOTP for admins (TRD §8) | **Managed auth (Supabase Auth)**, JWKS-verified RS256/ES256 tokens in HttpOnly cookies, MFA for admins, no custom password hashing | v4 |
| A-04 | Service topology and queues | Separate API, Socket and Admin pods; **BullMQ** queues; AI, calc, sync and notification workers ([Baseline design](../02-architecture/06-system-design-baseline.md)) | **Modular monolith** plus separate durable workers; transactional **outbox**; "do not start with 12 microservices" | v4; extract services only on measured triggers ([v4 §1.3](../02-architecture/01-system-design-v4.md)) |
| A-05 | Scale claims | Designed for **1,000,000 registered users**, 5,000 concurrent, 400 AI jobs ([Scalability](../02-architecture/05-scalability.md)) | Figures are hypotheses; load-test at 100 / 1,000 / 10,000 concurrent users first | v4 wording; keep the maths as a planning model |
| A-06 | Realtime | **Socket.io / WebSockets** for job progress ([App flow](../01-product/02-app-flow.md), TRD) | **SSE** for AI progress; WebSockets deferred to live chat | v4 |
| A-07 | Targets | NFR-04 read p95 ≤ 150 ms; NFR-06 RPO ≤ 5 min, RTO ≤ 1 h | GET project p95 ≤ 300 ms; RPO ≤ 15 min, RTO ≤ 4 h (both "to validate") | Undecided: pick one set after load and restore tests |
| A-08 | Billing in the baseline | No payment, subscription or webhook requirements in the TRD or database schema | Full billing domain: checkout, idempotency, webhooks, entitlements, reconciliation | v4; add billing to the TRD and schema when the model (B-04) is fixed |
| A-09 | Roadmap | 8 phases over about 18 months, 15 weeks to launch ([Implementation plan](03-implementation-plan.md)) | Phases A to E: secure foundation, billing readiness, AI pipeline, marketplace + warehouse, scale evidence | Keep both; v4 phases come first because the baseline's "current state" is outdated |
| A-10 | Warehouse engine | Move reporting to ClickHouse or BigQuery via CDC (Scalability §8) | Isolated PostgreSQL warehouse first; columnar engine later | Compatible: v4 order |

## How to close an item

1. Decide, and write the decision and date in the Resolution column below.
2. Update the affected document body (remove or rewrite the superseded passage and its status banner).
3. Add a line to the [CHANGELOG](../CHANGELOG.md).

| ID | Resolution | Date |
|----|------------|------|
| (none yet) | | |
