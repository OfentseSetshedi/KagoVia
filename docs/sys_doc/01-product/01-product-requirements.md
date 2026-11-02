# Product Requirements Document (PRD)

> **Status:** Baseline v1.0 (8 Oct 2026). Product scope, personas, metrics and user stories remain the reference. Where this document names technologies (MongoDB, Express, Socket.io), the [v4 system design](../02-architecture/01-system-design-v4.md) takes precedence; see the [Decision register](../00-overview/02-decision-register.md).

**Product:** KagoBuild
**Version:** 1.0 (MVP scope)
**Date:** 8 October 2026
**Market at launch:** South Africa (ZAR, metric, SANS 10400)

## 1. Vision

Anyone planning to build or extend a home can describe what they want in plain language and receive, within a minute, a floor plan, a complete material list and a priced budget they can trust, before paying an architect or quantity surveyor.

**One-line positioning:** "Design and budget your home with AI."

## 2. Problem

| Pain | Who feels it | Today's workaround |
|------|--------------|--------------------|
| Plans cost R15,000 to R60,000 before the owner knows if the dream is affordable | First-time builders, homeowners | Guessing, rough per-m² rates |
| Quantity take-offs are manual and slow | Small builders, contractors | Spreadsheets, supplier counter quotes |
| Material prices move weekly and vary by region | Everyone | Phoning 3 to 5 suppliers |
| Budgets overrun because wastage, labour and VAT are forgotten | Homeowners | Surprise at the bank or site |

## 3. Target users (personas)

| Persona | Goal | Key need |
|---------|------|----------|
| **Thabo, first-time homeowner** (35, Gauteng) | Know if a 3-bed home fits R900k | Plain language, no jargon, a number he can show the bank |
| **Pieter, small builder** | Quote 5 jobs a week quickly | Editable quantities, supplier comparison, export to Excel/PDF |
| **Aisha, architect/draughtsperson** | Fast concept options for clients | Variations, constraint checks, exportable BOQ |
| **Admin (internal)** | Keep prices, rules, AI and suppliers healthy | Dashboards, price feed control, audit logs (already designed in `/pages/admin`) |

## 4. Product scope

### 4.1 User inputs (design brief)

| Input | Type | Validation | Notes |
|-------|------|------------|-------|
| Project name | text | 1 to 80 chars | |
| Project type | enum | New build, Extension, Renovation | Drives estimation rules |
| Location | province + town (+ optional pin) | must map to a supported region | Drives price, labour factor, zoning rules |
| Plot size and shape | m² (width x depth) | 100 to 5,000 m² | Optional: upload title deed or site sketch later |
| Target floor area | m² | 40 to 600 | |
| Storeys | 1 to 2 (MVP) | max 2 enforced by rules | 3 later |
| Bedrooms / bathrooms | int / 0.5 steps | 1 to 6 / 1 to 5 | |
| Style | enum | Modern, Cottage, Farmhouse, Double storey, Minimalist, Luxury | |
| Complexity level | Simple / Standard / Complex | | Affects roof, spans, finishes |
| Finish level | Basic / Standard / Premium | | Drives material choices and prices |
| Budget | ZAR | optional but recommended | Enables budget-health gauge |
| Special rooms / features | multi-select | garage (1 to 3 cars), pool, patio, study, solar | |
| Free-text brief | up to 500 chars | | "A spacious modern villa with 4 bedrooms…" |

### 4.2 AI capabilities

1. **Plan generation:** produce 3 layout options (A/B/C) from the brief, as structured geometry (rooms, walls, openings), not just a picture.
2. **Conversational refinement:** "move the kitchen next to the dining area", "make the garage fit 3 cars", "convert the study into a guest bedroom".
3. **Design variations:** "More options" regenerates alternatives while keeping hard constraints (plot, bedrooms, budget).
4. **Material list extraction:** derive quantities from the geometry using a deterministic take-off engine (see [TRD §6](../02-architecture/02-technical-requirements.md)). AI proposes specification choices; arithmetic is never left to the language model.
5. **Explanations:** plain-language reasons for each change and for each budget driver.

### 4.3 Supplier integration (summary; detail in [TRD §7](../02-architecture/02-technical-requirements.md))

* Tiered sourcing: live API where available, scheduled CSV/feeds, manual upload as a fallback.
* Canonical material catalogue mapped to supplier SKUs; every price carries a timestamp and region.
* Suppliers named in the current UI: Builders Warehouse, Cashbuild, BUCO, Mica Hardware, Build It, Pro Build, Chamberlains, CTM, plus regional/local suppliers.

### 4.4 Output deliverables

| Deliverable | MVP | Format |
|-------------|-----|--------|
| 2D floor plan (labelled rooms, dimensions) | Yes | On-screen SVG, PDF, PNG |
| Material list (by category, quantity, unit) | Yes | On-screen, CSV/Excel |
| Cost breakdown (materials, labour, fees, permits, transport, VAT) | Yes | On-screen donut/table, PDF |
| Total estimate with range and "prices as of" stamp | Yes | On-screen, PDF |
| Supplier price comparison per line | Yes | On-screen |
| Budget health, savings/overage, risk level | Yes | On-screen |
| Bill of Quantities (BOQ) | Pro | Excel/PDF |
| 3D view | Later | Web viewer |
| Request supplier quotes | Later (Business) | Email/API |

## 5. Business model

| Stream | Mechanism | Phase |
|--------|-----------|-------|
| **Freemium subscription** | Free: 2 AI plans/month, average prices. Paid: unlimited plans, live prices, exports, teams | MVP |
| **Supplier commission / lead fees** | % on purchases routed through KagoBuild or fee per qualified quote request | Phase 2 |
| **Supplier featured listings** | Sponsored placement in price comparison (always labelled) | Phase 3 |
| **Enterprise/API** | Estimate API for banks, developers, property platforms | Phase 3 |

**Rule:** KagoBuild never marks up estimates. Trust is the product; supplier order of ranking is by price unless labelled "Sponsored".

**Regional pricing:** each price row is stored per region; regions also carry a labour factor (e.g. Gauteng 1.00, Western Cape 1.08, KZN 0.95). Delivery distance adds transport cost per supplier branch.

### Open decisions (inconsistencies found in current files)

> Tracked centrally in the [Decision register](../00-overview/02-decision-register.md) (items B-01 to B-03).

| Item | Where | Needs |
|------|-------|-------|
| Plan prices differ: landing page Free/Pro R399/Business R999, in-app Premium page Free/Starter R299/Professional R699/Enterprise R1,499, admin Finance page Homeowner R149/Builder Pro R499 | `index.html`, `premium.html`, `admin/finance.html` | One pricing table (proposal below) |
| Brand/contact: footer and help page use "BuildWise" and `support@buildwise.co.za` | `help-support.html`, `settings.html`, `teams.html` | Replace with KagoBuild |
| Supplier names differ (BuildMart, Cape Roofing, SteelWorks vs Builders Warehouse, Cashbuild…) | admin vs user pages | Use real supplier list |

**Proposed single plan table (to confirm):** Free R0 (2 plans/month) · Starter R299 · Professional R699 · Business R1,499 (teams, quote requests). Annual billing = 2 months free (about 17% off; the UI currently says 20%, so pick one).

## 6. MVP vs later

| Priority | Feature |
|----------|---------|
| **Must (MVP)** | Auth, design brief wizard, 3 AI layouts with constraint validation, chat refinement, material take-off, price lookup from ≥3 suppliers in ≥2 regions, cost breakdown, budget gauge, save/export PDF + CSV, projects list, admin price/rules/AI-job screens, audit log |
| **Should (MVP+)** | Supplier comparison view, estimate versioning/history, teams (invite/roles), notifications, Excel BOQ |
| **Could (Phase 2)** | Site-photo/sketch upload, quote requests, order routing + commission, price alerts, mobile PWA polish |
| **Won't (yet)** | 3D rendering, AR walk-through, structural engineering stamps, municipal e-submission |

## 7. User stories and acceptance criteria

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| US-01 | As a homeowner I can enter my plot, size, bedrooms and budget in a guided form | Wizard saves progress; invalid values show inline messages; can finish in under 3 minutes |
| US-02 | As a user I receive 3 floor-plan options | First option visible in ≤45 s (p95); each has room names, dimensions and area totals; 100% pass hard rules |
| US-03 | As a user I can ask for changes in chat | Change applied to the selected option in ≤30 s (p95); rule violations are explained, not silently applied |
| US-04 | As a user I see every material needed | Take-off covers foundations, walls, roof, floors, ceilings, openings, plumbing, electrical, finishes; each line has qty, unit, wastage |
| US-05 | As a user I see current prices by region | Each line shows supplier, unit price excl. VAT and "as of" time; stale (>7 days) lines flagged |
| US-06 | As a user I see a total with a realistic range | Shows total, range (e.g. −8% / +12%), contingency, VAT 15%, breakdown by category |
| US-07 | As a user I know if I'm within budget | Gauge, savings/over-budget amount, risk level with reasons |
| US-08 | As a user I can edit quantities/materials and see cost update live | Updates in <300 ms client-side for ≤500 lines |
| US-09 | As a user I can export | PDF (plan + breakdown) and CSV/Excel generated in ≤10 s |
| US-10 | As a builder I can compare suppliers per line | Shows ≥2 prices where available; cheapest highlighted |
| US-11 | As a team admin I can invite members with roles | Invite email, role, permissions step (matches `teams.html` flow) |
| US-12 | As a platform admin I can pause AI, retry failed jobs, fix prices | All actions logged in audit log with actor, IP, result |
| US-13 | As a user my data is private | Projects visible only to owner/team; delete account removes data within 30 days |

## 8. Success metrics

| Metric | Target at 3 months | Target at 12 months |
|--------|--------------------|---------------------|
| Time from signup to first priced estimate | median < 5 min | < 4 min |
| Brief → plan success rate (no error) | ≥ 97% | ≥ 99% |
| Plans passing all hard rules without manual fix | ≥ 99% | ≥ 99.5% |
| **Estimate accuracy:** materials cost within ±10% of a QS/supplier quote on benchmark projects | ≥ 70% of projects | ≥ 85% |
| Prices fresher than 7 days | ≥ 90% of lines | ≥ 97% |
| Free → paid conversion | 3% | 5% |
| Day-30 retention (users with ≥1 saved project) | 25% | 35% |
| NPS | ≥ 30 | ≥ 45 |
| p95 estimate recalculation (after quantity edit) | < 1 s server-side | < 600 ms |

## 9. Key challenges and how the product handles them

| Challenge | Approach |
|-----------|----------|
| **Building codes and structure** | Rules engine (SANS 10400, municipal bylaws) validates every generated layout; AI proposes, rules decide. Locked rules need Super Admin approval to change. Every plan carries "concept design, not for construction; consult a registered professional" |
| **Material availability** | Availability per supplier/region; unavailable items substituted by equivalent canonical material or flagged |
| **Accuracy validation** | Benchmark set of 50+ real completed projects (plans + final invoices). Run nightly regression: estimate vs actual. Publish internal accuracy dashboard. Add calibration factors per category |
| **Non-architects** | Plain-language options, visual choices, defaults, "why" explanations, no jargon on primary screens (see Design Brief) |
| **Scalability** | Different styles/regions/materials are data (templates, rules, catalogue), not code; see [Scalability](../02-architecture/05-scalability.md) |
| **Price trust** | Show "as of" times, source, confidence band; never show a price without timestamp |

## 10. Out of scope and legal

* KagoBuild does not produce engineer-certified drawings or submit to municipalities.
* Estimates are planning budgets, not quotations or contracts.
* POPIA (South Africa) compliance for personal data; cookie/consent banner; privacy policy and terms before launch.
