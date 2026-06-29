# DOUGH CONTROL — Sprint 3 Design Brief (UI redesign)

## Context
The wizard UX is signed off (6 pages, bilingual, levels, schedule, recipe). This sprint is a **visual rebrand** of that UI — the flows and the calculation engine do **not** change. Per client discovery:

- **Direction:** **D — Fresh rebrand** (new palette + typography from scratch).
- **Theme:** **Light + dark** with a header toggle.
- **Process:** **Mockups first** → pick/merge a direction → build it into the live app.

## Hard constraints (non-aesthetic — these stay)
- No CSS framework; styling stays inline `<style>` in the component (artifact ↔ prod parity, zero logic diff — CLAUDE.md §2/§4).
- The component stays a single self-contained file; only tokens/markup/styling change, never the engine or wizard logic.
- Bilingual FR/EN, units (°C/g · °F/oz), print stylesheet, and `prefers-reduced-motion` support must survive the reskin.
- Bible §4 (current tokens/fonts) is **explicitly reopened** for this sprint (was "locked"). The new system replaces it once a direction is chosen.

## Goals
1. A distinctive, premium identity that fits a precision tool that's also warm/food-driven.
2. Clear hierarchy: numbers (grams, temps, times) are the hero data — must read instantly.
3. Works one-handed on a phone in a kitchen **and** comfortably on desktop.
4. Light + dark parity.

## Open client inputs (nice to have, not blocking)
- Reference apps/sites you like · any logo/wordmark/brand fonts · must-keep elements (ticket? ember/gold? backwards timeline?) · primary device.

## Three proposed directions (see `docs/design-directions.html`)
1. **Forno — warm modern artisan.** Cream/terracotta/charcoal, a characterful serif display (Fraunces) over a clean sans. Premium bakery feel; evolves today's warmth.
2. **Tipo — editorial instrument.** High-contrast near-black + a single vivid tomato accent, grotesk display (Space Grotesk), tabular mono numbers, hairline grid, sharp corners. Reads as a precision instrument.
3. **Lievito — soft minimal.** Airy off-white, rounded geometric sans (Nunito), muted ember + sage, large radii, gentle shadows, pill-forward. Friendly consumer-app feel.

Each ships light + dark and restyles the same representative surfaces: a wizard input screen (dough tiers, hydration slider, ferment method cards) and the recipe output (ticket, timeline, oven card).

## Evaluation criteria
Legibility of numeric data · personality/memorability · light+dark quality · how well it scales to all 6 wizard pages · feasibility within the inline-CSS / no-framework constraint.

## Next steps
1. Client reviews mockups → picks one direction (or a merge: e.g. "Forno palette + Tipo number treatment").
2. Lock the new token set + type scale here in this brief.
3. Implement in `src/dough-control.jsx` (tokens + component restyle), keeping engine/logic untouched; re-run validate + build + SSR smoke.
4. R8 technique-visual polish folds into the chosen system.

## LOCKED — Layer 1 project brief: "Napoli" (references Baseline v1.0)

**Personality:** confident, warm, modern Neapolitan pizzeria — poster-bold brand moments over a calm, legible, data-first interface. Inspired by client reference visuals (Pizza Margherita Napoli poster, Holy Napoli packaging, ASAP/Buba's pizzeria graphics): cream grounds, tomato-red headlines, tricolore + red/cream checkerboard devices.

### Documented exceptions to Baseline v1.0 (client-approved)
- **Light-only** (exception to §6.4 dark-mode-first). Rationale: client directive; kitchen/daylight use; reduced maintenance. Architecture stays token-based so a dark map can be added later without touching components.
- **Hero typography** (uses the §5.1 / §5.3 "hero/marketing" allowance): a heavy condensed CAPS display face is permitted **only** for the logo, page/hero titles and the recipe-ticket title. All other UI text obeys the baseline (sentence case, weights 400/500/600, caps only for ≤11px micro-labels).
- **Decorative color** (per §6.2 allowance): tricolore (green/white/red) hairline + red/cream checkerboard, **scoped** to: app header/footer strip, recipe-ticket header, and the selected fermentation-method card. Nowhere else.

### Color tokens (light)
| Role | Token | Hex |
|---|---|---|
| Canvas (neutral) | `--bg` | `#F7EEDD` (warm cream) |
| Card surface | `--surface` | `#FFFFFF` |
| Inset surface | `--surface-2` | `#F3EAD8` |
| Text primary (neutral) | `--ink` | `#2B1A12` |
| Text secondary | `--dim` | `#6B5848` |
| Text faint / micro | `--faint` | `#9A8772` |
| Border | `--line` | `#E7D9C2` |
| **Accent** (brand/interactive, 1 per view) | `--accent` | `#CC2A1E` (tomato) |
| Accent pressed | `--accent-deep` | `#A81F16` |
| Success | `--ok` | `#2F8F4E` (basil) |
| Warning | `--warn` | `#B57A12` (amber) |
| Danger (distinct from accent) | `--danger` | `#8E1B12` (brick) |

### Typography
- **Display/hero/logo:** `Anton` (condensed, heavy, caps) — logo, hero titles, recipe-ticket title. Tracking ~0.5px.
- **UI/body:** `Inter` — 400 body (15–16px, lh 1.6), 500 labels, 600 headings; sentence case.
- **Data/numbers:** `JetBrains Mono` tabular — grams, temps, times (the precision register). Key/active value may take `--accent`; rest are `--ink`.
- Micro-labels: 11px, 500, uppercase, tracking +0.04em (baseline-allowed).

### Surfaces / shape / motion
- Radius: 8px controls, 12px cards (baseline default). Pills 999px only for chips.
- Elevation: L0 canvas (no shadow), L1 cards (`0 2px 8px rgba(60,30,10,.06)` + 1px `--line`), L2 floating (`0 8px 22px rgba(60,30,10,.14)` + border). Flat fills, no gradients.
- States (all five): hover = one tonal step on border/bg; **focus-visible = 2px `--accent` ring, 2px offset**; active = `--accent-deep`; disabled = 40% + not-allowed.
- Motion 150/250/350ms, ease-out/in; respects `prefers-reduced-motion`.

### Scoped brand devices
- **Checkerboard** red/cream strip: app header underline + recipe-ticket header + selected ferment card foot.
- **Tricolore** hairline (green·white·red) as a signature divider on the ticket footer ("impasto napoletano") — used once per surface, max.

## Decisions log
- D+A+A confirmed; then refined to **Napoli** direction: light-only, Anton hero caps, cream/tomato/tricolore/checkerboard.
- Exploration mockup: `docs/design-directions.html`. Locked-direction mockup: `docs/design-napoli.html`.
