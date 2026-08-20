import React from "react";

/**
 * Callout — the troubleshooter card (warn-bordered) with a question and
 * the paired "quick fix" (basil) / "forever fix" (gold) advice lines.
 * Any line is optional; omit `quick`/`forever` for a plain callout.
 *
 * Props: title, quick, forever, quickLabel, foreverLabel, className, children.
 */
export default function Callout({
  title,
  quick,
  forever,
  quickLabel = "Quick fix",
  foreverLabel = "Forever fix",
  className = "",
  children,
}) {
  return (
    <div className={`qbox ${className}`.trim()}>
      {title && <div style={{ fontWeight: 700, fontSize: 13, color: "var(--warn)" }}>{title}</div>}
      {quick && <div className="qfix"><b>{quickLabel} :</b> {quick}</div>}
      {forever && <div className="ffix"><b>{foreverLabel} :</b> {forever}</div>}
      {children}
    </div>
  );
}
