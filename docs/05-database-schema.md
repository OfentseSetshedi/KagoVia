# 05. Database Schema

SQL DDL lives in `backend/models/sql/` (Material.sql → Supplier.sql → Pricing.sql). Document models for MongoDB are defined here and implemented in `backend/models/mongo/`.

## 1. Why two stores

| Data | Store | Reason |
|------|-------|--------|
| Users, projects, plans (nested geometry), AI jobs, notifications | MongoDB | Variable-shape, nested, read as whole documents, easy to shard by `userId` |
| Catalogue, suppliers, prices, estimates and lines | PostgreSQL | Money correctness, constraints, joins, partitioning, reporting |
| Hot reads (current prices, sessions, rate limits) | Redis | Millisecond reads; rebuilt from Postgres if lost |
| Files (exports, uploads, renders) | Object storage | Cheap, CDN-fronted |

## 2. MongoDB collections

### users
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `email` | string, unique, lowercased | |
| `passwordHash` | string | Argon2id |
| `name`, `phone`, `photoUrl` | string | |
| `type` | enum homeowner / builder / architect | |
| `role` | enum user / admin roles (Super Admin, AI Admin, …) | |
| `plan` | `{ tier, status, renewsAt, aiQuotaUsed, aiQuotaResetAt }` | |
| `teamId` | ObjectId | null for solo |
| `twoFactor` | `{ enabled, secretRef }` | secret in secret manager/encrypted |
| `sessions[]` | `{ id, device, ip, lastSeenAt, refreshHash }` | max 10 |
| `prefs` | `{ currency, unit, region, timezone, notifications }` | |
| `emailVerifiedAt`, `createdAt`, `deletedAt` | date | soft delete for 30 days |
Indexes: `email` unique, `teamId`, `createdAt`.

### projects
| Field | Type | Notes |
|-------|------|-------|
| `_id`, `ownerId`, `teamId` | ObjectId | shard key: `ownerId` |
| `name`, `type`, `status` (draft/active/approved), `favorite` | | |
| `location` | `{ regionCode, town, lat, lng }` | |
| `brief` | DesignBrief (see TRD §5.2) | |
| `budget` | `{ total, currency, contingencyPct }` | minor units |
| `selectedPlanId`, `latestEstimateId` | | pointers |
| `checklist[]` | `{ title, state, assignee, dueDate, notes }` | |
| `progress` | `{ design, materials, suppliers, budget }` | 0..100 |
| `createdAt`, `updatedAt`, `updatedBy` | | |
Indexes: `{ownerId, updatedAt:-1}`, `{teamId, updatedAt:-1}`, text on `name`.

### floorplans
| Field | Type | Notes |
|-------|------|-------|
| `_id`, `projectId`, `ownerId` | | |
| `option` | A / B / C | |
| `version` | int | immutable versions; new doc per refinement |
| `parentVersionId` | ObjectId | version chain |
| `spec` | PlanSpec JSON | source of truth |
| `stats` | `{ beds, baths, areaM2, storeys }` | recomputed server-side |
| `rulesReport[]` | `{ ruleCode, ok, message }` | |
| `svgKey`, `pngKey` | string | object-storage keys |
| `model` | `{ provider, name, version, promptId }` | reproducibility |
| `createdAt` | | |
Indexes: `{projectId, option, version:-1}`.

### jobs
| Field | Type | Notes |
|-------|------|-------|
| `_id`, `userId`, `projectId` | | |
| `type` | generate / refine / variations / extract / estimate / export | |
| `status` | queued / running / done / failed / cancelled | |
| `progress`, `attempts`, `error` | | |
| `input`, `outputRef` | | |
| `startedAt`, `finishedAt`, `durationMs`, `tokens`, `costZar` | | for AI cost analytics |
Indexes: `{userId, createdAt:-1}`, `{status, createdAt}`; TTL 90 days on done jobs.

### notifications, teams, invites, audit_events
* `notifications`: `{userId, type, title, body, link, readAt, createdAt}`; TTL 180 days.
* `teams`: `{ownerId, name, members[{userId, role, permissions[]}]}`; `invites`: `{teamId, email, role, permissions, expiresAt, tokenHash}`.
* `audit_events` (admin actions): `{actorId, action, target, ip, result, at}`; append-only, 2-year retention, written also to a WORM bucket.

## 3. PostgreSQL tables (see SQL files)

| Table | Purpose |
|-------|---------|
| `regions` | Supported regions, currency, labour factor |
| `units`, `material_categories` | Reference data |
| `materials` | Canonical catalogue (what the take-off engine asks for) |
| `building_rules` | Locked/active rules by category and region |
| `suppliers`, `supplier_branches` | Who sells, where, how prices arrive, commission |
| `supplier_products` | Supplier SKU → canonical material mapping |
| `ingest_runs` | Every price sync attempt and its outcome |
| `prices` | Append-only price history, partitioned monthly |
| `current_prices` | Latest price per (supplier product, region); this is what estimates read |
| `labour_rates`, `estimation_rules` | Labour and percentage rules (contingency, wastage, fees) |
| `estimates`, `estimate_lines` | Saved estimate versions with the exact prices used |

## 4. Refresh cadence

| Data | Frequency | Mechanism |
|------|-----------|-----------|
| Top 2,000 SKUs from API suppliers | Hourly | Scheduled job per supplier, small batches, jitter |
| Full catalogue API suppliers | Daily (02:00 SAST) | Batch job, upsert into `current_prices` |
| CSV/feed suppliers | Daily to weekly | Pull or admin upload |
| Manual prices | On change | Admin UI |
| Stale-price scan | Every 15 min | Marks lines older than 7 days; admin KPI "Stale prices" |
| Estimate re-pricing alert | Nightly | Compare saved estimates to current prices; notify if total moves > 5% |
| Redis price cache | On write plus 10 min TTL | Write-through from the ingest job |
| Building rules | On source regulation change | Super Admin approval for locked rules; quarterly review |

## 5. Data integrity rules

* Money is `numeric(12,2)` in Postgres, integer minor units in JSON/Mongo; no floats anywhere.
* An estimate line stores `unit_price` and `price_observed_at` at the time of calculation. Changing prices later never rewrites history.
* Deleting a material is a soft delete (`is_active=false`); referenced lines remain valid.
* All PII in Mongo only; Postgres holds `user_id` strings (no names/emails), simplifying POPIA deletion.

## 6. Retention and backup

| Data | Retention |
|------|-----------|
| Active projects/plans | While the account exists |
| Deleted accounts | 30-day grace, then hard delete (cascade by `ownerId`) |
| `prices` partitions | 24 months hot, older partitions archived to cold storage |
| Jobs | 90 days |
| Audit events | 2 years |
| Backups | PITR 7 days, daily snapshots 35 days, monthly 12 months; quarterly restore drills |
