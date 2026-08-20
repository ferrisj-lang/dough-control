import React from "react";

/**
 * CodeBox — dashed-ember panel showing a saved recipe code.
 * Props: label, code, className, children (extra actions/hints).
 */
export default function CodeBox({ label, code, className = "", children }) {
  return (
    <div className={`codebox ${className}`.trim()}>
      {label && <div className="lbl" style={{ marginBottom: 4 }}>{label}</div>}
      {code && <div className="codebig mono">{code}</div>}
      {children}
    </div>
  );
}
