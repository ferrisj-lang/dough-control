import React from "react";

/**
 * Chip — pill toggle/tag. States: default, `on` (ember fill), `off`
 * (disabled, struck through). `sm` for the compact header size.
 * Optional `star` renders the basil ★ recommendation marker.
 *
 * Props: on, off, sm, star, starWhy, onClick, title, className, children.
 */
export default function Chip({
  on = false,
  off = false,
  sm = false,
  star = false,
  starWhy,
  onClick,
  title,
  className = "",
  children,
  ...rest
}) {
  const cls = `chip ${sm ? "sm" : ""} ${on ? "on" : ""} ${off ? "off" : ""} ${className}`.replace(/\s+/g, " ").trim();
  return (
    <button className={cls} onClick={off ? undefined : onClick} disabled={off} title={title} {...rest}>
      {children}
      {star && <span className="star" title={starWhy || "★"}>★</span>}
    </button>
  );
}
