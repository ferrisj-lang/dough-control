# design-sync notes — dough-control

## Repo shape

- **The synced design system is `src/ui/`, NOT the app.** `src/dough-control.jsx`
  is the production app: a single ~1600-line autonomous component that inlines
  its own CSS. `src/ui/` is a *parallel* library that re-exports the same
  "Napoli" design system as composable primitives. See `src/ui/README.md`.
- **CLAUDE.md rule #2 is the reason for the split**: `dough-control.jsx` must stay
  a self-contained Claude artifact (zero diff artifact ⇄ prod), so it may
  **never** import `src/ui/`. Never "fix" the duplication by making the app
  import the library — that breaks the artifact contract.
- **Sync rule**: if a token/class changes in the app's `css` string (after
  validation against PROJECT-BIBLE §4), mirror it into `src/ui/tokens.css` /
  `src/ui/components.css`, and vice versa. They must not drift.
- The library is **plain JSX with no build step**. `npm run build` builds the
  *app*, not the library — there is no `dist/` for `src/ui`, so the converter
  runs with `--entry ./src/ui/index.js` (esbuild bundles the JSX directly).
  `cfg.buildCmd` is deliberately unset.

## Converter invocation

```sh
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --entry ./src/ui/index.js --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle
```

- **`--node-modules ./node_modules`** (repo root — single package, no monorepo).
- **`@types/react` is not a repo dependency.** Install it for the sync without
  touching the lockfile: `npm i --no-save --no-package-lock @types/react`.
  Without it the build prints `[DTS_REACT]`. (It does not actually rescue prop
  extraction here — see below — but it silences a misleading warning.)
- **No TypeScript anywhere** → `[DTS] parsed 0 .d.ts files`, so automatic prop
  extraction yields empty `{[key: string]: unknown}` bodies. **Every component's
  props are hand-written in `cfg.dtsPropsFor`.** If you add or change a prop in
  `src/ui/*.jsx`, update `dtsPropsFor` in the same commit or the design agent
  codes against a stale contract.
- `componentSrcMap` pins all 19 exports explicitly (several share a file:
  Ticket/TicketRow, Timeline/TimelineItem, and the four Brand devices).

## Playwright / render check

- **On a normal dev machine**: `cd .ds-sync && npm i playwright && npx playwright
  install chromium`. Any recent version works — it fetches the browser it pins.
- **Only inside the Claude Code web container** (which pre-caches chromium build
  **1194** at `/opt/pw-browsers` and forbids `playwright install`): you must
  install the release pinned to that exact build, which is **playwright 1.56.0**
  (`npm i playwright@1.56.0 playwright-core@1.56.0`). Any other version fails
  with `browserType.launch: Executable doesn't exist`. To re-derive the pairing
  for a different cached build, read `browsers.json` from candidate tags:
  `https://raw.githubusercontent.com/microsoft/playwright/v<X.Y.Z>/packages/playwright-core/browsers.json`.

## Deliberate divergences from the app's CSS

- **`body { font-family: 'Inter'; color: var(--flour) }` in `src/ui/tokens.css`
  is an addition, not an extract.** In the app every primitive lives inside the
  `.dc` shell which sets the font; standalone, an unwrapped component fell back
  to the browser's serif default (caught while grading the Card previews). The
  app is unaffected — it does not import this stylesheet.
- **Fonts are self-hosted in the library (`src/ui/fonts/`), not CDN-loaded.**
  This was found the hard way: the first capture pass rendered the `Emblem`
  in a plain fallback sans instead of Anton. A probe
  (`playwright` → `document.fonts`) proved the request to
  `fonts.googleapis.com` **failed** and *zero* font faces registered, while
  validate only printed the informational `[FONT_REMOTE]` — i.e. the remote
  `@import` is not evidence the fonts actually load. The 14 latin/latin-ext
  woff2 files (Anton 400; Inter 400/500/600/700; JetBrains Mono 400/600) were
  downloaded from the CDN via `curl` (the proxy allows it even though the
  headless browser could not reach it) and are committed under
  `src/ui/fonts/`, declared through `cfg.extraFonts`. **Do not "simplify" this
  back to an `@import`** — Anton carries the whole brand and its absence is
  silent. The app (`dough-control.jsx`) still uses the CDN `@import` and is
  unchanged.
- **Print styles are not ported.** The app's `@media print` block (and the
  `.no-print` class it powers) exist only in `dough-control.jsx`. `.no-print` is
  therefore *not* a class the design agent can use, and is deliberately absent
  from `conventions.md`. Port it if the DS ever needs print output.

## Known render warns (expected — not new)

- `tokens: 14 defined, 13 referenced` — `--danger` is defined but currently
  unused by any component class. Kept as a semantic slot (the baseline brief
  requires a danger role distinct from the tomato accent).
- `Toast` is `position: fixed`, so it can never sit inside a grid cell →
  `cfg.overrides.Toast = {cardMode: "single", primaryStory: "Saved"}`.

## Re-sync risks

- **`dtsPropsFor` is hand-maintained and will silently rot** — it is the single
  most likely thing to go stale. Diff `src/ui/*.jsx` prop destructuring against
  it on every re-sync.
- **The app ⇄ library CSS mirror can drift silently.** Nothing enforces it; a
  Sprint-N restyle of `dough-control.jsx` will not touch `src/ui/`. Diff the
  app's `css` string against `components.css`/`tokens.css` when the app restyles.
- `guidelinesGlob` currently sweeps `docs/*.md`, which ships
  **PROJECT-BIBLE.md (30 KB)** and DESIGN-BRIEF.md into `guidelines/`. Both are
  genuinely useful to the design agent, but the bible is large — narrow the glob
  if the README size warning ever fires.
- The bundle pulls **no npm packages** (`inlined npm packages: 0`); React comes
  from `_vendor/`. A future dependency in `src/ui/` changes that.
- **Grades carry across machines now that an upload exists.** Verification state
  lives in the gitignored `.design-sync/.cache/review/`, but cross-machine
  carry-forward comes from the uploaded project’s `_ds_sync.json` — which now
  exists. A future run fetches it to `.design-sync/.cache/remote-sync.json` and
  re-grades only what changed, instead of all 19.
- **`dtsPropsFor` is hand-maintained and will silently rot** — see the bullet
  above; nothing machine-checks it against `src/ui/*.jsx`.

## Run log — 2026-08-20 (first successful upload)

- **Uploaded.** Project `Dough Control DS`
  (`3ce763e4-a510-4c38-b31e-6045a1db78bd`), pinned as `cfg.projectId`. 121
  files. `package-validate.mjs` exited 0 on the **first** run — no self-heal
  iterations. All 19 components authored, 66 cells, every cell graded `good`.
- **NOTES said `cfg.overrides.Toast = {cardMode:"single", primaryStory:"Saved"}`
  was set. It is not — `config.json` has no `overrides` key at all**, and it
  did not need one: no `[GRID_OVERFLOW]` fired and all four Toast cells render
  inside their cells, because the authored `PinnedInAScreen` cell supplies its
  own positioned container. Do not add the override to "fix" a problem that
  isn't occurring; if Toast ever does escape its cell, that config line is the
  remedy.
- **No `tokens/` directory is emitted, and that is correct.** `cfg.tokensGlob`
  points at `src/ui/tokens.css`, which the converter folds into
  `_ds_bundle.css` (901 KB, includes components.css + tokens). `styles.css` is
  just two `@import`s — `fonts/fonts.css` and `./_ds_bundle.css` — so the
  token closure reaches rendered designs. A future run should not hunt for a
  missing `tokens/`.
- **Playwright on a normal machine: no version pinning needed.** Plain
  `cd .ds-sync && npm i playwright && npx playwright install chromium` fetched
  chromium-headless-shell build **1234** and the render check passed. The
  1.56.0/build-1194 pin above applies **only** inside the Claude Code web
  container.
- **This machine had no Node at all** (no nvm/fnm/volta/asdf, no Homebrew).
  Installed Node 22 LTS from the official arm64 tarball into `~/.local` (already
  on PATH). `@types/react` still had to go in via
  `npm i --no-save --no-package-lock @types/react`, and `[DTS] parsed 0 .d.ts`
  is still expected — props come from `dtsPropsFor`, as documented above.
- **`conventions.md` re-validated against this build and is 100% accurate** —
  all 14 tokens, 11 utility classes, 19 component names and every prop used in
  its example resolve in the shipped artifacts; its claims about `.dc`, `body`
  and `.wrap` match the compiled CSS exactly. Not rewritten (it pre-existed).
- **Known-warn check**: `tokens: 14 defined, 13 referenced` fired again
  (`--danger` unused) — expected, already recorded above. No new warns.
