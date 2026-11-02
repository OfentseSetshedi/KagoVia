# Cache strategy and invalidation

| Object | Cache | TTL | Key | Invalidation | Warning |
|---|---|---|---|---|---|
| Immutable frontend assets | CDN | 1 year if fingerprinted | path + content hash | new asset URL on deploy | Current legacy assets are **not** fingerprinted; do not set 1-year immutable yet |
| Public material catalogue (not binding quote) | Redis and short HTTP cache | 45 seconds Redis, 20 seconds browser | `kb:v1:materials:{region}:{limit}` | invalidate region on price/catalogue update | Redis cache in reference code; webhook invalidation not implemented |
| Supplier public profiles | Redis | 60–300 seconds proposed | supplier + region + version | supplier approval/edit event | Not implemented |
| Session / user permissions | No shared HTTP cache | per request | identity JWT + DB RBAC | verified token/DB lookup | Never cache sensitive authorization decisions without revocation plan |
| Current price estimate | PostgreSQL transaction snapshot | none as source of truth | estimate version | explicitly create new estimate | Never charge from stale browser/Redis price |
| AI result/plan version | private object storage + signed URLs | versioned immutable | project + plan version | no in-place edits | Access check before issuing URL |
| Payments/subscriptions | **Never cache for authoritative status** | n/a | payment ID | n/a | Read DB/provider, not CDN |
| Analytics dashboards | warehouse snapshots/cache | 5–15 minutes | organisation+role+filters | ETL watermark | Mark data-as-of timestamps and prevent cross-tenant leaks |

## Cache correctness
Use **cache aside** for read-heavy public data and jittered TTL to avoid thundering herds. Emit invalidation events through the transactional outbox for writes. If Redis is unavailable, degrade to PostgreSQL with strict limits, not an authentication bypass. Distributed rate-limit state **must** be shared when scaled to multiple instances; use a managed Redis highly available setup and define fail-open/fail-closed policy per route. Payments, auth and quota-heavy AI requests should fail safely if shared limits are unavailable.
