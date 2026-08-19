import React from "react";
import { Chip } from "dough-control";

export const States = () => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    <Chip>Direct</Chip>
    <Chip on>Bulk then hold</Chip>
    <Chip off>Biga</Chip>
  </div>
);

export const Recommended = () => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    <Chip on star starWhy="Best balance of flavour and reliability">
      24 h — bulk then hold
    </Chip>
    <Chip star starWhy="Deepest flavour, needs planning">48 h — cold</Chip>
  </div>
);

export const Small = () => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
    <Chip sm>🌐 EN</Chip>
    <Chip sm>🇪🇺 °C/g</Chip>
    <Chip sm on>👨‍🍳 Passionné</Chip>
    <Chip sm>🍕 Amateur</Chip>
  </div>
);

export const LevelPicker = () => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    <Chip sm>🍕 Amateur</Chip>
    <Chip sm on>👨‍🍳 Passionné</Chip>
    <Chip sm>🔥 Pizzaiolo</Chip>
  </div>
);
