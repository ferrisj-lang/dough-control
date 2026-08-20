import React from "react";

/**
 * Toast — fixed bottom-centre notice with the ember border.
 * Render conditionally; it positions itself. Props: onClick, children.
 */
export default function Toast({ onClick, className = "", children, ...rest }) {
  return (
    <div className={`toast ${className}`.trim()} onClick={onClick} role="status" {...rest}>
      {children}
    </div>
  );
}
