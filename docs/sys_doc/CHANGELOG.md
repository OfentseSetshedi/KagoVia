# Docs Changelog

## 2026-11-02: restructure

Consolidated three sources into one structure: the original `docs.zip` (8 files), the v3.1 package docs, and the v4 package docs. Only documentation was touched.

### Path map

| Old location | New location |
|--------------|--------------|
| `docs/01-product-requirements.md` | [01-product/01-product-requirements.md](01-product/01-product-requirements.md) |
| `docs/02-technical-requirements.md` | [02-architecture/02-technical-requirements.md](02-architecture/02-technical-requirements.md) |
| `docs/03-app-flow.md` | [01-product/02-app-flow.md](01-product/02-app-flow.md) |
| `docs/04-design-brief.md` | [01-product/03-design-brief.md](01-product/03-design-brief.md) |
| `docs/05-database-schema.md` | [02-architecture/04-database-schema.md](02-architecture/04-database-schema.md) |
| `docs/06-system-design.md` | [02-architecture/06-system-design-baseline.md](02-architecture/06-system-design-baseline.md) |
| `docs/07-implementation-plan.md` | [00-overview/03-implementation-plan.md](00-overview/03-implementation-plan.md) |
| `docs/08-scalability-1m-users.md` | [02-architecture/05-scalability.md](02-architecture/05-scalability.md) |
| `docs/README.md` | replaced by [README.md](README.md) |
| v4 `docs/KAGOBUILD_SYSTEM_DESIGN_V4.md` | [02-architecture/01-system-design-v4.md](02-architecture/01-system-design-v4.md) |
| v4 `docs/API_INVENTORY.md` | [02-architecture/03-api-inventory.md](02-architecture/03-api-inventory.md) |
| v4 `docs/PAYMENT_RELIABILITY_REFERENCE.md` (= v3.1 `PAYMENT_RELIABILITY.md`) | [04-payments/01-payment-reliability.md](04-payments/01-payment-reliability.md) |
| v4 `docs/WAREHOUSE_ETL_DESIGN.md` (= v3.1 `WAREHOUSE_DESIGN.md`) | [05-data-warehouse/01-warehouse-etl-design.md](05-data-warehouse/01-warehouse-etl-design.md) |
| v4 `security/SECURITY_AUDIT_2026-11-02.md` | [03-security/01-security-audit-2026-11-02.md](03-security/01-security-audit-2026-11-02.md) |
| v4 `infra/DEPLOYMENT.md`, `caching.md`, `observability.md` | [06-operations/](06-operations/) `01-deployment.md`, `02-caching.md`, `03-observability.md` |
| v4 `README.md` (run steps, source preservation) | [06-operations/04-local-development.md](06-operations/04-local-development.md); status and gaps in [00-overview/01-project-status.md](00-overview/01-project-status.md) |
| v4 `docs/PREVIOUS_SYSTEM_DESIGN_v3_1_reference.md` (= v3.1 `MASTER_SYSTEM_DESIGN_V3_1.md`) | [archive/system-design-v3-1-master.md](archive/system-design-v3-1-master.md) |
| v3.1 `docs/SYSTEM_ARCHITECTURE.md` | [archive/system-architecture-v2.md](archive/system-architecture-v2.md) |

### Content changes

- **Added:** README index, CHANGELOG, Project status, Decision register, Local development guide, Archive README.
- **Edited in place (nothing else changed in the bodies):** removed the old "01." to "08." prefixes from document titles; added a one-line status banner under each title; rewrote cross-references such as "doc 08" and "TRD §6" into relative links; changed decision cross-reference IDs.
- **Not carried over:** three duplicated files (v3.1 payment, warehouse and master copies, byte-identical to the v4 versions) and the v3.1 package README (superseded by the v4 README, which was reworked into the two pages above).
- **Not changed:** all requirements, tables, diagrams, numbers and decisions in the source documents.

### Known gaps

- `Material.sql`, `Supplier.sql` and `Pricing.sql`, referenced by the [Database schema](02-architecture/04-database-schema.md), were not among the supplied files.
- Baseline and v4 documents disagree in several places; see the [Decision register](00-overview/02-decision-register.md).
