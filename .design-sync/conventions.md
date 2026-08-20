# Dough Control — how to build with this design system

A warm, light-only Neapolitan-pizzeria system: cream canvas, tomato-red accent,
condensed display caps, monospace numerals. Components are plain React with
**global CSS classes** — no theme provider, no props-based styling.

## Setup

No provider is needed. Two things must be true:

1. `styles.css` is loaded. It `@import`s `fonts/fonts.css` (the self-hosted
   **Anton**, **Inter** and **JetBrains Mono** faces — no CDN, no network) and
   `_ds_bundle.css` (the tokens and every component class).
2. Page content sits inside a `<div className="dc">` root. `.dc` paints the
   cream canvas (`--bg`), sets the ink colour and the Inter body font, and adds
   page padding. Without it you get a white page — components still render and
   text still uses Inter (the stylesheet sets it on `body`), but the canvas and
   spacing are wrong. Put `.wrap` inside it to centre content at 760px.

```jsx
<div className="dc">
  <div className="wrap">{/* screen goes here */}</div>
</div>
```

## Styling idiom — global classes + CSS variables

Style your own layout glue with **inline styles that reference the tokens**, and
use the DS classes for anything the system already names. Never invent class
names: unlisted classes have no styles behind them.

**Colour tokens** (use as `var(--ember)`, etc.):

| Token | Role |
|---|---|
| `--bg` | cream page canvas |
| `--surface` | white card/ticket surface |
| `--surface2` | inset surface (callouts, technique figures, steppers) |
| `--line` | borders and dashed rules |
| `--flour` | primary text (dark espresso) |
| `--dim` | secondary text |
| `--faint` | tertiary text, micro-labels |
| `--ember` | tomato brand accent — primary actions, selected state |
| `--ember-deep` | pressed/hover accent |
| `--gold` | alias of `--ember`, used for numeric read-outs |
| `--basil` | recommendation ★, completed steps, the bake node |
| `--green` | tricolore stripe only |
| `--warn` | advisory text (callout titles) |
| `--danger` | destructive/error |

**Utility classes**: `.dc` (root), `.wrap` (760px centred), `.display`
(Anton caps — headings/logo), `.mono` (JetBrains Mono, tabular numerals),
`.lbl` (uppercase micro-label), `.tip` (faint helper line), `.why` (ember
rationale line), `.val` (emphasised numeric value), `.pillrow` / `.grid2` /
`.grid3` (layout rows).

Numbers — grams, temperatures, times — always go in `.mono`, and the headline
value pairs it with `.val`: `<span className="mono val">62 %</span>`.

## Where the truth lives

- `_ds/<folder>/styles.css` → `_ds_bundle.css` — every class and token above,
  as actually shipped. Read it before styling anything unusual.
- `components/<group>/<Name>/<Name>.prompt.md` — per-component props + usage.
- `components/<group>/<Name>/<Name>.d.ts` — the exact props contract.
- `guidelines/docs/DESIGN-BRIEF.md` — the brand rationale (palette, typography,
  where the checkerboard and tricolore devices are allowed).

## Components

`Button` `Chip` `Card` `Option` `Slider` `Stepper` `StepIndicator` `Ticket`
`TicketRow` `Timeline` `TimelineItem` `Emblem` `Wordmark` `Tricolore` `Checker`
`Pizzaiolo` `CodeBox` `Toast` `Callout` `TechFigure`

Compounds: `Ticket` takes `TicketRow` children; `Timeline` takes `TimelineItem`
children. Brand devices (`Emblem`, `Wordmark`, `Tricolore`, `Checker`,
`Pizzaiolo`) are deliberately scoped — the checkerboard and tricolore belong to
headers and the recipe ticket, not to arbitrary sections. `Pizzaiolo` is the
mascot: it takes `tone="ember" | "ink" | "cream"` (mapped to `--ember` /
`--flour` / `--bg`) and a `size` in px. Its artwork already contains the
"Dough Control" lettering, so never place it next to `Wordmark`.

## Idiomatic example

```jsx
<div className="dc">
  <div className="wrap">
    <Wordmark />
    <Checker style={{ margin: "14px 0 18px" }} />

    <StepIndicator steps={["Profile", "Dough", "Recipe"]} current={1} />

    <Card label="Fermentation method">
      <Option
        on
        name="Bulk then hold ★"
        sub="24 h"
        why="Recommended — maturity and reliability."
      />
      <div className="tip">Longer cold holds need less yeast.</div>
    </Card>

    <Ticket>
      <TicketRow big label="Flour (Tipo 00 pizzeria)" value="645 g" />
      <TicketRow big label="Water (24 °C)" value="400 g" />
      <TicketRow label="Hydration" value="62 %" />
      <Tricolore>Impasto napoletano</Tricolore>
    </Ticket>

    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
      <Button variant="ghost">← Back</Button>
      <div style={{ flex: 1 }} />
      <Button>See my recipe →</Button>
    </div>
  </div>
</div>
```
