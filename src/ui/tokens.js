/* Dough Control — design tokens as JS (mirror of tokens.css :root).
   Handy for design tooling, docs, and preview generation. Keep in sync
   with tokens.css — the CSS custom properties are the runtime source. */

export const colors = {
  bg: "#F7EEDD",
  surface: "#FFFFFF",
  surface2: "#F3EAD8",
  line: "#E7D9C2",
  flour: "#2B1A12",
  dim: "#6B5848",
  faint: "#9A8772",
  ember: "#CC2A1E",
  emberDeep: "#A81F16",
  gold: "#CC2A1E",
  basil: "#1F7A3D",
  green: "#1E8A4C",
  warn: "#A56A12",
  danger: "#8E1B12",
};

export const fonts = {
  display: "'Anton', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const radii = { sm: 8, md: 10, lg: 12, pill: 999 };

export default { colors, fonts, radii };
