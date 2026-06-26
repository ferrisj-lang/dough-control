# DOUGH CONTROL — Project Bible & Sprint 2 Roadmap

> **Purpose.** This is the single source of truth for the *Dough Control* Neapolitan pizza dough builder. It records everything built in Sprint 1, *why* each decision was made, every bug discovered and how it was resolved, the full calculation engine, and the complete roadmap for **Sprint 2 (handoff to Claude Fable 5)**. If you are picking this up cold: read sections 1–4 to understand the product, 5–8 for the engine and data, 9–11 for history and validation, and 12–17 for what to build next.

**Artifact:** single-file React component — `dough-control.jsx`
**Target user:** home pizza aficionado, home use, almost always an **Ooni** or **Gozney** outdoor oven, wants perfect ingredient ratios and fermentation timing, **works backwards from a scheduled bake time.**
**Status:** see §18 (Sprint 2 log) at the end of this file.

---

## 1. Product vision

A guided tool that takes a home cook from *"I want to eat pizza on Saturday at 8pm"* to a gram-perfect recipe, a backwards-timed step-by-step plan, oven-specific baking guidance, and a troubleshooter — tuned specifically for **Neapolitan** pizza in **Ooni/Gozney-class ovens**.

It is **not** a generic baker's-percentage calculator. The opinionated defaults, the benchmarks, and the oven database are the product. The aficionado wants *the right answer*, then the ability to fine-tune.

Core loop: **Schedule → Oven → Kitchen → Ingredients → Recipe.**

---

## 2. Current state (end of Sprint 1)

A 5-step linear wizard (steps are also jumpable via a numbered stepper):

1. **Schedule & Method** — pick bake date/time; choose 6 H / 24 H / 48 H Biga; one-tap "pizzaiolo benchmark" preloads pro-tuned values per method.
2. **Oven** — pick oven (real Ooni/Gozney models); shows heat, preheat, bake time, usage tip, and **max pizza diameter**. User sets target diameter (capped at oven max) + crust style → **ball weight is computed** (area × crust density). Set number of pizzas.
3. **Kitchen** — season preset, ambient temperature, humidity, flour storage temperature, fridge temperature, mixing method (each with a tip + friction factor).
4. **Ingredients** — yeast type (fresh / active dry / instant, with conversions + tips) and flour type (00 pizzeria / strong 00 / bread / AP, each with protein, ideal ferment window, named benchmark, and warnings). **Expert toggle** exposes fermentation strategy (cold maturation vs bulk-then-hold), the budget-constrained time sliders, and biga settings. Hydration / salt / FDT sliders currently live here.
5. **Recipe** — cream "ticket" with quantities (+ biga split when relevant), a backwards-timed timeline anchored to real clock times, an oven-specific baking card, and a filterable troubleshooter.

---

## 3. Architecture & tech stack

- **Single-file React functional component** (`export default function DoughControl()`), hooks only (`useState`, `useMemo`, `useEffect`).
- **Styling:** one injected `<style>` block of CSS variables + utility classes, combined with inline styles. No CSS framework dependency.
- **No browser storage assumed** in the component itself. All state is in-memory React state; persistence goes through the `window.storage` abstraction.
- **No external libraries** imported by the component. Everything is hand-rolled (sliders, toggles, stepper, ticket).
- **Pure-function engine** at module top (see §5) — all dough math is side-effect-free and validated by `scripts/validate-engine.mjs`.

**Environment contract (critical):** the SAME `dough-control.jsx` must run both as a Claude artifact and in production.
- Artifact sandbox: ❌ localStorage/sessionStorage · ✅ `window.storage` KV API · ❌ server/email/secrets · ❌ HTML `<form>` tags.
- Production: `window.storage` is recreated by `src/storage-shim.js` (localStorage-backed). Any prod-specific capability must live in a shim, never in the component.

---

## 4. Design system

Keep this consistent — the look is part of the product.

**Color tokens (CSS variables):**
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#141110` | charred page background |
| `--surface` | `#1E1916` | cards |
| `--surface2` | `#262019` | inset controls |
| `--line` | `#383028` | borders |
| `--flour` | `#EFE7D8` | primary text |
| `--dim` | `#A89B89` | secondary text |
| `--faint` | `#6E6354` | tertiary / notes |
| `--ember` | `#FF6B2C` | primary accent (active, CTAs) |
| `--gold` | `#E8B44A` | values, highlights, ★ preferred |
| `--basil` | `#8FB573` | "fix forever" / positive |
| `--warn` | `#E0563C` | warnings |

**Type:**
- Display: **Big Shoulders Display** (700–800) — headings, the big numbers.
- Body: **Albert Sans** (400–700).
- Data/mono: **JetBrains Mono** — all numbers, times, weights (tabular figures).

**Signature components:** the cream **"ticket"** (receipt) for the recipe output; the **stepper** (numbered dots, done = basil check); **chips** (pill selectors); **sliders** (ember thumb); **toggles**; the **timeline** (ember dots on a vertical line). Reduced-motion respected.

---

## 5. The calculation engine (formulas & constants)

> All doses are computed internally in **Instant Dry Yeast (IDY) %** of flour, then converted to the chosen yeast type. This is the spine of the whole tool — change with care and re-validate against §11 (`npm run validate`).

### 5.1 Base direct ferment (room temperature)
```
idyPct(hours, T, hum) = clamp( (2.4 / hours) * 2^((20 - T)/6) * humFac , 0.01, 1.0 )
```
- Anchored at **~0.10 % IDY for 24 h at 20 °C**; dose is inversely proportional to time and **halves per +6 °C**.
- `humFac` = 1.05 (dry) / 1.00 (normal) / 0.95 (humid).

### 5.2 Temperature rate factor
```
rate6(T) = 2^((T - 20)/6)     // fermentation activity relative to 20 °C
```

### 5.3 Cold maturation (fridge does the work — short bulk, long fridge)
```
coldIdyPct = clamp( 2.4 / ( roomH*rate6(amb) + coldH*rate6(coldT) ) * humFac , 0.01, 1.0 )
```
Both phases fully count toward one fermentation "budget."

### 5.4 Bulk-then-hold (warm rise to ≈double, fridge as a brake — the pizzaiolo style)
```
bulkHoldIdyPct = clamp( 3.8 / ( roomH*rate6(amb) + 0.4*coldH*rate6(coldT) ) * humFac , 0.01, 1.0 )
```
Higher constant (3.8) = a "rise-to-double" target; fridge weighted at **0.4** because it is mostly a brake. **Calibrated so the pizzaiolo benchmark reproduces ≈4 g fresh / 645 g flour** (see §11).

### 5.5 Biga (stiff preferment)
```
bigaIdyPct(bigaTemp) = clamp( 0.33 * 2^((18 - bigaTemp)/6), 0.1, 0.7 )   // on biga flour
```
Biga is 45 % hydration; the dose above is expressed on the biga flour, then scaled by biga share of total flour.

### 5.6 Yeast conversions (from IDY)
```
YCONV = { instant: 1, ady: 1.25, fresh: 3 }     // fresh ≈ 3× IDY, ADY ≈ 1.25× IDY
```
**D1 RESOLVED (Sprint 2): we keep the physically accurate ratios.** Fresh matches the pizzaiolo benchmark exactly; the dry figure reads slightly lower than the pizzaiolo's rounded 2 : 1 rule of thumb, and that is correct.

### 5.7 Water temperature (to hit target dough temp / FDT)
```
direct:  waterTemp = clamp( 3*FDT - ambient - flourTemp - friction, 2, 45 )
biga:    waterTemp = clamp( 4*FDT - ambient - flourTemp - bigaTemp - friction, 2, 45 )
friction = { hand: +1, spiral: +3, stand/planetary(KitchenAid): +5 }
```

### 5.8 Ball weight from pizza diameter
```
ballWeight(diaCm, density) = clamp( round5( π*(diaCm/2)² * density ), 150, 420 )
crust density g/cm²: thin 0.32 · classic 0.36 · canotto 0.42
```
Sanity check: 30 cm classic → ~255 g (matches Ooni/Gozney's ~250 g for 12").

### 5.9 Time-budget constraint
```
roomHours + coldHours ≤ METHODS[method].hours   (6 / 24 / 48; for biga, 12 h minimum is reserved for the biga)
```
Coupled sliders rebalance each other; switching method re-clamps both into the new budget.

---

## 6. Oven database (verified via web search, Sprint 1)

Max pizza diameter drives ball weight; heat/usage drive the baking card. Sources: Ooni & Gozney official pages and product reviews (May–Jun 2025).

| Oven | Max Ø | High-heat? | Notes |
|---|---|---|---|
| Ooni Koda 12 | 30 cm (12") | ✅ | Floor ~430–450 °C, 60–90 s |
| Ooni Koda 16 | 40 cm (16") | ✅ | L-burner, quarter-turn |
| Ooni Karu 12 | 30 cm (12") | ✅ | Wood/gas |
| Ooni Karu 16 | 40 cm (16") | ✅ | Multi-fuel, AVPN-recommended |
| Ooni Volt 12 | 30 cm (12") | ✅ | Electric, tops ~400 °C, slightly longer bake |
| Gozney Roccbox | 30 cm (12") | ✅ | Dense stone, great heat retention |
| Gozney Arc | 35 cm (14") | ✅ | Lateral rolling flame, less turning |
| Gozney Arc XL | 40 cm (16") | ✅ | Lateral flame, gentle even heat |
| Gozney Dome | 40 cm (16") | ✅ | Wood/gas, big retained heat |
| Other wood-fired | 42 cm | ✅ | Dome 450–485 °C |
| Home oven + steel/stone | 33 cm | ❌ | 250–300 °C; **two-stage bake** (sauced base low → cheese + grill high) |

**Both Ooni and Gozney recommend ~250 g balls for a 12" pizza** — our density model lands there. Default target diameter is **30 cm even on 16" ovens**, because both brands advise starting at 12".

---

## 7. Ingredient data

**Flours** (`FLOURS`): each carries protein %, comfortable max hydration, ideal ferment window, a named benchmark, and a tip.
- *Tipo 00 pizzeria (W260–300, ~12.5 %)* — e.g. Caputo Pizzeria (blue). Best 6–24 h. **★ default for direct.**
- *Strong 00 (W300–340, ~13–14 %)* — Caputo Cuoco (red) / Nuvola. Best 24–72 h + biga. **★ for 48 H biga.**
- *Bread flour (~12.5 %)* — accessible substitute, slightly crisper.
- *All-purpose (~10.5 %)* — weak; warns if used for >6 H or above its hydration ceiling.

**Yeast** (`fresh` / `ady` / `instant`): conversions in §5.6, each with a usage tip. Whatever the type, *freshness of stock* is the #1 message.

**Crust styles:** thin / classic (★) / canotto, mapping to densities in §5.8.

**Mixers:** hand (+1 friction) / KitchenAid-planetary (+5) / spiral (+3), each with a tip.

---

## 8. Key state & functions (navigation map)

**State groups:** meta (`started`, `region`, `tier`, `step`, `notice`), schedule (`method`, `bakeAt`), oven (`oven`, `targetDia`, `crust`, `pizzas`), kitchen (`season`, `ambient`, `humidity`, `storagePreset`, `flourTempManual`, `mixer`, `fridgeTemp`), ingredients (`yeastType`, `flour`, `hyd`, `saltP`, `fdt`), fermentation (`strategy`, `roomHours`, `coldHours`, `bigaPct`, `bigaTemp`), save/load (`saveCode`, `loadInput`, `storageMsg`), troubleshooter (`troubleCat`).

**Effective values (`eff*`)**: the tier matrix (§15) is enforced by deriving effective values from raw state — e.g. `effHyd = isExpert ? hyd : M.bench.hyd`. The raw state is preserved so switching tiers is non-destructive.

**Key functions:** `idyPct`, `rate6`, `coldIdyPct`, `bulkHoldIdyPct`, `bigaIdyPct`, `ballWeight`, `locTemps`, `fmtTemp`, `ozOf`, `pickMethod(id)`, `setRoom`/`setCold` (coupled), `saveRecipe`/`loadRecipe`, `collectState`. Main derived values: `calc` memo (flour/water/salt/yeast/waterTemp/biga split) and `schedule` memo (backwards timeline).

**Data tables:** `REGIONS`, `TIERS`, `OVENS`, `FLOURS`, `METHODS` (+ `.bench` presets), `CRUSTS`, `MIXERS`, `SEASONS`, `STORAGE_PRESETS`, `STRATEGIES`, `TROUBLES`, `YCONV`, `FRICTION`.

---

## 9. Sprint 1 chronology (what we did, in order, and why)

1. **v0 — tabbed calculator.** 6 H / 24 H / 48 H Biga; yeast (fresh/dry), FDT, batch size, water-temp calc, schedule builder, troubleshooting matrix, oven cheat sheet. *Why:* deliver the requested feature set fast.
2. **Yeast reality-check.** User flagged the doses looked off vs a real recipe (2 g dry / 645 g). We discovered the engine had been revised to an **IDY-based model** with conversions. *Why it mattered:* established that the tiny numbers are correct for slow maturation, but real recipes vary by *fermentation profile*.
3. **Cold-ferment model.** Added a fermentation-**budget** across room + fridge phases (`rate6`, `coldIdyPct`). Validated: 24 h fridge + 4 h room ≈ 2.34 g ADY, matching a user overnight recipe.
4. **Pizzaiolo benchmark introduced.** User supplied an award-winning 24 h recipe. Decoded to 266 g balls / 62 % hyd / 2.33 % salt / 0.62 % fresh / 2 : 1 fresh:dry.
5. **Discovered the "two jobs of the fridge."** The benchmark uses a **long warm bulk → fridge-as-brake** profile; our budget model (fridge does maturation) **under-dosed** it. *Resolution:* added a second mode.
6. **Two cold modes.** *Cold maturation* (K = 2.4, full fridge weight) and *Bulk, then hold* (K = 3.8, fridge weight 0.4). Calibrated so the benchmark reproduces ≈4 g fresh.
7. **Benchmark preset + coupled budget sliders.** One-tap preset; room + cold can't exceed the method budget; method switch re-clamps; temper fixed to ≤2 h with the rest as bulk.
8. **Conventional-oven bake fix.** Rewrote the home-oven card to the recipe's **two-stage** technique (sauced base low → cheese + grill high).
9. **Major rebuild → 5-step wizard.** Re-architected around the home aficionado working backwards. Added real Ooni/Gozney oven specs (web-searched), **diameter → ball-weight**, flour/yeast tips, and the Expert toggle.

---

## 10. Errors discovered & resolutions

| # | Error / surprise | Root cause | Resolution |
|---|---|---|---|
| E1 | File on disk differed from last write (IDY model appeared) | An intermediate revision to an IDY-based engine | Always `view` the current file fully before editing; adopted IDY framework as canonical |
| E2 | `str_replace` failures | Stale/changed source vs assumed content | View-before-edit discipline; smaller unique anchors |
| E3 | Yeast under-dosed vs pizzaiolo benchmark | Budget model treats fridge as maturation; benchmark uses fridge as a brake after a full warm rise | Added **bulk-then-hold** mode (K = 3.8, 0.4 fridge weight) |
| E4 | Conversion mismatch (2 : 1 vs 2.4 : 1 fresh:dry) | Recipe uses a rounded rule of thumb | **RESOLVED Sprint 2 (D1): keep accurate ratios** |
| E5 | Default cold hours (24) exceeded the 24 h budget once the constraint shipped | Constraint added after defaults | Per-method benchmark presets now set valid splits; generic default lowered |
| E6 | Even 50/50 room split gave wrong temper for long bulks (7 h temper) | Naive `roomHours/2` split | `temper = min(2, room/2)`, rest = bulk |
| E7 | Conventional oven guidance missed the two-stage technique | Cheat sheet written for high-heat ovens | Rewrote the home-oven card |

---

## 11. Validation & benchmarks

**Pizzaiolo 24 H benchmark** (the reference recipe): 645 g flour, 400 g water, 15 g salt, 4 g fresh (or 2 g dry), ~12 h room bulk → fridge → 2 h temper.
- Decoded: **266 g balls, 62.0 % hydration, 2.33 % salt, 0.62 % fresh, 2 : 1 fresh:dry.**
- Calculator in **bulk-then-hold** at matched settings (14 h room + 10 h fridge @ 5 °C, 22 °C room): **645 g flour / 400 g water / 14.8 g salt / 4.01 g fresh** → essentially exact on the headline recipe.
- The same engine in **cold-maturation** mode reproduces a *different* user recipe (short bulk + 24 h fridge → ~2.3 g ADY). Two real recipes, two profiles, both reproduced — by selecting the matching mode.

**These benchmarks are codified in `scripts/validate-engine.mjs` and run in CI before every deployment.**

**Takeaway:** yeast dosing is strategy-dependent, not a single curve. The mode selector is essential; **bulk-then-hold is the right default** for this audience.

---

## 12. Known issues / open decisions

- ~~**D1 — yeast conversion ratio.**~~ **RESOLVED:** keep accurate ratios (fresh 3× / ADY 1.25× IDY). Fresh matches the benchmark exactly.
- **D2 — 6 H and 48 H biga benchmark numbers** not yet tuned to named reference recipes (24 H is). Sanity-checked plausible (6 H @21 °C ≈ 0.36 % IDY); proper validation needs reference recipes from the user.
- ~~**D3 — "a couple of bugs here and there."**~~ **DROPPED by the user** at the start of Sprint 2.
- **D4 — biga schedule edge cases** (very short/long cold holds) need a pass.
- **D5 — accessibility**: verify keyboard nav across the wizard + focus management when steps change.

---

# 13. ROADMAP — Sprint 2

### R1 — Region toggle (US / EU) — ✅ DONE
US/EU switch on the pre-start screen. Region-appropriate brand/product examples for flour, yeast, tomatoes, salt. **Units follow the region** (user requirement added in Sprint 2): US ⇒ °F everywhere + oz alongside grams; EU ⇒ °C/grams. Grams remain the reference for accuracy. Hardcoded absolute temperatures inside tip strings go through `locTemps()`; friction **deltas are never converted**.

### R2 — Skill / difficulty level — ✅ DONE
Pre-start picker: **Amateur** ("Piece of Cake") / **Enthusiast** ("Let's Rock") / **Expert/Pizzaiolo** ("Damn I'm Good"). Tier changeable mid-session via header chips; enforcement via `eff*` derived values (matrix in §15).

### R3 — Schedule gating by available lead time — ✅ DONE
Methods that don't fit `hoursUntilBake` are grayed/non-clickable with an explanatory tooltip; auto-fallback to the longest fitting method + toast notice. **Sprint 3 final model:** the hard gate is the **exact fermentation duration** (`methodFits = hoursUntil >= hours`) — so a 24 h 13 m window keeps the 24 h method (no silent drop to 6 h), and greying is purely derived from `hoursUntil` (adding time re-enables tiers live). The **+0.5 h prep buffer survives as an explicit advisory, not a silent gate**: `methodTight = fits && hoursUntil < hours + PREP_BUFFER` shows a gold "tight on prep" flag on borderline tiers, and the bake-date card explains the ~30 min reserve (mixing + balling + preheat). This keeps the buffer's wisdom visible without the confusing rejection.

### R4 — Flour storage as presets — ✅ DONE
Cupboard ~21 °C ★ / cool dry place ~18 °C / cellar ~15 °C. Numeric slider Expert-only.

### R5 — ★ Preferred-choice indicator — ✅ DONE
Gold ★ + "why" tooltip on every multi-option control (`preferred` / `whyPreferred` flags in data rows). Picks: 24 H method, classic crust, 00 pizzeria (direct) / strong 00 (biga), fresh yeast (instant ★ for Amateur), hand mixing, cupboard storage, bulk-then-hold, San Marzano tomatoes (region-aware).

### R6 — Hide hydration / salt / FDT outside Expert — ✅ DONE
Sliders absent below Expert; benchmark values used silently; an info card explains what was set and why.

### R7 — Default fermentation = bulk-then-hold — ✅ DONE
Standard for every tier. Expert gets the 3-way choice: bulk-then-hold ★ / cold maturation / ambient.

### R8 — Timeline walkthrough with videos / visuals — ✅ DONE
Per-step technique visuals (autolyse mix · coil fold · staglio + pirlatura · stretching · launching & turning · poke test · two-stage home bake). In production, `<video>`/embeds work; the artifact version must keep an **animated SVG/CSS fallback** (no network). Per-step optional media slot, graceful text-only fallback.
**Implementation:** module-level `TECHNIQUES` registry (sibling of `TROUBLES`), each `{ id, name, blurb, Svg, media? }`. Timeline steps carry a `tech: [...ids]` array; a no-print "▸ Voir la technique" toggle (state `openTech`, one step open at a time) expands an animated SVG/CSS figure + FR blurb. The SVG is **always** the rendered fallback (zero network ⇒ identical in artifact & prod); the optional `media` slot renders a `<video>` only when a URL is present (none today), so prod can light up video later without touching logic. Animations honor `prefers-reduced-motion` and are `.no-print`. Mapping: autolyse→pétrissage · coilfold→pointage · pirlatura→boulage · poke→apprêt/détente · stretch+launch→cuisson (hot ovens) · stretch+twostage→cuisson (home ovens).

### R9 — Output: PDF download + "Save for later" code — ✅ DONE
- PDF: dedicated `@media print` stylesheet (`.no-print` / `.print-area`) + `window.print()` — one-page recipe ticket + timeline + oven card.
- Save: 6-char code (unambiguous alphabet) → full state versioned `{v:2,…}` under `recipe:CODE` via `window.storage` (shared scope in artifact; localStorage shim in prod). Load from the start screen or the recipe screen. `mailto:` link prefilled with the code + recipe summary.

---

## 14. Region matrix (US / EU) — shipped data for R1

| Item | EU examples | US examples |
|---|---|---|
| **00 pizzeria flour ★** | Caputo Pizzeria (blue), Le 5 Stagioni, Molino Dallagiovanna | Antimo Caputo (imported, blue), King Arthur '00', Central Milling 00 |
| **Strong 00 / biga** | Caputo Cuoco (red), Caputo Nuvola, Petra | Caputo Cuoco (imported), King Arthur bread flour, All Trumps (high-gluten) |
| **Fresh yeast ★** | Supermarket fresh yeast cube | Red Star / Fleischmann's cake yeast (harder to find) |
| **Instant dry yeast** | Caputo Lievito, Mauripan | SAF Instant (red) ★, Fleischmann's RapidRise |
| **Tomatoes ★** | San Marzano dell'Agro Sarnese-Nocerino DOP | San Marzano (imported), Bianco DiNapoli, Cento DOP |
| **Salt** | Fine sea salt (sale fino) | Fine sea salt (Diamond Crystal kosher as alt) |
| **Units** | °C, grams | °F display, grams + oz readout |

---

## 15. Difficulty-control matrix — enforced via eff* values

★ = auto-set to the preferred value at this tier. "slider/choose" = user-editable.

**REVISED in Sprint 3** (client spec). Two deliberate widenings vs the Sprint 2 matrix, both client-approved:
(a) Passionate (formerly "Enthusiast") gains the **Schedule page** (room/cold split + ambient) and the **fermentation method** choice — previously Expert-only. (b) Raw chemistry (hydration / salt / FDT / ball-weight sliders) stays **Pizzaiolo-only**; Amateur stays fully automatic. The validated benchmark profile (`bulk-then-hold`, §11) is untouched — it is simply surfaced under the name **Freddo ★**.

UI naming (Sprint 3): expertise tiers = Amateur / **Passionate ★** / Pizzaiolo. Dough tiers (page 2, = the engine `method`/time) = **Classico** (h6) / **Napoletano ★** (h24) / **Maestro** (h48). Fermentation methods (= engine `strategy`) = **Diretto** (ambient) / **Freddo ★** (bulk-then-hold) / **Lento** (cold-maturation).

| Control | Amateur | Passionate | Pizzaiolo |
|---|---|---|---|
| Dough tier / time (gated by time, R3) | choose | choose | choose |
| Oven type (dropdown) | choose | choose | choose |
| Pizza diameter | ★ oven sweet spot (≤30) | slider 20–max | **slider 16–42** |
| Crust style | ★ classic | choose | choose |
| # pizzas (± stepper, default 4) | choose | choose | choose |
| Season | choose | choose | choose |
| Ambient temp | from season (hidden) | **± buttons (14–38 °C)** | **± buttons (14–38 °C)** |
| Humidity | from season (hidden) | choose | choose |
| Flour storage | ★ cupboard preset | preset | presets **+ temp slider** |
| Mixer | **choose** (★ hand ≤6 / stand >6) | choose (★ same) | choose (★ same) |
| Fridge temp (shown only if Freddo/Lento) | ★ 5 °C (hidden) | ★ 5 °C | slider |
| Yeast type | ★ instant | choose | choose |
| Flour type | ★ auto (00 pizzeria / strong 00 si biga) | choose | choose |
| **Fermentation method** (Diretto/Freddo/Lento) | ★ Freddo (locked) | **choose** | **choose** |
| **Schedule page** (room/cold split + ambient) | ✗ | **✓** | **✓** |
| **Hydration** | hidden (benchmark) | hidden (benchmark) | **slider (★ on track)** |
| **Ball weight** | benchmark | benchmark | **slider (★ on track)** |
| **Salt** | hidden (benchmark) | hidden (benchmark) | **slider** |
| **FDT** | hidden (auto) | hidden (auto) | **slider** |
| Biga share / temp | benchmark | benchmark | sliders |
| Proof total + room/cold split | benchmark | **Schedule: ± total + coupled sliders** | **Schedule: ± total + coupled sliders** |

---

## 16. Save-for-later & PDF — shipped implementation (R9)

- `collectState()` → versioned object `{v:2, …all inputs…}` stored as JSON under `recipe:CODE` (shared scope).
- Code alphabet excludes ambiguous chars (no I/L/O/0/1). 6 chars.
- Load validates shape (`v === 2`), restores all state, jumps to the recipe step.
- All storage calls in try/catch; "code not found" handled.
- PDF via `@media print`: `.no-print` hides chrome, `.print-area` keeps ticket + timeline + oven card, light theme forced.
- **Production note:** `window.storage` is recreated by `src/storage-shim.js` over localStorage (per-browser). Swap the shim's 4 methods for a KV backend for cross-device codes — the component never changes.

---

## 17. Build order (Sprint 2) — final state

1. ~~Bugs (D3)~~ — dropped by the user.
2. ✅ R2 + R6 + R7 (structural backbone).
3. ✅ R5 + R4.
4. ✅ R3.
5. ✅ R1 (+ unit system requirement).
6. ✅ R9.
7. ✅ R8 (technique visuals on the timeline).
8. ✅ D1 resolved (keep accurate ratios) · D2 sanity-checked, full validation pending reference recipes.

---

## 18. Sprint 2 log

- **Scope delivered:** R1 (region + full unit system), R2, R3, R4, R5, R6, R7, R8, R9 — **Sprint 2 complete**. Engine untouched and re-validated (4.01 g fresh on the 24 H benchmark — PASS).
- **New requirement folded in:** region drives the **unit system** (US: °F + oz alongside grams), including hardcoded temperatures in oven tip strings via `locTemps()`. Friction deltas are exempt by design.
- **Decisions:** D1 → keep accurate yeast ratios. D3 → dropped.
- **Productionization:** repo scaffolded (Vite + React), `window.storage` shim, CI validation gate, GitHub Pages auto-deploy. The component file is byte-identical between artifact and prod.
- **Remaining:** none — Sprint 2 closed. Next up **Sprint 3: design overhaul** — a design brief will be prepared in `docs/` with full client-discovery questions.

---

## 19. Sprint 3 log — wizard redesign (in progress)

**Goal:** client-driven UX overhaul of the wizard. Engine §5 **untouched** — `npm run validate` still PASS (4.01 g fresh on the 24 H benchmark). All new concepts map onto existing engine inputs.

- **Bilingual FR/EN** (`lang` state + `tr()`/`L()` helpers, header toggle). Data strings carry `{fr,en}`; `L()` resolves, `tr(fr,en)` for inline copy. `fmtClock(d, lang)` switches locale.
- **6 pages** (Schedule shown only for Passionate/Pizzaiolo, so Amateur sees 5): 1 Profile (region/units · bake **date** + **time presets** 12/13/18/19/20 + custom · # pizzas ± stepper · level) · 2 Dough (Classico/Napoletano★/Maestro tiers = engine method, ★ marker on hydration/ball sliders · Diretto/Freddo★/Lento method cards with timing + flavor + **checkerboard strip** on select) · 3 Tools (oven **dropdown** · diameter slider 16–42 Pizzaiolo / 20–max Passionate · kitchen season/humidity/**ambient ± buttons** · flour storage + temp · knead pros/cons + water-temp output · fridge temp if Freddo/Lento) · 4 Ingredients (yeast/flour/tomatoes + Pizzaiolo chemistry) · 5 Schedule (interdependent ambient/room/cold preserving the method total + live ingredient quick-total) · 6 Recipe (unchanged + **quick-fix / forever-fix** in the help section).
- **Global header** on every wizard page: language · units · # pizzas stepper · level switch · per-page Back. Tool availability re-adapts live to the level.
- **Decisions:** (1) dough tier = fermentation time (1 control). (2) Diretto=ambient, **Freddo★=bulk-then-hold** (validated benchmark renamed), Lento=cold-maturation. (3) §15 widened for Passionate (see §15). (4) Mixer ★ dynamic: hand ≤6 balls, KitchenAid/stand >6.
- **State added:** `lang`, `ballManual` (Pizzaiolo ball override). Save format bumped to `{v:3}`; loader still accepts `v:2` (missing fields default).
- **Verification:** `npm run validate` PASS · `npm run build` green · SSR smoke render of 3 tiers × 6 pages (18 scenarios) all clean.
- **Review round 1 (client feedback):** default language → **English**. Start screen: added a quick intro + feature chips, **removed the level cards** (now only on the Profile page), and reframed the code box with an explanation ("Resume a recipe"). Profile: **R3 buffer removed** (auto-switch bug — 24 h 13 m no longer drops to 6 h; tiers re-enable when time is added back) + **Back button returns to the main screen** from step 1. Tools: **kneading is now choosable at Amateur** (`effMixer = mixer`, ★ stays dynamic) and **room temperature goes up to 38 °C**. Global: the **language chip now shows the language you'll switch TO** (🌐 EN when in FR, and vice-versa). Verified: validate PASS · build green · gating unit-check 7/7 · SSR smoke 2 langs × 3 tiers × 6 pages (36) clean.
- **Review round 2 (client feedback):** (1) **Prep buffer restored as an advisory** — hard gate stays at the exact fermentation duration, but the +0.5 h reserve is now surfaced (gold "tight on prep" flag on borderline tiers + an explanatory note on the bake-date card) instead of silently dropping the method. (2) **Schedule proof-time model fixed** — added a **± Total proof time** stepper (state `proofTotal`, default = the method's room+cold; clamped to the available window via `proofMax`), and the room/cold sliders are now **coupled to always sum to the total** (`effRoom`+`effCold` ≡ `effProof`; Diretto = all room, no cold slider; biga handled automatically). Save bumped fields (`proofTotal`) under the same `{v:3}`. Verified: validate PASS · build green · gate/buffer unit-check 5/5 · proof-sum invariant 1219/1219 exact · SSR smoke 36 variants (method+strategy varied) clean.
- **Open / next:** R8 technique visuals flagged by client for polish (separate pass). Self-contained build delivered for client review before further Sprint 3 work.

---

*End of bible. Keep this file updated as work lands — it is the contract between sprints.*
