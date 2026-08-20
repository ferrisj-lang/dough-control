import React from "react";
import { Button } from "dough-control";

export const Primary = () => (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    <Button>Start a recipe →</Button>
    <Button>See my recipe →</Button>
  </div>
);

export const Ghost = () => (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    <Button variant="ghost">← Back</Button>
    <Button variant="ghost">💾 Save for later</Button>
  </div>
);

export const Disabled = () => (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    <Button disabled>Next: your tools →</Button>
    <Button variant="ghost" disabled>← Back</Button>
  </div>
);

export const AsLink = () => (
  <Button variant="ghost" href="mailto:baker@example.com?subject=My%20dough%20code">
    ✉️ Email me the code
  </Button>
);

export const NavigationRow = () => (
  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
    <Button variant="ghost">← Back</Button>
    <div style={{ flex: 1 }} />
    <Button>Next: your tools →</Button>
  </div>
);
