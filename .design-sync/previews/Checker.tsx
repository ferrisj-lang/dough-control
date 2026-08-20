import React from "react";
import { Checker, Wordmark } from "dough-control";

export const Default = () => <Checker />;

export const AsHeaderRule = () => (
  <div>
    <div style={{ padding: "0 0 14px" }}>
      <Wordmark />
    </div>
    <Checker />
    <div className="tip" style={{ paddingTop: 12 }}>
      The checkerboard strip separates the brand header from the page body.
    </div>
  </div>
);

export const Stacked = () => (
  <div style={{ display: "grid", gap: 20 }}>
    <Checker />
    <Checker style={{ height: 20 }} />
    <Checker style={{ height: 28 }} />
  </div>
);
