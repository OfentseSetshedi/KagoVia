# 03. App Flow

## 1. Triggers: why users arrive

| Trigger | Entry point |
|---------|-------------|
| "How much will my house cost?" search/ad | Landing page → Get Started |
| Bank or family asks for a budget | Shared estimate link |
| Builder needs a fast quote | Direct login → New Project |
| Price-change email alert | Notification → Estimate |
| Team invite | Invite email → Sign up → Project |

## 2. Primary journey

```
Landing (index.html)
   └─ Get Started → Sign up (signin.html#signup) → verify email → Dashboard
Dashboard (dashboard.html)
   └─ + New Project  (projects.html wizard)
        Step 1 Create: name, type, location, area, description
        Step 2 Configure: style, floors, bedrooms, budget range, currency, optional reference upload
        Step 3 Review → Create Project
   └─ Open AI Design (ai-design.html)
        Brief confirmed → Generate (job queued)
        Progress: "Understanding brief → Laying out rooms → Checking rules → Drawing"
        Result: Option A / B / C tabs, 2D plan, stats (beds, baths, m²)
        Chat refine: suggestions + free text → new version
        Choose option → "Save"
   └─ Cost Estimator (estimator.html)
        Auto-estimate: materials (take-off) + labour + fees + permits + transport + VAT
        Tabs: Estimate · Breakdown · Comparison · History
        Edit: quantities, add/remove material, change supplier, edit budget
        Budget health gauge · Savings/Over budget · Risk analysis
   └─ Materials / Suppliers (materials.html, Supplier.html)
        Compare suppliers, view stock/delivery
   └─ Reports (reports.html) → BOQ, Budget, Supplier, Labour, Timeline, Cash flow
        Preview · Download (PDF/Excel) · Share link · Print
   └─ Teams (teams.html) → invite members
```

## 3. Step-by-step detail

| # | Step | User sees | System does | Failure handling |
|---|------|-----------|-------------|------------------|
| 1 | Sign up / log in | Card flow (signup, login, forgot, verify, set password) | Create user, send verification code, issue tokens | Wrong code limit (5), lock + email |
| 2 | Create project | 3-step wizard | Validate region support; create `project` doc | Unsupported region → waitlist message |
| 3 | Generate | Typing indicator, progress steps | Enqueue `generate-plan` job; Socket.io `job:progress` events | Timeout → retry once; then "Try again" with saved brief |
| 4 | Review options | 3 option tabs, 2D/3D toggle (3D "coming soon"), zoom, fullscreen | Return 3 validated `PlanSpec` + SVG | If <3 pass rules, show what passed and explain |
| 5 | Refine | Suggestion chips and free text | `plans/:id/refine` → new immutable version | Rule violation → AI explains and offers nearest valid alternative |
| 6 | Material extraction | "Calculating materials…" | `extract-materials` job runs take-off | Missing geometry → error + support link |
| 7 | Price lookup | Costs appear with "prices as of" | `calculate-cost` joins `current_prices` by region; flags stale | Missing price → substitute or mark "Estimate: average" |
| 8 | Estimate | Totals, breakdown, gauge, risk | Persist `estimates` + `estimate_lines`; push live updates | |
| 9 | Adjust | Edit quantities, swap supplier | Recompute in client, confirm on server | Conflict → server value wins with toast |
| 10 | Export/share | PDF, CSV, Excel, link | Render in worker, store in object storage, signed URL | Retry; email link if >10 s |
| 11 | Return | Alerts on price change | Nightly job compares prices vs saved estimate | |

## 4. Screen map

| Group | Screens |
|-------|---------|
| Public | Landing, Sign up/Log in, Forgot, Verify, Set password |
| App | Dashboard, Projects (+ wizard, detail, checklist), AI Design, Materials, Cost Estimator, Reports, Suppliers, Teams, Notifications, Settings, Help & Support, Premium plans |
| Admin | Dashboard, Users, House plans, Projects & estimates, AI management, AI jobs, Materials, Suppliers, Pricing, Locations, Building rules, Finance, Analytics, Notifications, Content, Roles, Audit logs, System, My settings |

## 5. Generation sequence

```
Browser            API            Queue/Worker         LLM        Rules/Solver     DBs
  │ POST /generate  │                 │                 │              │            │
  │────────────────►│ validate+quota  │                 │              │            │
  │                 │ enqueue job ───►│                 │              │            │
  │◄── 202 jobId ───│                 │ normalise brief │              │            │
  │  (WebSocket)    │                 │───────────────► │ PlanSpec     │            │
  │◄─ progress 25% ─│◄────────────────│◄─────────────── │              │            │
  │                 │                 │ solve + validate ───────────► │            │
  │◄─ progress 60% ─│                 │ ◄───── violations? repair loop (max 2)       │
  │                 │                 │ render SVG, save plans ──────────────────► │
  │◄─ done + plans ─│◄────────────────│                                             │
```

## 6. Estimate recalculation flow

User edits quantity → client recomputes line and totals (same formulas as server) → debounced `PATCH /estimates/:id/lines/:lineId` → server recomputes with decimal math, increments `version` only on explicit Save → pushes `estimate:updated` to other open sessions.

## 7. Empty, error and edge states

| State | Behaviour |
|-------|-----------|
| First-time user | Dashboard shows sample project and "Start your first plan" |
| No plans left (Free) | Soft paywall with plan comparison; existing plans stay editable |
| Supplier feed down | Banner "Prices from Cashbuild are 6 h old"; still usable |
| Region without suppliers | Use national average, label "Average price", lower confidence |
| Offline | Edits queued locally; read-only exports available |
| AI paused by admin | Friendly message and ETA; queue persists |
