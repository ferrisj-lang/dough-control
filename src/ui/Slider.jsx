import React from "react";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Slider — labelled range with a mono value read-out and an optional
 * basil ★ marker at the recommended value. Standalone port of the
 * app's Slider (no i18n dependency).
 *
 * Props: label, value, onChange(number), min, max, step, unit,
 *        display (overrides the value text), star (recommended value),
 *        starTitle.
 */
export default function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  display,
  star,
  starTitle = "Recommended",
}) {
  const starPct = star != null ? clamp(((star - min) / (max - min)) * 100, 0, 100) : null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: "var(--dim)" }}>{label}</span>
        <span className="mono val">{display ?? `${value}${unit}`}</span>
      </div>
      <div className="trackwrap">
        {starPct != null && (
          <span className="trackstar" style={{ left: `${starPct}%` }} title={starTitle}>★</span>
        )}
        <input
          type="range"
          className="dcr"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
}
