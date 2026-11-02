# Local Development and Verification

Source: the v4 package README. Commands run from the **v4 package root** (the folder containing `app/`, `warehouse/` and `security/`), not from this docs folder. Nothing here has been re-run as part of the documentation restructure.

## Checks that need no external services

```bash
python security/static_audit.py
node --test app/backend/test/*.test.js
python -m unittest discover -s warehouse/tests -v
cd warehouse && python seed_demo.py && python etl.py --report
```

## Run the Fastify starter (after provisioning services)

1. Provision PostgreSQL, a Supabase Auth project with asymmetric JWKS signing keys, your own test-mode Paystack credentials, and Redis.
2. Run `app/backend/sql/001_operational.sql` with a migration role. Give the runtime account narrow privileges only ([Deployment](01-deployment.md), step 4).
3. `cd app/backend && cp .env.example .env`, edit the private file, never commit it. Use HTTPS origins in production and set `TRUSTED_PROXY_CIDRS` correctly.
4. In a network-enabled environment: `npm install`, review the audit output, commit the lockfile, then use `npm ci`. No lockfile ships in the package.
5. `npm run check && npm test && npm start`, then open `http://localhost:3000/pages/index.html` (local development only; production sits behind the trusted HTTPS reverse proxy).
6. Confirm `GET /health/ready` returns ready and `GET /api/v1/auth/me` denies anonymous visitors. Test two real users and an admin before deploying.

## Source preservation

The original upload was left untouched. The v4 package omits Git history (may contain secrets), the empty `.env`, developer screenshots and empty backend placeholders. No API keys were provided, so none were created. If any key was ever shared publicly, rotate it.
