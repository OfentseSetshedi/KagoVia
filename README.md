# KagoVia

**Design and budget your home with AI.**

KagoBuild helps anyone planning to build or extend a home describe what they want in plain language and get, within about a minute, a floor plan, a complete material list and a priced budget they can trust, before paying an architect or quantity surveyor.

Built for South Africa at launch: prices in ZAR, metric units, and layouts checked against SANS 10400.

> **Status:** early development. The frontend UI is built with demo data. The backend is scaffolded and the API is being implemented. See [Project status](#project-status).

---

## The problem

- Plans can cost R15,000 to R60,000 before an owner knows whether the dream is affordable.
- Quantity take-offs are manual and slow.
- Material prices move weekly and vary by region.
- Budgets overrun because wastage, labour and VAT get forgotten.

## What KagoBuild does

1. **Describe your home.** A guided 3-step wizard captures plot size, floor area, bedrooms, style, finish level, location and budget.
2. **Get 3 floor-plan options.** The AI proposes layouts as structured geometry (rooms, walls, openings), not just a picture.
3. **Refine by chatting.** Ask for changes like "move the kitchen next to the dining area" or "make the garage fit 3 cars".
4. **See every material needed.** A deterministic take-off engine calculates quantities from the plan. The AI never does the arithmetic.
5. **See real prices by region.** Each line shows supplier, unit price and a "prices as of" time.
6. **Know if you are on budget.** Totals with a realistic range, contingency, 15% VAT, a budget-health gauge and risk level.
7. **Export and share.** PDF and CSV for everyone, Excel BOQ on paid plans.

### Core principle

**The AI proposes; deterministic code verifies.** The language model suggests a layout. Code then solves the geometry, checks building rules, draws the plan and counts the materials. This keeps plans valid, quantities reproducible and estimates auditable.

## Who it is for

| User | Need |
|------|------|
| First-time homeowners | Plain language and a number they can show the bank |
| Small builders | Fast quotes, editable quantities, supplier comparison |
| Architects and draughtspeople | Quick concept options with rule checks |
| Platform admins | Control over prices, rules, AI jobs and suppliers |

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Static multi-page HTML, CSS and JavaScript |
| API | Node.js with Express |
| Documents database | MongoDB (users, projects, floor plans, jobs) |
| Relational database | PostgreSQL (materials, suppliers, prices, estimates) |
| Cache and queues | Redis, BullMQ |
| Realtime | Socket.io |
| AI | Provider-agnostic LLM wrapper with structured output |
| Storage | S3-compatible object storage and CDN |

## Documentation

- [01 Product Requirements](docs/01-product-requirements.md)
- [02 Technical Requirements](docs/02-technical-requirements.md)
- [03 App Flow](docs/03-app-flow.md)
- [04 Design Brief](docs/04-design-brief.md)
- [05 Database Schema](docs/05-database-schema.md)
- [06 System Design](docs/06-system-design.md)
- [07 Implementation Plan](docs/07-implementation-plan.md)
- [08 Scalability for 1M Users](docs/08-scalability-1m-users.md)

## Project structure

```
ai-home-planner/
├── frontend/
│   ├── pages/        # HTML pages (landing, dashboard, planner, estimator, admin...)
│   ├── components/   # Reusable UI blocks
│   ├── styles/       # Global styles, CSS variables, animations
│   ├── scripts/      # Client logic (planner, floorplan viewer, sockets, auth, api)
│   ├── assets/       # Images, icons, floor plans, material previews
│   └── utils/        # validators, formatters, calculations
├── backend/
│   ├── routes/       # API endpoints
│   ├── controllers/  # Request handlers
│   ├── services/     # AI, pricing, estimator, supplier logic
│   ├── middleware/   # Auth, validation, errors, uploads
│   ├── sockets/      # Realtime job progress
│   ├── models/
│   │   └── sql/      # Material.sql, Supplier.sql, Pricing.sql
│   └── config/       # Environment, database, socket setup
└── docs/             # Full documentation set
```

## Documentation

| # | Document | Purpose |
|---|----------|---------|
| 01 | [Product Requirements](docs/01-product-requirements.md) | What we build, for whom, MVP scope, success metrics |
| 02 | [Technical Requirements](docs/02-technical-requirements.md) | Stack, APIs, AI contracts, take-off engine |
| 03 | [App Flow](docs/03-app-flow.md) | User journeys, screen map, system flows |
| 04 | [Design Brief](docs/04-design-brief.md) | Principles, design tokens, components, UX |
| 05 | [Database Schema](docs/05-database-schema.md) | MongoDB and PostgreSQL data model |
| 06 | [System Design](docs/06-system-design.md) | Architecture, data flow, failure modes, security |
| 07 | [Implementation Plan](docs/07-implementation-plan.md) | Phases, sprints, team, risks |
| 08 | [Scalability](docs/08-scalability-1m-users.md) | Capacity planning for 1,000,000 users |

## Getting started

### Prerequisites

- Node.js 18 or newer
- PostgreSQL 14 or newer
- MongoDB 6 or newer
- Redis 7 or newer

### Install

```bash
git clone https://github.com/tapel03/ai-home-planner.git
cd ai-home-planner
```

### Set up the SQL database

Run the files in this order:

```bash
psql -d kagobuild -f backend/models/sql/Material.sql
psql -d kagobuild -f backend/models/sql/Supplier.sql
psql -d kagobuild -f backend/models/sql/Pricing.sql
```

### Configure environment variables

Create a `.env` file in the project root. **Never commit it.** It must be listed in `.gitignore`.

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/kagobuild
DATABASE_URL=postgresql://user:password@localhost:5432/kagobuild
REDIS_URL=redis://localhost:6379

JWT_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too

AI_PROVIDER_API_KEY=your-key-here
```

### Run the frontend

The frontend is static. Open `frontend/pages/index.html` in a browser, or serve it locally:

```bash
npx serve frontend
```

### Run the backend

```bash
cd backend
npm install
npm run dev
```

## Project status

| Area | Status |
|------|--------|
| Frontend pages | Built with demo data (landing, auth, dashboard, projects, AI design, materials, estimator, reports, suppliers, teams, settings, admin) |
| Frontend scripts | UI shell done; API, auth and planner wiring in progress |
| Backend | Scaffolded; endpoints in progress |
| SQL schema | Complete |
| Documentation | Complete |
| AI integration | Planned |

See the [Implementation Plan](docs/07-implementation-plan.md) for the full roadmap.

## Roadmap

- **MVP:** auth, design wizard, 3 AI layouts with rule validation, chat refinement, material take-off, regional prices from 3 or more suppliers, cost breakdown, budget gauge, PDF and CSV export.
- **Next:** supplier comparison, estimate history, teams, notifications, Excel BOQ.
- **Later:** site-photo upload, quote requests, price alerts, 3D view, more regions and countries.

## Important disclaimer

KagoBuild produces **concept designs and planning estimates only**. They are not engineer-certified drawings, quotations or contracts. Always verify dimensions and consult registered professionals before building.

## Contributing

1. Fork the repo and create a feature branch.
2. Keep to the design tokens in `frontend/styles/variables.css`. Do not add new hex colours.
3. Escape all dynamic HTML and never store secrets in `localStorage`.
4. Open a pull request with a clear description.

## License

Add your license here (for example MIT), or state that the project is proprietary.

## Contact

Maintained by [@tapel03](https://github.com/tapel03).
