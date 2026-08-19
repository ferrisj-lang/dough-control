import React from "react";
import { Option } from "dough-control";

export const FermentationMethods = () => (
  <div style={{ display: "grid", gap: 10 }}>
    <Option
      name="Direct — room temperature"
      sub="6–8 h"
      tip="Fresh, milky aromas. The fastest route to dinner."
    />
    <Option
      on
      name="Bulk then hold ★"
      sub="24 h"
      why="Recommended — maturity and reliability, with a forgiving window."
    />
    <Option
      name="Cold maturation"
      sub="48 h"
      tip="Slow, deep, complex, very digestible."
    />
  </div>
);

export const Selected = () => (
  <Option
    on
    name="Bulk then hold"
    sub="24 h · 62 % hydration"
    why="Recommended for your kitchen at 21 °C."
  />
);

export const Unavailable = () => (
  <Option
    off
    name="Biga — indirect"
    sub="Pizzaiolo level only"
    tip="Switch to the Pizzaiolo level to unlock indirect doughs."
  />
);

export const OvenPicker = () => (
  <div style={{ display: "grid", gap: 10 }}>
    <Option on name="Ooni Koda 12" sub="Gas · 500 °C · 60–90 s" />
    <Option name="Gozney Roccbox" sub="Gas · 500 °C · 60–90 s" />
    <Option name="Home oven + steel" sub="275 °C · two-stage bake" />
  </div>
);
