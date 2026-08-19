import React from "react";
import { TechFigure } from "dough-control";

/* The app feeds `media` an inline animated SVG (the artifact-safe fallback,
   bible R8). These previews use the same approach so the card is truthful
   without depending on a hosted video. */
const CoilFold = () => (
  <svg viewBox="0 0 132 112" width={132} height={112} aria-hidden="true">
    <ellipse cx="66" cy="70" rx="42" ry="22" fill="var(--surface2)" />
    <path d="M30 70 q36 -40 72 0 q-36 18 -72 0 Z" fill="var(--ember)" opacity="0.9" />
    <path d="M40 62 a26 26 0 0 1 52 0" fill="none" stroke="var(--basil)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Pirlatura = () => (
  <svg viewBox="0 0 132 112" width={132} height={112} aria-hidden="true">
    <circle cx="66" cy="60" r="34" fill="var(--surface2)" />
    <circle cx="66" cy="60" r="24" fill="var(--ember)" opacity="0.9" />
    <path d="M46 60 a20 20 0 1 1 5 13" fill="none" stroke="var(--basil)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const Fold = () => (
  <TechFigure
    name="Coil fold"
    blurb="Lift the dough from the middle, let it fold under itself. Twice in the first hour builds strength without degassing."
    media={<CoilFold />}
  />
);

export const Balling = () => (
  <TechFigure
    name="Pirlatura"
    blurb="Roll the ball against the bench under a cupped hand until the surface is tight and smooth."
    media={<Pirlatura />}
  />
);

export const Stacked = () => (
  <div>
    <TechFigure name="Coil fold" blurb="Builds strength without degassing." media={<CoilFold />} />
    <TechFigure name="Pirlatura" blurb="Tightens the skin before the final proof." media={<Pirlatura />} />
  </div>
);
