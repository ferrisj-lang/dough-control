import React from "react";

/**
 * Brand devices for the Napoli identity (bible §4).
 * - Emblem: the "Estd. Dough 2026 / CONTROL" stacked lockup + tagline.
 * - Wordmark: the compact one-line "Dough Control" mark.
 * - Tricolore: centred label flanked by the green/white/red rule.
 * - Checker: the ember checkerboard divider strip.
 */

export function Emblem({ tagline, established = "2026", className = "", style }) {
  return (
    <div className={`emblem ${className}`.trim()} style={style}>
      <div className="eline">
        <span className="estd">Estd.</span>
        <span className="esmall">Dough</span>
        <span className="estd">{established}</span>
      </div>
      <div className="ebig">Control</div>
      {tagline && <div className="etag">{tagline}</div>}
    </div>
  );
}

export function Wordmark({ children = "Dough Control", className = "", style }) {
  return <div className={`wordmark ${className}`.trim()} style={style}>{children}</div>;
}

export function Tricolore({ children, className = "", style }) {
  return <div className={`tricolore ${className}`.trim()} style={style}>{children}</div>;
}

export function Checker({ className = "", style }) {
  return <div className={`checker ${className}`.trim()} style={style} />;
}

export default Emblem;
