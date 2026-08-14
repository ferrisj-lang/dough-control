import React from "react";

/**
 * Card — surface container with the Napoli border/shadow.
 * Optional `label` renders the uppercase section label (.lbl).
 *
 * Props: label, className, style, children.
 */
export default function Card({ label, className = "", style, children, ...rest }) {
  return (
    <div className={`card ${className}`.trim()} style={style} {...rest}>
      {label && <div className="lbl">{label}</div>}
      {children}
    </div>
  );
}
