import React from "react";
import { Toast } from "dough-control";

/* Toast is `position: fixed; bottom: 20px` — in the real app it pins to the
   bottom of the viewport. Inside a preview card that pins it outside the
   captured area, so these stories neutralise ONLY the positioning (the
   component, its border, shadow, padding and type are untouched).
   `PinnedInAScreen` shows the real fixed behaviour inside a mock screen. */
const inline = {
  position: "static" as const,
  transform: "none",
  maxWidth: "100%",
  display: "inline-block",
};

export const Saved = () => <Toast style={inline}>✓ Recipe saved — code K7M2QP</Toast>;

export const Loaded = () => <Toast style={inline}>Recipe K7M2QP loaded.</Toast>;

export const NotFound = () => (
  <Toast style={inline}>
    No recipe found for that code. Check the six characters and try again.
  </Toast>
);

export const PinnedInAScreen = () => (
  <div
    style={{
      position: "relative",
      height: 150,
      background: "var(--bg)",
      border: "1px solid var(--line)",
      borderRadius: 12,
      overflow: "hidden",
    }}
  >
    <div style={{ padding: 14, color: "var(--dim)", fontSize: 13 }}>
      Recipe screen…
    </div>
    <Toast style={{ position: "absolute", bottom: 16 }}>
      ✓ Recipe saved — code K7M2QP
    </Toast>
  </div>
);
