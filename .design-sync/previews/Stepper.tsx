import React from "react";
import { Stepper } from "dough-control";

export const PizzaCount = () => {
  const [n, setN] = React.useState(4);
  return <Stepper value={n} onChange={setN} min={1} max={12} />;
};

export const Formatted = () => {
  const [n, setN] = React.useState(4);
  return <Stepper value={n} onChange={setN} min={1} max={12} fmt={(v) => `${v} 🍕`} />;
};

export const AtMinimum = () => {
  const [n, setN] = React.useState(1);
  return <Stepper value={n} onChange={setN} min={1} max={12} />;
};

export const InAHeaderRow = () => {
  const [n, setN] = React.useState(6);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className="lbl" style={{ margin: 0 }}>Pizzas</span>
      <Stepper value={n} onChange={setN} min={1} max={12} />
    </div>
  );
};
