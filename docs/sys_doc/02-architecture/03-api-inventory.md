# API Inventory and Versioning — v4 starter

> **Status:** Current (2 Nov 2026). Route paths here are the v4 reference implementation and take precedence over the endpoint list in [TRD §4](02-technical-requirements.md).

**Base:** `/api/v1` (major breaking revisions use `/api/v2`, do not silently change semantics). Webhook base `/webhooks/v1` independently versioned. **Never publish `/debug`, `/internal`, a default admin account, or `/api/unversioned` to the public edge.**

| Route | Type | Auth | Limit/cache policy | Code status |
|---|---|---|---|---|
| `GET /health/live` | health | public | simple output | Coded |
| `GET /health/ready` | health | public | DB availability only | Coded |
| `POST /auth/register` | identity | browser Origin | 5/min, no-store | Coded |
| `POST /auth/login` | identity | browser Origin | 5/min, no-store | Coded |
| `POST /auth/forgot` | identity | browser Origin | 5/min, no-store | Coded |
| `POST /auth/refresh` | identity | refresh cookie + browser Origin | 5/min, no-store | Coded |
| `POST /auth/logout` | identity | browser Origin | no-store | Coded |
| `GET /auth/me` | identity | signed JWT | no-store | Coded |
| `GET /projects` | projects | authenticated | page limit 100, private | Coded |
| `POST /projects` | projects | authenticated | JSON schema, private | Coded |
| `GET /projects/{uuid}` | projects | owner | private; 404 for other user's ID | Coded |
| `PATCH /projects/{uuid}` | projects | owner | optimistic version, private | Coded |
| `GET /materials` | catalogue | public | Redis 45s, HTTP max-age 20s | Coded |
| `GET /admin/session` | admin | DB admin role | no-store | Coded |
| `GET /admin/overview` | admin | DB admin role | no-store | Coded |
| `POST /billing/checkout-sessions` | billing | logged-in owner + UUID idempotency key | rate/global + business limits | Coded starter; **not production tested** |
| `GET /billing/payments/{uuid}` | billing | payment owner | no-store | Coded |
| `POST /billing/payments/{uuid}/reconcile` | billing | payment owner | 4/min, no-store | Coded starter |
| `GET /me/entitlements` | billing | current user | no-store | Coded |
| `POST /webhooks/v1/payments/paystack` | webhook | provider HMAC SHA512 | 120/min and 128k body; no browser Origin | Coded starter |
| `POST /projects/{uuid}/generations` | AI | project owner + quota | durable outbox | **Design only** |
| `GET /generations/{uuid}/events` | SSE | job owner | heartbeat, last event ID | **Design only** |
| `/support/chats/...` | WebSocket | authenticated | per message controls | **Design only** |
| `/graphql` | GraphQL | query/field permission | depth/cost | **Not recommended now** |
| internal gRPC | Protobuf | mTLS service identity | quotas | **Not recommended now** |

Additional checks before release: enumerate actual HTTP routes at build time, compare to this inventory, deprecate old routes explicitly, and alert on unknown paths. Frontend `.html` pages and static assets are not backend data APIs. Cross-origin requests are not authorized solely by CORS settings.
