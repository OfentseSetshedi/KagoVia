# Deployment guide — reference, not executed

> **Status:** Reference procedure, not executed. Paths such as `app/backend` refer to the v4 package root.

1. Create separate **dev**, **stage**, and **production** environments. Provision private managed PostgreSQL (TLS, backup/PITR), Redis, object storage, metrics and secret manager.
2. Obtain your **own** Supabase Auth project. Enable **asymmetric JWT signing keys** (RS256/ES256) for the JWKS verifier; configure email confirmations, correct redirect URLs, CAPTCHA/abuse controls, password reset and MFA for admins. The bundled login page does not yet implement a password-reset callback.
3. Create **test-mode** Paystack keys. Set secrets in a server-side secret manager, never in JavaScript, ZIP, logs or git. Require provider webhook HTTPS to `/webhooks/v1/payments/paystack`, and test duplicate delivery and delayed messages. Never enable a plan with a real amount until business approval.
4. Run `app/backend/sql/001_operational.sql` with a migration role, and grant the runtime DB role only SELECT/INSERT/UPDATE on approved tables. Application user must not have schema OWNER, DROP, CREATE EXTENSION or superuser privileges. Deny public inbound TCP to the database.
5. At the root of `app/backend`, run `npm install` in a network-enabled development environment, **commit the reviewed package-lock.json**, then run `npm ci`, `npm audit --audit-level=high`, `npm test`, and `npm run check`. No lock file is bundled, because registry resolution failed here. Refuse deployment if vulnerabilities unresolved.
6. Fill a private `.env` using `.env.example`. In production set `NODE_ENV=production`, `PUBLIC_ORIGIN=https://yourdomain`, `ALLOWED_ORIGINS=https://yourdomain`, `TRUSTED_PROXY_CIDRS` to the real private proxy IP/CIDR(s), `DATABASE_URL`, `REDIS_URL`, and identity/payment provider keys. Do not commit `.env`.
7. Deploy Fastify behind **CDN/WAF -> load balancer -> reverse proxy/API gateway**; choose one product per responsibility to avoid duplicate billing and policy conflicts. API gateway should enforce request size, public quotas, version routes, IP reputation and authenticated policies; application independently checks object authorization.
8. Check routes `/health/live` and `/health/ready`; ensure `/api/v1/admin/*` and `/pages/admin/*` return 401 to anonymous users and 403 to nonadmins. Test two users cannot read/edit each other's projects.
9. Setup automated backups and restore drills, reconciliation schedule, durable outbox worker, alerts for missed webhooks, payment mismatches, queue backlog, 5xx errors, Redis failures and DB saturation. **Background reconciliation scheduler and durable worker remain to be implemented**.
10. Progressive deployment: run database expand migration, deploy canary 1-5% traffic, compare latency/errors, then increase; rollback application using the provider's release-history rollback or `kubectl rollout undo deployment/kagobuild-api` where Kubernetes is used. Never roll back destructive DB migrations blindly; use expand/contract patterns.

## Proposed non-contractual SLOs
- API availability target: 99.9% monthly; `p95` GET project latency <= 300 ms at an explicitly load-tested traffic mix.
- Payment event processing: eventually consistent, alert if pending > 5 minutes, reconcile over hours as provider constraints require. Do not promise synchronous settlement.
- Recovery objectives to validate with infrastructure: RPO <= 15 minutes, RTO <= 4 hours. Test these targets.
- Scale triggers: CPU > 65% sustained, p95 latency, in-flight requests, queue age, DB connection saturation, AI provider quota.

## Network trust
- CORS restricts **browser access**, not direct HTTP clients. Authorize every sensitive call regardless of origin.
- Never allow `trustProxy: true` indiscriminately on publicly reachable application nodes; explicitly trust only verified proxy networks.
- The sample Nginx configuration is not plug-and-play. Replace hostnames and TLS file paths; review forwarded headers and native LB settings.
