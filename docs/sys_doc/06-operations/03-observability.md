# Observability and operations

Logs: structured JSON with request ID, trace ID, route template, HTTP status, latency, deployment version, anonymous account hash and machine state transitions. Never log raw passwords, bearer tokens, secrets, cookies, personal building addresses, card details or unredacted AI prompts.

Metrics: `http_requests_total`, `http_request_duration_seconds` by route family/status, DB connections, query p95, Redis hit ratio, rate-limit rejections, queue oldest job age, AI requests/cost per feature, provider errors, webhook verification failures, duplicate events, pending payment age, warehouse ETL lag, refund/chargeback exception counts, failed login rate.

Tracing: propagate W3C trace context through API, queue, workers and storage. Keep payment IDs as opaque references; sample regular traces but retain audit-critical events with protected access.

Alerts: 5xx > 2% for 5 minutes, checkout failures, unexpected 401/403 spikes, provider mismatch, ETL watermark stuck, high DB connection utilisation, worker backlog, failing backups and high spending.

Security/audit logs are append-only, access-controlled, retained according to legal and organisational policy, and distinct from application logs.
