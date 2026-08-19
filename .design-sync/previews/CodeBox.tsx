import React from "react";
import { CodeBox, Card, Button } from "dough-control";

export const SavedRecipe = () => (
  <CodeBox label="Your recipe code" code="K7M2QP" />
);

export const WithHint = () => (
  <CodeBox label="Your recipe code" code="B4XN9T">
    <div className="tip">
      Enter this on any device to reload the exact recipe.
    </div>
  </CodeBox>
);

export const InSaveCard = () => (
  <Card label="Keep this recipe">
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
      <Button>🖨 Download as PDF</Button>
      <Button variant="ghost">💾 Save for later</Button>
    </div>
    <CodeBox label="Your recipe code" code="K7M2QP" />
  </Card>
);
