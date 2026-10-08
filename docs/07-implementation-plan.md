# 07. Implementation Plan

## 1. Principles

1. Ship a thin vertical slice first (brief → plan → priced estimate), then widen.
2. Replace demo data page by page; keep the existing UI shell.
3. Deterministic core (solver, rules, take-off, pricing) before AI polish.
4. Measure accuracy from week 1 using real project benchmarks.

## 2. Current state (from the repo)

| Area | Status |
|------|--------|
| Frontend pages | Built with demo data: landing, auth, dashboard, projects, AI design, materials, estimator, reports, suppliers, teams, notifications, settings, premium, help, plus 19 admin pages |
| Frontend scripts | `main.js`, `mobile.js`, admin shell/UI done; `api.js`, `auth.js`, `planner.js`, `floorplan-viewer.js`, `socket-client.js`, and `utils/*` are empty |
| Backend | All folders scaffolded; every file empty |
| SQL | Empty files, now provided (this deliverable) |

## 3. Phases

### Phase 0: Foundations (weeks 1 to 2)
* Repo hygiene: lint, formatter, CI, environments, secrets manager, IaC skeleton.
* Resolve open decisions (plan prices, brand name, supplier list).
* Legal: terms, privacy (POPIA), supplier data-sharing templates.
* Collect **benchmark set**: 20 real houses (plan, quantities, invoices) to start.
**Exit:** CI green, staging deployed, benchmark v0 stored.

### Phase 1: Core backend (weeks 3 to 6)
| Work | Files |
|------|-------|
| Config/env/db/socket bootstrap | `config/*` |
| Auth (register/login/refresh/verify/reset, sessions, 2FA for admins) | `auth.controller.js`, `auth.routes.js`, `auth.middleware.js`, `User.js` |
| Validation, errors, uploads | `validation.middleware.js`, `error.middleware.js`, `upload.middleware.js` |
| Catalogue + supplier models, seed data (≥3 suppliers, 2 regions, ~300 materials) | `models/sql/*`, `materials.controller.js`, `suppliers.controller.js` |
| Pricing service + Redis cache + admin price import | `pricing.service.js`, `supplier.service.js` |
| Projects CRUD | `plans.controller.js`, `Project.js` |
**Exit:** Postman/contract tests pass; admin can import prices; frontend login works.

### Phase 2: Deterministic design engine (weeks 5 to 9, overlaps)
* PlanSpec schema, geometry solver, rules validator, SVG renderer (`plan-generator.service.js`).
* Take-off engine with golden fixtures (`material-extractor.service.js`, `estimator.service.js`).
* Template library (24 templates, 6 styles) as fallback and as few-shot seeds.
**Exit:** 5 reference houses produce plans that pass rules and quantities within ±10% of QS take-offs.

### Phase 3: AI integration (weeks 8 to 11)
* `openai.service.js` wrapper (structured output, retries, circuit breaker, cost tracking).
* Brief normaliser, layout generator, repair loop, explainer; prompts versioned in admin (AI management page).
* Queues + workers (`generate-plan.job.js`, `extract-materials.job.js`, `calculate-cost.job.js`), Socket progress (`ai-status.socket.js`, `quotation.socket.js`).
**Exit:** p95 first-option ≤ 45 s; ≥ 99% pass rules; per-plan cost within budget.

### Phase 4: Frontend wiring (weeks 7 to 12, parallel)
Order by value: auth pages → wizard (`projects.html`) → AI Design (`ai-design.html`) → Estimator → Materials/Suppliers → Reports/exports → Teams/Notifications/Settings → Admin pages.
* Implement `api.js` (fetch wrapper), `auth.js`, `planner.js`, `floorplan-viewer.js`, `socket-client.js`, `utils/*`.
* Remove `localStorage` demo state for anything that must be server-side (profile, keys, sessions).
**Exit:** End-to-end flow works on staging with real data.

### Phase 5: Hardening and beta (weeks 12 to 14)
* Load test (doc 08 scenarios), security review, accessibility audit, mobile QA.
* Closed beta with 100 users + 10 builders; accuracy review against actual quotes.
* Observability dashboards and runbooks; backup/restore drill.
**Exit (go-live gate):** all NFR targets met at 2× expected beta load; no critical/high security findings; accuracy ≥ 70% within ±10%.

### Phase 6: Public launch (week 15)
Gauteng + Western Cape; Free + Pro; monitoring war-room; feature flags to throttle AI.

### Phase 7: Growth (months 4 to 9)
Supplier API breadth (≥ 8 suppliers), KZN/Eastern Cape, quote requests, commission tracking, price alerts, Excel BOQ, team features, PWA offline, dark theme.

### Phase 8: Scale and expansion (months 9 to 18)
3D viewer, site-photo input, more storeys, multi-currency/new countries, public estimate API, read-replica/shard expansion as numbers demand (doc 08 triggers).

## 4. Team (MVP)

| Role | Count |
|------|-------|
| Product manager / owner | 1 |
| Frontend engineers | 2 |
| Backend engineers | 2 |
| AI/ML engineer (prompting, evaluation, solver) | 1 |
| Data/integration engineer (suppliers, pricing) | 1 |
| Quantity surveyor / architect advisor (part-time) | 1 |
| Designer | 1 |
| QA / SDET | 1 |
| DevOps/SRE (part-time to full) | 1 |

## 5. Sprint-level backlog (first 6 two-week sprints)

| Sprint | Goals |
|--------|-------|
| 1 | CI/CD, env config, auth endpoints, SQL schema loaded, seed catalogue |
| 2 | Projects CRUD, price import (CSV) + `current_prices`, admin Pricing/Materials wired |
| 3 | PlanSpec + solver + validator + SVG renderer; template fallback |
| 4 | Take-off engine + estimate API + estimator page wired |
| 5 | LLM layout generator + repair loop + jobs + sockets; AI Design wired |
| 6 | Exports (PDF/CSV), teams/invites, notifications, load test v1, closed-beta prep |

## 6. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Suppliers won't give API access | High | High | Start with CSV/manual; negotiate with commission offer; keep manual price admin strong |
| AI layouts violate rules or look odd | Medium | High | Solver+validator, repair loop, templates, human QS review of samples |
| Estimates inaccurate | Medium | High | Benchmark, calibration factors, show ranges, label as estimate |
| LLM cost per plan too high | Medium | Medium | Cache by brief hash, smaller models for normalise/explain, per-plan token caps, quotas |
| Price data quality | High | Medium | Validation gates, review queue, staleness flags |
| Regulatory liability | Low | High | Clear disclaimers, no "approved" claims, legal review |
| Scope creep to 3D/AR | Medium | Medium | MoSCoW discipline; Phase 8 |
| Single-provider dependency | Medium | Medium | Provider-agnostic wrapper, fallback model |

## 7. Definition of done (any feature)

Unit + integration tests, API documented, accessible, instrumented (metrics + logs), feature-flagged if risky, reviewed by one other engineer, deployed to staging, acceptance criteria verified by product.

## 8. KPIs reviewed weekly

Estimates created, plan success rate, p95 latency, AI cost/plan, price staleness %, accuracy vs benchmark, signup→estimate conversion, support tickets per 1,000 users.
