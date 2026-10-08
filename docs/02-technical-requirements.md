# 02. Technical Requirements Document (TRD)

## 1. Technology stack (aligned with the existing repo)

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Static multi-page HTML/CSS/JS (current), served from CDN; ES modules in `frontend/scripts` | Zero server cost per page view, trivially cacheable |
| API | Node.js (Express) in `backend/` | Matches existing folder layout |
| Documents DB | MongoDB (users, projects, floor plans, jobs) | Plans are nested, variable-shape documents |
| Relational DB | PostgreSQL (materials, suppliers, prices, estimates) | Money, joins, constraints, partitioning |
| Cache and queue | Redis (cache, rate limits, BullMQ queues, Socket.io adapter) | Fast reads, job orchestration |
| Realtime | Socket.io (`sockets/ai-status.socket.js`, `quotation.socket.js`) | Job progress and live estimate updates |
| AI | Provider-agnostic `openai.service.js` wrapper (LLM with structured output) | Swap providers, A/B models |
| Object storage | S3-compatible bucket + CDN | Exported PDFs, uploads, rendered SVG/PNG |
| Observability | OpenTelemetry, Prometheus/Grafana, Sentry, structured logs (`utils/logger.js`) | |
| CI/CD | GitHub Actions, containers, infrastructure as code | |

## 2. Functional requirements

| ID | Requirement |
|----|-------------|
| FR-01 | Register/login with email+password and OAuth (Google at MVP); email verification; password reset by code (matches `signin.html`) |
| FR-02 | Create project via 3-step wizard (create, configure, review) |
| FR-03 | Submit generation request; receive job id; stream progress by WebSocket |
| FR-04 | Return 3 layout options as validated structured plans plus rendered SVG |
| FR-05 | Accept refinement messages; return a new version of the selected option (immutable versions) |
| FR-06 | Run take-off engine on a plan to produce a bill of quantities |
| FR-07 | Price each BOQ line from the latest price per region and supplier; support user override of supplier/material |
| FR-08 | Compute totals: materials, labour, professional fees, permits, transport, contingency, VAT 15% |
| FR-09 | Save estimate versions, compare with previous, show history |
| FR-10 | Export PDF, CSV; Excel BOQ for paid plans |
| FR-11 | Teams: invite, roles, permissions, activity log |
| FR-12 | Notifications: in-app, email; price-change alerts on saved projects |
| FR-13 | Admin: users, plans, projects, AI models/prompts/jobs, materials, suppliers, pricing, rules, regions, finance, roles, audit logs, system |
| FR-14 | Rate limiting and plan quotas enforced server-side |

## 3. Non-functional requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Availability (API, read paths) | 99.9% monthly |
| NFR-02 | Plan generation latency | p50 ≤ 25 s, p95 ≤ 45 s for first option |
| NFR-03 | Estimate recalculation after edit | p95 ≤ 600 ms server, ≤ 300 ms perceived |
| NFR-04 | API read latency (cached) | p95 ≤ 150 ms |
| NFR-05 | Concurrency | 5,000 concurrent users and 400 concurrent AI jobs (see doc 08) |
| NFR-06 | Data durability | RPO ≤ 5 min, RTO ≤ 1 h |
| NFR-07 | Security | OWASP ASVS L2, encryption in transit and at rest, secrets in a secret manager |
| NFR-08 | Privacy | POPIA; data export and deletion |
| NFR-09 | Accessibility | WCAG 2.1 AA |
| NFR-10 | Browser support | Last 2 versions of Chrome, Edge, Safari, Firefox; mobile Safari/Chrome |
| NFR-11 | Money correctness | Decimal arithmetic only (numeric in SQL, integer cents in code) |

## 4. API surface (REST, versioned `/api/v1`)

| Area | Endpoints |
|------|-----------|
| Auth (`auth.routes.js`) | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/forgot`, `/auth/verify`, `/auth/reset`, `POST /auth/logout` |
| Projects (`plans.routes.js`) | `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`, `POST /projects/:id/duplicate` |
| Plans / AI (`ai.routes.js`) | `POST /projects/:id/generate` → `202 {jobId}`, `GET /jobs/:id`, `POST /plans/:id/refine`, `POST /projects/:id/variations`, `GET /plans/:id` |
| Materials (`materials.routes.js`) | `GET /materials?search&category&region`, `GET /materials/:id`, admin CRUD |
| Suppliers (`suppliers.routes.js`) | `GET /suppliers?region`, `GET /suppliers/:id`, `POST /suppliers/:id/sync` (admin) |
| Quotations (`quotations.routes.js`) | `POST /plans/:id/estimate`, `GET /estimates/:id`, `PATCH /estimates/:id/lines/:lineId`, `POST /estimates/:id/save`, `GET /estimates/:id/export?format=pdf|csv|xlsx` |
| Teams | `POST /teams/invites`, `GET /teams/members`, `PATCH /teams/members/:id` |
| Admin | `/admin/*` guarded by role permission matrix |

Conventions: JSON, ISO-8601 UTC timestamps, money as strings in minor units plus currency, cursor pagination, idempotency keys on `POST` that create jobs or estimates, RFC 7807 problem responses (`error.middleware.js`).

## 5. AI engine requirements

### 5.1 Pipeline (the AI proposes; deterministic code verifies)

1. **Brief normaliser:** converts form + free text into a typed `DesignBrief` JSON (schema validated).
2. **Layout generator (LLM, structured output):** returns a `PlanSpec` (room list, adjacency graph, target areas, orientation, openings, roof type, storeys). No pixels.
3. **Geometry solver (code):** places rooms on a grid within the plot, resolves overlaps, computes walls, openings and areas. Deterministic and unit-tested.
4. **Rules validator (code):** checks `building_rules` (min bedroom 9 m², max 2 storeys, plot coverage ≤ 60% where set, foundation depth, boundary setbacks, fire-rated walls by region). Violations feed back to the LLM for up to 2 repair attempts; otherwise the option is dropped.
5. **Renderer (code):** emits SVG (the format `ai-design.html` already displays), PNG and PDF.
6. **Take-off engine (code):** converts geometry plus specification to material quantities (section 6).
7. **Explainer (LLM):** writes the chat reply and per-driver notes from the computed facts only.

### 5.2 Plan data contract (abridged)

* `PlanSpec`: `{ version, units: "m", plot:{w,d}, storeys, style, roof:{type,pitch}, rooms:[{id,type,level,rect:{x,y,w,d},windows:[],doors:[]}], adjacency:[[a,b]], notes }`
* All dimensions in metres, rounded to 0.05; areas recomputed server-side and never trusted from the model.

### 5.3 Model requirements

* Structured-output (JSON schema) capable model; temperature ≤ 0.4 for layouts (matches admin AI settings).
* Prompt, model name, and version stored per job for reproducibility (`ai_jobs` doc).
* Hard timeout 30 s per call, 2 retries with backoff, circuit breaker; fallback to the previous model version or a template-based layout from `house-plan templates`.
* Content safety: input moderation; free text never executed; prompt-injection guard (the text only fills `brief.notes`).
* Cost control: token budget per job, per-user daily cap by plan, response caching keyed by normalised brief hash (identical briefs reuse layouts).

## 6. Take-off engine (material extraction)

Deterministic formulas per component, parameterised by region and finish level. Examples:

| Component | Formula (simplified) | Source parameters |
|-----------|----------------------|-------------------|
| External walls (bricks) | wall area (perimeter × height − openings) × bricks per m² (≈ 50 for single-skin stock brick) × (1 + wastage 5%) | `materials.wastage_pct` |
| Mortar / cement / sand | per 1,000 bricks coefficients | rules table |
| Foundations | strip length × width × depth (min 600 mm per rule) → m³ concrete + rebar kg per m³ | `building_rules`, steel factor |
| Roof | footprint ÷ cos(pitch) × overhang factor → m² sheets/tiles; trusses by span/spacing; wastage 8% | pitch, tile type |
| Floors and ceilings | room areas by finish | finish level |
| Plumbing / electrical | points per room type × unit packages | room templates |

Rules: unit tests with golden fixtures (five reference houses); coefficients versioned (`take_off_version`) and stored on each estimate so old estimates are reproducible.

## 7. Supplier integration requirements

| Source type | Mechanism | Refresh | Ownership |
|-------------|-----------|---------|-----------|
| **Live API** | Adapter per supplier in `services/suppliers/` implementing `fetchCatalogue()` and `fetchPrices(skus, region)` | Hourly for top 2,000 SKUs; daily full | Supplier Admin |
| **Feed/CSV** | SFTP/URL pull or admin upload, mapped by column template | Daily to weekly | Supplier Admin |
| **Manual** | Admin UI "Add price" / "Import supplier prices" (exists in `admin/pricing.html`) | As needed | Supplier Admin |

Requirements:

* Adapter interface with timeout, retry, circuit breaker, rate limit per supplier; credentials only via secret manager reference.
* Each run recorded in `ingest_runs` (rows read/updated/rejected, errors); admin dashboard shows failing feeds (e.g. "Cashbuild price sync failed").
* **Validation gates:** reject price ≤ 0; flag change > ±10% (review queue, as in the admin Pricing page); flag discrepancies versus the median of other suppliers.
* **Canonical mapping:** supplier SKU → canonical `materials.id` (via `supplier_products`); unmapped SKUs go to a review queue.
* Commercial/legal: written data-sharing agreements; respect robots/ToS; no scraping of suppliers who forbid it. Where there is no API, use feeds or manual uploads.

## 8. Security requirements

* Passwords: Argon2id; access JWT 15 min, rotating refresh tokens (httpOnly, SameSite=Lax cookies), device sessions list (matches Settings → Login Sessions).
* 2FA (TOTP) mandatory for admins (setting already present in System page).
* RBAC from the admin permission matrix (None/View/Manage by module); every admin action to the audit log (`audit-logs.html`).
* Input validation on every route (`validation.middleware.js`), file uploads scanned, type- and size-limited (`upload.middleware.js`).
* Secrets never in repo; rotate API keys; API keys displayed once.
* Rate limits: per IP and per user; stricter on auth and AI endpoints.
* Encryption: TLS 1.2+, AES-256 at rest, backups encrypted.
* Frontend: escape all dynamic HTML (several pages build `innerHTML` from data; keep the `esc()` helper everywhere), CSP, no secrets in `localStorage`. Note: settings, profile photo and API-key hints currently live in `localStorage` as demo behaviour. Move to server before launch.

## 9. Frontend requirements

* Replace demo data in pages with calls through `scripts/api.js` (currently empty); central fetch wrapper with auth refresh, error mapping, and retry for idempotent GETs.
* `scripts/planner.js`: wizard state, validation, submission; `floorplan-viewer.js`: SVG pan/zoom (the zoom/fullscreen UI already exists in `ai-design.html`); `socket-client.js`: job progress; `auth.js`: session handling.
* `utils/calculations.js`, `formatters.js`, `validators.js`: money formatting (`R 1,234.00`, en-ZA), unit conversions, shared validation rules mirrored server-side.
* Optimistic UI for quantity edits with server reconciliation.
* Performance budgets: LCP < 2.5 s on 4G, JS per page < 150 KB gzip, images lazy-loaded and served via CDN.

## 10. Testing requirements

| Level | Scope | Gate |
|-------|-------|------|
| Unit | Geometry solver, rules, take-off, money math | ≥ 90% on these modules |
| Contract | Supplier adapters against recorded fixtures; AI JSON schema | All pass in CI |
| Integration | API + DBs in containers | All pass |
| E2E | Brief → plan → estimate → export (Playwright) | Nightly + before release |
| Accuracy | Benchmark of real projects (PRD §8) | Regression alert if mean error worsens > 2 points |
| Load | k6 scenarios (doc 08) | Before each phase launch |
| Security | SAST/DAST, dependency scan, annual pen test | No criticals |
