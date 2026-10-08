# KagoBuild Documentation Set

| # | Document | Purpose |
|---|----------|---------|
| 01 | [Product Requirements](01-product-requirements.md) | What we build, for whom, MVP vs later, success metrics |
| 02 | [Technical Requirements](02-technical-requirements.md) | Functional/non-functional requirements, stack, APIs, AI contracts |
| 03 | [App Flow](03-app-flow.md) | User journeys, screen map, system flows |
| 04 | [Design Brief](04-design-brief.md) | Principles, tokens, components, UX for non-architects |
| 05 | [Database Schema](05-database-schema.md) | Mongo + Postgres data model, refresh rules (SQL in `backend/models/sql/`) |
| 06 | [System Design](06-system-design.md) | Architecture, data flow, failure modes, security |
| 07 | [Implementation Plan](07-implementation-plan.md) | Phases, sprints, team, risks, definition of done |
| 08 | [Scalability for 1M Users](08-scalability-1m-users.md) | Capacity math and why the design holds at 1,000,000 users |

Run order for SQL: `Material.sql` → `Supplier.sql` → `Pricing.sql`.
