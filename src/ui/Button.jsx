import React from "react";

/**
 * Button — primary ember action, or `ghost` outline variant.
 * Renders an <a> when `href` is given (mirrors the app's ghost email link).
 *
 * Props: variant "primary"|"ghost", href, disabled, onClick, className, children.
 */
export default function Button({
  variant = "primary",
  href,
  disabled = false,
  onClick,
  className = "",
  children,
  ...rest
}) {
  const cls = `btn ${variant === "ghost" ? "ghost" : ""} ${className}`.trim();
  if (href) {
    return (
      <a className={cls} href={disabled ? undefined : href} style={{ textDecoration: "none", display: "inline-block" }} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
