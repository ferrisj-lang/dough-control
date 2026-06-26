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

## Decisions log
- D+A+A confirmed by client. Mockups: `docs/design-directions.html`.
