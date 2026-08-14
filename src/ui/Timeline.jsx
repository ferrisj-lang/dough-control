import React from "react";

/**
 * Timeline — vertical rail of schedule steps. Wrap TimelineItem children.
 * The `bake` item gets the basil node (the final launch step).
 *
 *   <Timeline>
 *     <TimelineItem time="18:00" dur="20 min" title="Mix" desc="…" />
 *     <TimelineItem time="20:00" title="Bake" desc="…" bake />
 *   </Timeline>
 *
 * Props: className, children.
 */
export function Timeline({ className = "", children, ...rest }) {
  return (
    <div className={`tl ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

/**
 * TimelineItem — one node on the rail.
 * Props: time, dur, title, desc, bake, children (e.g. a TechFigure toggle).
 */
export function TimelineItem({ time, dur, title, desc, bake = false, children }) {
  return (
    <div className={`tli ${bake ? "bake" : ""}`.trim()}>
      <div className="mono" style={{ color: "var(--gold)", fontSize: 13 }}>
        {time}{dur ? ` · ${dur}` : ""}
      </div>
      {title && <div style={{ fontWeight: 700, fontSize: 14, margin: "2px 0" }}>{title}</div>}
      {desc && <div className="tip" style={{ marginTop: 0 }}>{desc}</div>}
      {children}
    </div>
  );
}

export default Timeline;
