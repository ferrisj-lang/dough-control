import React from "react";

/**
 * Option — full-width radio card. `on` = selected (ember ring), `off` =
 * disabled. Renders a bold name + optional sub-label; `why` shows the
 * ember rationale line, `tip` the faint helper line.
 *
 * Props: name, sub, on, off, why, tip, onClick, className, children.
 */
export default function Option({
  name,
  sub,
  on = false,
  off = false,
  why,
  tip,
  onClick,
  className = "",
  children,
  ...rest
}) {
  const cls = `opt ${on ? "on" : ""} ${off ? "off" : ""} ${className}`.replace(/\s+/g, " ").trim();
  return (
    <button className={cls} onClick={off ? undefined : onClick} disabled={off} {...rest}>
      {name && <div className="optName">{name}</div>}
      {sub && <div className="optSub">{sub}</div>}
      {children}
      {why && <div className="why">{why}</div>}
      {tip && <div className="tip">{tip}</div>}
    </button>
  );
}
