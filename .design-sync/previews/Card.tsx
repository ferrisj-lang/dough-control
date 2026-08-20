import React from "react";
import { Card, Chip } from "dough-control";

export const WithLabel = () => (
  <Card label="Your region">
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip on>🇪🇺 Europe</Chip>
      <Chip>🇺🇸 United States</Chip>
      <Chip>🇬🇧 United Kingdom</Chip>
    </div>
    <div className="tip">
      Sets the recommended products and the units: °C and grams.
    </div>
  </Card>
);

export const Plain = () => (
  <Card>
    <div style={{ fontWeight: 600, fontSize: 14 }}>Bake — Ooni Koda 12</div>
    <div className="tip">
      Preheat <span className="mono val">20 min</span> at full power, stone
      saturated. Launch, 60–90 s, regular quarter-turns.
    </div>
  </Card>
);

export const Stacked = () => (
  <div>
    <Card label="Flour">
      <div className="tip" style={{ marginTop: 0 }}>
        Tipo 00 pizzeria — W 260–280. The reference for a 24 h dough.
      </div>
    </Card>
    <Card label="Kitchen temperature">
      <div className="tip" style={{ marginTop: 0 }}>
        21 °C — used to size the yeast dose and the bulk window.
      </div>
    </Card>
  </div>
);
