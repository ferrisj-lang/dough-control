/* ════════════════════════════════════════════════════════════════
   DOUGH CONTROL — UI LIBRARY (barrel)
   ────────────────────────────────────────────────────────────────
   Export parallèle du design system "Napoli" en primitives React
   autonomes et pilotées par props. Importer ce fichier charge aussi
   les feuilles de style (tokens + composants).

   import { Button, Chip, Ticket, TicketRow } from "./ui";
   ════════════════════════════════════════════════════════════════ */

import "./tokens.css";
import "./components.css";

export { default as tokens, colors, fonts, radii } from "./tokens.js";

export { default as Button } from "./Button.jsx";
export { default as Chip } from "./Chip.jsx";
export { default as Card } from "./Card.jsx";
export { default as Option } from "./Option.jsx";
export { default as Slider } from "./Slider.jsx";
export { default as Stepper } from "./Stepper.jsx";
export { default as StepIndicator } from "./StepIndicator.jsx";
export { default as Ticket, TicketRow } from "./Ticket.jsx";
export { default as Timeline, TimelineItem } from "./Timeline.jsx";
export { default as Emblem, Wordmark, Tricolore, Checker } from "./Brand.jsx";
export { default as CodeBox } from "./CodeBox.jsx";
export { default as Toast } from "./Toast.jsx";
export { default as Callout } from "./Callout.jsx";
export { default as TechFigure } from "./TechFigure.jsx";
