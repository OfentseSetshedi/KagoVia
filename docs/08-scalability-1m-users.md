# 08. Scalability and Deployment Suitability (1,000,000 Users)

## 1. What "1 million users" means here (planning assumptions)

| Assumption | Value | Basis |
|------------|-------|-------|
| Registered users | 1,000,000 | Target |
| Monthly active (MAU) | 25% → 250,000 | Typical for project-based tools; occasional use |
| Daily active (DAU) | 4% of registered → 40,000 | |
| Peak concurrent users | 10% of DAU → 4,000 (design for 5,000) | Evening peak |
| AI generations per DAU per day | 3 (including refinements) → 120,000/day | Paid users heavier, Free capped |
| Average peak AI arrival rate | 10 jobs/s (evening 2-hour window at 3× average) | |
| AI job duration | ~40 s | Mostly waiting on the LLM |
| Estimate calculations per DAU | 6/day → 240,000/day | |
| Lines per estimate | 200 to 500 | |
| Supplier SKUs mapped | 38 suppliers × ~10,000 = 380,000 | |
| Price rows ingested | ~1.5M/day (daily full + hourly hot) | |

These are planning numbers, not measurements; the load tests below validate them, and the design has headroom of 3 to 5× on each.

## 2. Load by subsystem and the design answer

| Subsystem | Peak load | Why the design handles it |
|-----------|-----------|---------------------------|
| **Static pages/assets** | Tens of thousands of requests/min | CDN-cached; origin sees almost none. Each page is static HTML + versioned JS/CSS |
| **API reads (projects, estimates, catalogue)** | ~1,500 RPS peak (4,000 users × ~0.4 req/s) | Stateless pods; Redis for hot data; indexed Mongo/Postgres reads; 10 pods × 200 RPS = 2,000 RPS with room to autoscale |
| **AI jobs** | 10 jobs/s × 40 s ≈ **400 concurrent jobs** | I/O-bound workers (async); 40 workers × 10 concurrent jobs each; queue absorbs bursts; Free tier throttled first; LLM provider rate limits managed with a token-bucket and multiple keys/providers |
| **Estimate calculations** | ~3 to 10/s | Take-off is CPU-light (tens of ms); price lookups are 200 to 500 `MGET`s from Redis in 1 to 3 ms |
| **Price history writes** | ~20 rows/s average | Batched inserts into monthly partitions: trivial for Postgres |
| **Price reads for estimates** | ~3,000 to 5,000 point reads/s | Served from Redis (95%+ hit ratio); fall-through to indexed `current_prices` |
| **WebSocket connections** | 4,000 to 5,000 | ~10k connections per pod possible; use 3 pods + Redis adapter |
| **Exports (PDF/CSV)** | ~1/s | Async workers; results cached in object storage |
| **Storage** | 1M users × ~30 MB (plans, SVG, exports) ≈ 30 TB over time | Object storage with lifecycle rules (cold after 90 days); DB holds only keys |

## 3. Why the architecture suits 1M users

1. **Stateless horizontal scaling.** API, socket, and worker tiers hold no local state, so capacity grows by adding pods, not by redesign.
2. **Work is split by cost.** Cheap reads stay on the fast path; expensive, slow work (LLM, export, supplier sync) is queued and scaled by queue depth with explicit back-pressure and per-plan quotas.
3. **Heavy computation avoided where possible.** Results are cached: identical briefs reuse plans; prices are pre-joined into `current_prices`; estimates read one row per item, never scan history.
4. **Data model fits the access pattern.**
   * Mongo documents are read/written whole by owner → shard on `ownerId` (even distribution, no cross-shard queries for normal use).
   * Postgres holds the relational, money-critical data; `prices` is partitioned monthly (small indexes, cheap archiving); `current_prices` stays ≈ 400k rows × regions (a few million), which fits in memory.
5. **Isolation of failure.** Supplier outages, LLM outages and exports cannot block logins or estimate viewing; circuit breakers and fallbacks degrade gracefully (templates, last-known prices with age warnings).
6. **Cost scales sub-linearly.** Static content on CDN; caching reduces LLM calls; small models for classification/explanation; quotas tie AI cost to revenue tiers.
7. **Security and compliance built in**, not retrofitted (POPIA, audit logs, RBAC, encryption), which matters for a consumer product with financial data.
8. **Operational readiness.** Observability, SLOs, autoscaling signals, runbooks, backup/restore drills and DR region are in the plan before launch.

## 4. Capacity plan (starting sizing for ~1M registered)

| Tier | Sizing (initial) | Scale trigger |
|------|------------------|---------------|
| CDN/WAF | Managed | n/a |
| API pods | 8 to 12 × (2 vCPU, 4 GB) | CPU > 60% or p95 > 150 ms |
| Socket pods | 3 × (2 vCPU, 4 GB) | Connections > 60% of per-pod limit |
| AI workers | 20 to 40 × (1 vCPU, 2 GB), concurrency 10 | Queue wait > 30 s |
| Calc/export workers | 6 to 10 × (2 vCPU, 4 GB) | Queue depth |
| Supplier sync workers | 4 × (1 vCPU, 2 GB) | Runs overlapping |
| Redis | Cluster, 3 shards × 16 GB, replicas | Memory > 70% |
| MongoDB | 3-shard cluster, 3-node replica sets, 64 GB RAM nodes | Working set > RAM; shard split |
| PostgreSQL | Primary 16 vCPU / 64 GB + 2 read replicas | Replica lag, CPU > 60% |
| Object storage | Scales automatically | Lifecycle rules |

Data size estimates: Mongo ≈ 1M users × (profile 5 KB + 3 projects × 50 KB + 10 plan versions × 30 KB) ≈ 450 GB; Postgres: `prices` ≈ 1.5M rows/day × ~80 B ≈ 120 MB/day ≈ 44 GB/year (partitioned); `estimates` ≈ 240k/day at peak but saved ones far fewer (assume 20k/day) × 300 lines ≈ 6M lines/day worst case ≈ 1 GB/day → partition `estimate_lines` by month when the table exceeds ~500M rows (trigger noted in monitoring).

## 5. Performance techniques

* **Caching:** Redis for prices (key `price:{region}:{supplierProductId}`), catalogue lists, rules, session/JWT denylist; ETag/Cache-Control for catalogue endpoints; CDN for exports.
* **Batching:** price lookups with `MGET`/`WHERE (a,b) IN (...)` in one round trip; bulk upserts for ingest.
* **Indexing:** covered indexes for the hot queries (see SQL): `(supplier_product_id, region_id)` PK on `current_prices`, `(estimate_id)` on lines, `(owner_id, updated_at)` on projects.
* **Payloads:** gzip/brotli, pagination (cursor), field selection; SVG plans are small (tens of KB).
* **Connection management:** pgBouncer for Postgres, bounded pools, per-service limits.
* **Idempotency & dedupe:** job idempotency keys; brief-hash cache prevents duplicate LLM spend.
* **Client:** debounce edits, compute totals locally, lazy-load heavy modules, service-worker caching.

## 6. Protection against overload and abuse

| Control | Setting |
|---------|---------|
| Per-IP and per-user rate limits | e.g. 300 req/min/user; 10 AI requests/hour on Free |
| AI quotas by plan | Free 2/month; paid per tier; hard caps on spend per day |
| Queue priority | Paid > Free; back-pressure message when wait > 2 min |
| Bot protection | WAF challenge on signup/login, email verification |
| Load shedding | Disable non-critical features (suggestions, history) first |
| Kill switch | "AI plan generation" switch (exists in admin System page) |

## 7. Load-test plan (before each phase launch)

| Scenario | Target | Pass criteria |
|----------|--------|---------------|
| Browse/edit mix | 5,000 concurrent virtual users, 30 min | p95 < 150 ms reads, error < 0.1% |
| AI burst | 15 jobs/s for 30 min (1.5× peak) with a stub LLM, then real LLM at 3 jobs/s | Queue wait p95 < 60 s; no job loss |
| Price ingest + reads | Full catalogue ingest while serving 5,000 reads/s | No read degradation; ingest < 20 min |
| Export storm | 100 exports/s for 5 min | p95 < 10 s; no failures |
| Chaos | Kill LLM, kill a Redis node, fail Postgres primary, supplier timeouts | Degrade per section 5 of doc 06; recover within RTO |
| Soak | 24 h at 60% peak | No leaks; stable memory |

## 8. Growth path beyond 1M

| Signal | Action |
|--------|--------|
| Mongo working set > RAM | Add shards (shard key `ownerId` already in place) |
| Postgres read CPU high | Add replicas; move reporting to a warehouse (ClickHouse/BigQuery) via CDC |
| `estimate_lines` > ~500M rows | Partition by month; archive old estimates to cold storage |
| LLM cost/plan rises | Distil to smaller fine-tuned model; larger cache; more templates |
| New countries | Region + currency + rules are data (tables exist); deploy a regional stack for latency/residency |
| Org growth | Split services (AI, Pricing, Projects) into independently deployable services; the queue boundaries already define seams |

## 9. Cost control (indicative levers)

CDN offload, LLM caching and quota gating, reserved capacity for base load with autoscaling for peaks, partition archiving, lifecycle rules, rightsized workers by queue depth, and a weekly unit-economics review (cost per plan, cost per estimate, cost per active user).

## 10. Honest limits

* The single biggest risk is **not** infrastructure; it is **supplier data access and estimate accuracy**. Both are addressed in the product plan (doc 01/07), and they decide whether users keep coming back at 1M scale.
* LLM provider limits and pricing are an external dependency; the multi-provider wrapper, caching and quotas reduce but do not remove it.
* The numbers above are assumptions until measured in beta; each trigger in section 4/8 should be revisited with real telemetry.
