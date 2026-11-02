# KagoBuild Documentation

AI house plans, material take-off and priced estimates for South Africa. This folder is the single home for product, architecture, security, payments, data and operations documentation.

**Current as of 2 November 2026.** Start with [Project status](00-overview/01-project-status.md), then the [Decision register](00-overview/02-decision-register.md): it lists what is built, what is only designed, and where older and newer documents disagree.

## Folder map (read in this order)

| Folder | Contents | Status |
|--------|----------|--------|
| [00-overview](00-overview/) | [Project status](00-overview/01-project-status.md) · [Decision register](00-overview/02-decision-register.md) · [Implementation plan](00-overview/03-implementation-plan.md) | Current / baseline |
| [01-product](01-product/) | [Product requirements](01-product/01-product-requirements.md) · [App flow](01-product/02-app-flow.md) · [Design brief](01-product/03-design-brief.md) | Baseline, still the reference |
| [02-architecture](02-architecture/) | [**System design v4**](02-architecture/01-system-design-v4.md) · [Technical requirements](02-architecture/02-technical-requirements.md) · [API inventory](02-architecture/03-api-inventory.md) · [Database schema](02-architecture/04-database-schema.md) · [Scalability](02-architecture/05-scalability.md) · [Baseline system design](02-architecture/06-system-design-baseline.md) | v4 is current; others partly superseded (see banners) |
| [03-security](03-security/) | [Security audit 2026-11-02](03-security/01-security-audit-2026-11-02.md) | Current |
| [04-payments](04-payments/) | [Payment reliability](04-payments/01-payment-reliability.md) | Current (design only) |
| [05-data-warehouse](05-data-warehouse/) | [Warehouse and ETL design](05-data-warehouse/01-warehouse-etl-design.md) | Current (synthetic-data demo) |
| [06-operations](06-operations/) | [Deployment](06-operations/01-deployment.md) · [Caching](06-operations/02-caching.md) · [Observability](06-operations/03-observability.md) · [Local development](06-operations/04-local-development.md) | Current reference |
| [archive](archive/) | v3.1 master design and v2 notes | Superseded |

## Where to start by role

| If you are... | Read |
|---------------|------|
| Product owner | [PRD](01-product/01-product-requirements.md) → [App flow](01-product/02-app-flow.md) → [Decision register](00-overview/02-decision-register.md) |
| Designer | [Design brief](01-product/03-design-brief.md) → [App flow](01-product/02-app-flow.md) |
| Backend engineer | [System design v4](02-architecture/01-system-design-v4.md) → [API inventory](02-architecture/03-api-inventory.md) → [Payments](04-payments/01-payment-reliability.md) → [TRD](02-architecture/02-technical-requirements.md) (AI pipeline, take-off, suppliers) |
| Frontend engineer | [App flow](01-product/02-app-flow.md) → [API inventory](02-architecture/03-api-inventory.md) → [Security audit](03-security/01-security-audit-2026-11-02.md) |
| DevOps / security | [Deployment](06-operations/01-deployment.md) → [Security audit](03-security/01-security-audit-2026-11-02.md) → [Caching](06-operations/02-caching.md) → [Observability](06-operations/03-observability.md) |
| Data / finance | [Warehouse design](05-data-warehouse/01-warehouse-etl-design.md) → [Payments](04-payments/01-payment-reliability.md) |

## Conventions

- **Status banners.** Every document opens with a one-line status (Current, Baseline, Superseded in part, Archived) and links to what replaces it.
- **Numbering.** Folders and files are numbered in reading order. Numbers are not stable IDs; link by path.
- **Code paths.** References such as `app/backend`, `warehouse/`, `security/` and `frontend/styles/` point to the website and v4 package folders, which sit **outside** this docs folder.
- **Honesty rule.** Targets and scale figures are hypotheses until load-tested; "designed" and "coded" are distinguished from "deployed" and "verified".
- **Changing a decision.** Update the [Decision register](00-overview/02-decision-register.md) and the [CHANGELOG](CHANGELOG.md).

## Previous layout

The original `docs/` held eight numbered files (01 to 08). The old-to-new path map is in the [CHANGELOG](CHANGELOG.md).
