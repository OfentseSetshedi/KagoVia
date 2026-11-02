# Design Brief

> **Status:** Baseline (Oct 2026), current. Tokens are sourced from `frontend/styles/variables.css` in the website folder.

## 1. Design goals

1. **Make a complicated decision feel easy.** The user should never need to know what a "truss" or "strip footing" is to get a good result.
2. **Earn trust with numbers.** Every price shows its source and age; every estimate shows a range.
3. **Calm, professional, construction-grade.** Soft-white surfaces, charcoal text, one brand red; no decoration that doesn't carry meaning.
4. **Mobile-capable.** Many South African users are mobile-first; the sidebar becomes an icon rail on phones (already in `mobile.css`).

## 2. Personality and tone

| Attribute | Expression |
|-----------|------------|
| Clear | Plain words: "Walls", "Roof", "Foundation" with a one-line "What is this?" tooltip |
| Honest | "Estimate, not a quotation", "Prices as of 8 Oct 09:40" |
| Helpful | Suggestions as chips ("Move the kitchen", "Reduce cost") |
| Respectful of money | ZAR formatting `R 1,234,567`, no hidden fees |

## 3. Design tokens (source of truth: `frontend/styles/variables.css`)

| Token group | Values |
|-------------|--------|
| Surfaces | bg `#F4F3F4`, card `#FFFFFF`, surface `#EAE9EB` |
| Text | primary `#171615`, secondary `#5F5C5C`, tertiary `#8C8788` |
| Brand | primary red `#F12823`, strong `#D11F1A`, soft `#FCE9E8` |
| Status | success `#1E9E4D`, warning `#C9770C`, danger `#D63A3A` (status only, never decoration) |
| Charts | `--chart-1…7` in order of use |
| Type | Arial/Helvetica stack in-app; Instrument Serif + Inter on the marketing page |
| Radius / shadow | 8 to 14 px radii; `--shadow-card`, `--shadow-pop` |

Rules: never add new hex values; use tokens. Red = primary action or active state; green/amber/red are reserved for status. Dark theme tokens exist in `admin-extra.css`; extend to the user app in Phase 2.

## 4. Layout system

* Shell: dark sidebar (collapsible, resizable) + header (search, notifications, profile) + scrolling main card. Do not change; all pages share `dash.css`.
* Content widths: cards in 12-column logic; no horizontal scroll at any width (see `Supplier-Marketplace.css`, `materials.css` approach: flexible tracks plus ellipsis).
* Breakpoints: ≤ 900 px icon rail and stacked layouts; ≤ 480 px single column.

## 5. Key screens: what each must achieve

| Screen | Primary goal | Design notes |
|--------|--------------|--------------|
| Landing | Convert to signup in one scroll | Hero claim + animated budget dial; proof stats; 3 sample homes with "Est. materials from R…" |
| Wizard (New Project) | Capture the brief with minimum effort | 3 steps; defaults pre-selected; budget presets; progress label "Step 1 of 3" |
| AI Design | Show options, invite refinement | Large plan canvas; A/B/C thumbnails; chat with suggestion cards; style chips; 2D/3D toggle |
| Estimator | Make the money legible | Total first, delta vs last, breakdown table, gauge, risk. Tabs for deeper views |
| Materials/Suppliers | Compare and choose | Stock status chips; price per unit; delivery times |
| Reports | Export confidently | List/grid; type pill (PDF/Excel); preview before download |
| Admin | Operate safely | KPI cards, filter+search tables, destructive actions confirm, audit everything |

## 6. UX for non-architects

| Problem | Solution |
|---------|----------|
| Jargon | Glossary tooltips; labels by outcome ("Strong roof for heavy rain") rather than spec names |
| Too many options | Max 3 plan options, 5 style chips, 3 finish levels |
| Fear of cost | Always show running total while editing; "Reduce cost" suggestions with R-saving estimates |
| Not knowing sizes | Show room sizes with familiar comparisons ("fits a double bed and wardrobe") |
| Trust in AI | "Why this layout?" button; rules checked list ("Min bedroom size ✓, Plot coverage ✓") |
| Mistakes | Version history and one-click revert; never destructive without undo or confirm |

## 7. Component inventory (already in the codebase, reuse)

KPI card, filter bar, table with pills, tabs, modal wizard, popover menus, toast, switch, progress bar, donut chart, gauge, bar chart, chat bubble + suggestion card, supplier card, status pills.
**To add:** price-age badge, confidence range bar, rules-checklist panel, version timeline, quantity stepper with unit, empty-state illustrations.

## 8. Accessibility

* Contrast ≥ 4.5:1 (check `--color-text-tertiary` on `--color-bg`; may fail for small text, so use secondary for body copy).
* All icon-only buttons have `aria-label` (existing pattern); dialogs trap focus and restore it; `Esc` closes.
* Never rely on colour alone: status pills always include text.
* Respect `prefers-reduced-motion` (already present).
* Floor plans: provide a text summary of rooms and sizes for screen readers.

## 9. Content and microcopy rules

* Currency: `R 1,234.00` (en-ZA); metric units; dates `08 Oct 2026`.
* Disclaimers short and placed where decisions are made: "AI-generated concept. Verify dimensions and consult professionals before building."
* Errors say what happened and what to do: "Prices from Cashbuild are 6 hours old. You can continue; totals may change slightly."

## 10. Deliverables expected from design

1. Figma library mirroring tokens and components above.
2. High-fidelity flows: wizard, AI design (empty/loading/result/error), estimator (4 tabs), export.
3. Mobile layouts for AI Design and Estimator (priority, as they are most used on phones).
4. Illustration set for empty states; sample plan thumbnails.
5. Usability test script (5 non-architects, 5 builders) before MVP launch.
