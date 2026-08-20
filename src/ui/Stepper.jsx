import React from "react";

/**
 * Stepper — compact numeric −/+ control (e.g. number of pizzas).
 * Standalone port of the app's Stepper.
 *
 * Props: value, onChange(number), min, max, fmt (value formatter).
 */
export default function Stepper({ value, onChange, min = 0, max = 99, fmt }) {
  return (
    <div className="stepbox">
      <button className="stepbtn" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="−">−</button>
      <span className="stepval">{fmt ? fmt(value) : value}</span>
      <button className="stepbtn" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="+">+</button>
    </div>
  );
}
