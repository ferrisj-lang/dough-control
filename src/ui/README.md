# `src/ui` — Dough Control design-system library

Primitives React autonomes qui **exportent** le design system « Napoli »
(bible §4) pour qu'on puisse composer de nouveaux écrans on-brand — dans
`claude.ai/design` via `/design-sync`, ou dans n'importe quelle app React.

```jsx
import { Button, Chip, Ticket, TicketRow, Timeline, TimelineItem } from "./ui";
```

Importer le barrel (`./ui`) charge aussi `tokens.css` + `components.css`.

## Pourquoi une librairie *parallèle* (et pas un refactor de l'app)

**Contrat rule #2 (CLAUDE.md) : zéro diff de logique entre l'artifact
Claude et la prod.** `src/dough-control.jsx` doit rester un composant
**autonome**, collable tel quel dans le sandbox d'artifacts. Il ne peut
donc **pas** importer cette librairie — sinon la version artifact casse.

Conséquence assumée : le design system existe en **deux endroits**.

| | Rôle | Source de vérité |
|---|---|---|
| `src/dough-control.jsx` (chaîne `css` + JSX inline) | l'app de prod, figée, autonome | moteur + design **en prod** |
| `src/ui/*` (ce dossier) | export composable du design system | primitives réutilisables |

Le CSS de `src/ui` est extrait **verbatim** de la chaîne `css` du
composant : à l'écran, les deux sont identiques. C'est le même compromis
documenté que `storage-shim.js` — on ne touche jamais au composant, on
recrée l'API à côté.

### Règle de synchronisation

Si un token ou une classe change dans `src/dough-control.jsx` **après
validation contre la bible §4**, répercuter le changement dans
`tokens.css` / `components.css` (et inversement). Ne jamais faire diverger
les valeurs. Cette librairie **ne modifie pas** le moteur de calcul et
n'affecte pas `npm run validate`.

## Contenu

Tokens : `tokens.css` (runtime, custom properties) · `tokens.js` (mirror JS).

Primitives : `Button` · `Chip` · `Card` · `Option` · `Slider` ·
`Stepper` · `StepIndicator` · `Ticket` / `TicketRow` · `Timeline` /
`TimelineItem` · `Emblem` / `Wordmark` / `Tricolore` / `Checker` ·
`CodeBox` · `Toast` · `Callout` · `TechFigure`.

Toutes sont pilotées par props et sans dépendance à l'i18n ou à l'état du
wizard — prêtes à composer.
