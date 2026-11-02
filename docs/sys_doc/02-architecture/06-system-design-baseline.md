# System Design (baseline, October 2026)

> **Status:** **Superseded in part** by [System design v4](01-system-design-v4.md). Kept because its failure-mode table, observability signals and AI-pipeline decisions are still useful. Differences (microservice-style pods, MongoDB, Socket.io, BullMQ) are listed in the [Decision register](../00-overview/02-decision-register.md).

## 1. Architecture overview

```
                       ┌────────────┐
 Browser / PWA ───────►│ CDN + WAF  │── static pages, assets, exports (signed URLs)
                       └─────┬──────┘
                             │ /api, /socket
                       ┌─────▼──────┐
                       │ Load balancer │ (TLS, rate limit)
                       └─────┬──────┘
          ┌──────────────────┼──────────────────┐
   ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
   │ API pods    │    │ Socket pods │    │ Admin API   │  (stateless, autoscaled)
   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
          │                  │ Redis pub/sub    │
          ├──────────────► Redis (cache, sessions, rate limits, queues)
          │
   ┌──────▼──────────────────────────────────────────────────────┐
   │ Queues (BullMQ): generate-plan · refine · extract-materials │
   │ calculate-cost · export · supplier-sync · notifications     │
   └──────┬──────────────────────────────────────────────────────┘
          │
   ┌──────▼──────┐   ┌───────────┐   ┌────────────┐   ┌─────────────┐
   │ AI workers  │   │ Calc/Export│   │ Supplier   │   │ Notification│
   │ (LLM calls) │   │ workers    │   │ sync workers│  │ workers     │
   └──────┬──────┘   └─────┬─────┘   └─────┬──────┘   └─────────────┘
          │                │               │
     LLM provider(s)       │        Supplier APIs / feeds
                           │
   ┌───────────────────────▼───────────────────────────┐
   │ MongoDB (sharded replica set)  ·  PostgreSQL       │
   │ (primary + read replicas, partitioned prices)      │
   │ Object storage (exports, renders)                  │
   └────────────────────────────────────────────────────┘
```

## 2. Components

| Component | Responsibility | Scaling unit |
|-----------|----------------|--------------|
| CDN/WAF | Serve static frontend, cache exports, absorb attacks | Managed |
| API service | Auth, CRUD, estimate reads, enqueue jobs | Horizontal pods, CPU-bound |
| Socket service | Job progress, live estimate pushes | Horizontal, sticky not required (Redis adapter) |
| AI workers | Brief normaliser, LLM calls, solver, validator, renderer | Scale by queue depth |
| Calc workers | Take-off, pricing, totals, exports | Scale by queue depth |
| Supplier-sync workers | Adapters, validation gates, upserts | Fixed small pool + per-supplier concurrency limit |
| Admin service | Admin routes, audit logging | Separate deployment, IP-restricted |
| Redis | Cache, queues, rate limit counters | Cluster |
| MongoDB | User/project/plan/job documents | Shard by `ownerId` |
| PostgreSQL | Catalogue, prices, estimates | Primary + replicas; partition `prices` |

## 3. Key design decisions

| Decision | Why |
|----------|-----|
| **AI generates a spec; code draws, validates and counts** | Language models are poor at geometry and arithmetic. Deterministic stages make plans valid, quantities reproducible, estimates auditable |
| **Async jobs for anything slow** | Keeps API threads free; users see progress; retries and backpressure are natural |
| **Estimates read `current_prices` (one indexed row per supplier product + region)** | Estimate = ~200 to 500 point lookups, answered from Redis/Postgres in milliseconds, independent of price-history size |
| **Immutable plan versions and priced estimates** | Safe undo, comparison, legal defensibility of what the user saw |
| **Stateless services, state in managed stores** | Autoscale and recover without coordination |
| **Provider-agnostic AI wrapper + circuit breakers** | Survive provider outages and price changes; A/B models |
| **Static frontend on CDN** | The 95% of traffic that is page loads costs almost nothing and scales for free |

## 4. Core data flows

### 4.1 Generate plan
API validates quota → writes `job` → enqueues `generate-plan` → worker: normalise → LLM (structured) → solve → validate (repair ≤ 2) → render → store `floorplans` + SVG → emit progress/done via Redis pub/sub → Socket pod pushes to the user's room.

### 4.2 Price an estimate
`POST /plans/:id/estimate` → take-off (CPU, ~tens of ms) → batch fetch prices `MGET price:{region}:{supplierProductId}` from Redis (miss → Postgres `current_prices`, backfill) → choose cheapest available per canonical material or the user's chosen supplier → totals with decimal math → persist estimate + lines → return.

### 4.3 Supplier sync
Scheduler enqueues `supplier-sync:{supplierId}` → adapter pulls (rate-limited, circuit-breaker) → map SKUs → validation gates (≤0 reject, >±10% flag, outlier vs median flag) → batch upsert `current_prices` + append `prices` → update Redis → record `ingest_runs` → alert on failure (feeds the admin "Needs attention" list).

## 5. Reliability and failure modes

| Failure | Detection | Behaviour |
|---------|-----------|-----------|
| LLM slow/down | Timeout, error rate | Retry with backoff → fallback model → template-based layout; admin banner; queue keeps jobs |
| Supplier API down | Failed `ingest_runs`, circuit open | Keep last prices, mark age; estimates warn "prices X h old" |
| Bad price data | Validation gates | Quarantined in review queue; old price stays live |
| Redis loss | Health checks | Fall back to Postgres; rebuild cache; rate limiter fails open for reads, closed for AI |
| Postgres primary fail | Automated failover | Replica promoted; writes pause < 60 s; reads continue from replicas |
| Mongo shard fail | Replica set election | Automatic |
| Worker crash mid-job | Visibility timeout | Job retried (idempotent by job id); max 3 attempts then `failed` with user-friendly retry |
| Traffic spike | Autoscaling metrics | Scale API on CPU/latency, workers on queue depth; load shedding on Free tier AI first |
| Region outage | Multi-AZ | Survive AZ loss; DR region restore within RTO |

## 6. Security architecture

* Edge: WAF, bot management, DDoS protection, TLS everywhere.
* Network: private subnets for databases/workers; only LB public; egress allow-list (suppliers, LLM provider).
* Identity: short-lived JWT + rotating refresh tokens; RBAC from the roles matrix; admin on a separate host with IP allow-list and mandatory 2FA.
* Data: encryption at rest; field-level encryption for secrets; signed, expiring URLs for exports.
* Governance: audit log for all admin actions; secrets rotation; dependency scanning; annual penetration test; incident runbooks.
* AI-specific: prompt-injection isolation (user text never merged into system instructions), output schema validation, moderation, per-user spend caps.

## 7. Observability

| Signal | Examples | Alert |
|--------|----------|-------|
| Metrics | RPS, p95 latency, queue depth, job duration, LLM error rate, cost per plan, cache hit ratio, price staleness % | p95 > target 5 min; queue wait > 2 min; error rate > 2% |
| Logs | Structured JSON with `requestId`, `jobId`, `userId` hash | Anomalies |
| Traces | API → queue → worker → LLM/DB | Slow spans |
| Business | Plans/day, conversion, estimate accuracy | Weekly review |
| Synthetic | Login → generate → estimate every 5 min | Pager |

## 8. Deployment topology

* Environments: dev, staging (prod-like, anonymised data), production.
* Containers on managed Kubernetes (or equivalent); blue/green or canary releases; database migrations backward-compatible (expand/contract).
* Region: primary in South Africa (data residency/latency), multi-AZ; DR in a second region with replicated backups.
* Infrastructure as code; secrets via manager; feature flags for AI model rollout and plan quotas.
