import React from "react";

/**
 * Ticket — the mono "receipt" surface with the checkerboard top edge.
 * Use TicketRow for line items (`big` for the headline flour/water rows).
 *
 *   <Ticket>
 *     <TicketRow big label="Flour (Caputo)" value="645 g" />
 *     <TicketRow label="Salt (2.8 %)" value="18 g" />
 *   </Ticket>
 *
 * Props: className, style, children.
 */
export function Ticket({ className = "", style, children, ...rest }) {
  return (
    <div className={`ticket ${className}`.trim()} style={style} {...rest}>
      {children}
    </div>
  );
}

/** TicketRow — a label/value line. `big` for the emphasised rows. */
export function TicketRow({ label, value, big = false, className = "" }) {
  return (
    <div className={`trow ${big ? "big" : ""} ${className}`.replace(/\s+/g, " ").trim()}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default Ticket;
