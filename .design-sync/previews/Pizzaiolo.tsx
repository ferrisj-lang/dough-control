import React from "react";
import { Pizzaiolo, Checker, Card, Button } from "dough-control";

export const Default = () => <Pizzaiolo title="Dough Control pizzaiolo" />;

export const Tones = () => (
  <div style={{ display: "flex", gap: 28, alignItems: "flex-end" }}>
    <div style={{ textAlign: "center" }}>
      <Pizzaiolo tone="ember" size={110} />
      <div className="lbl" style={{ paddingTop: 8 }}>Ember</div>
    </div>
    <div style={{ textAlign: "center" }}>
      <Pizzaiolo tone="ink" size={110} />
      <div className="lbl" style={{ paddingTop: 8 }}>Ink</div>
    </div>
    <div
      style={{
        textAlign: "center",
        background: "var(--ember)",
        padding: "14px 18px 10px",
        borderRadius: 10,
      }}
    >
      <Pizzaiolo tone="cream" size={110} />
      <div className="lbl" style={{ paddingTop: 8, color: "var(--bg)" }}>Cream</div>
    </div>
  </div>
);

export const Sizes = () => (
  <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
    <Pizzaiolo size={64} />
    <Pizzaiolo size={110} />
    <Pizzaiolo size={170} />
  </div>
);

export const StartScreenHeader = () => (
  <div style={{ textAlign: "center" }}>
    <Pizzaiolo size={128} style={{ margin: "0 auto" }} />
    <div className="lbl" style={{ paddingTop: 12 }}>
      Gram-precise Neapolitan dough
    </div>
    <Checker style={{ marginTop: 14 }} />
  </div>
);

export const InEmptyState = () => (
  <Card label="No recipe yet">
    <div style={{ textAlign: "center", padding: "6px 0 4px" }}>
      <Pizzaiolo tone="ink" size={96} style={{ margin: "0 auto", opacity: 0.9 }} />
      <div className="tip" style={{ padding: "12px 0 14px" }}>
        Tell us when you want to eat and we'll plan the dough backwards from there.
      </div>
      <Button>Start a recipe →</Button>
    </div>
  </Card>
);
