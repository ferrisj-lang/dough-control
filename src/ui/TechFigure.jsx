import React from "react";

/**
 * TechFigure — a technique demo card (coil fold, pirlatura, launch…):
 * a 132×112 media slot beside a name + blurb. Pass a looping `video`
 * URL, or any `media` node (e.g. an animated SVG fallback for the
 * artifact build, per bible R8).
 *
 * Props: name, blurb, video (src), media (node), className.
 */
export default function TechFigure({ name, blurb, video, media, className = "" }) {
  return (
    <div className={`techfig ${className}`.trim()}>
      <div className="techmedia">
        {video ? (
          <video className="techvid" src={video} autoPlay loop muted playsInline />
        ) : (
          media
        )}
      </div>
      <div>
        {name && <div style={{ fontWeight: 700, fontSize: 13, color: "var(--flour)" }}>{name}</div>}
        {blurb && <div className="tip" style={{ marginTop: 2 }}>{blurb}</div>}
      </div>
    </div>
  );
}
