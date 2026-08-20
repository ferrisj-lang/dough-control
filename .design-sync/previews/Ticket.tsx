import React from "react";
import { Ticket, TicketRow, Tricolore } from "dough-control";

export const RecipeTicket = () => (
  <Ticket>
    <div
      style={{
        textAlign: "center",
        borderBottom: "1px dashed var(--line)",
        paddingBottom: 12,
        marginBottom: 12,
      }}
    >
      <div
        className="display"
        style={{
          fontSize: 30,
          lineHeight: 0.95,
          color: "var(--ember)",
          textTransform: "uppercase",
          letterSpacing: ".5px",
        }}
      >
        Pizza Napoletana
      </div>
      <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 6 }}>
        4 × 255 g · Ø 30 cm · 24 h · Ooni Koda 12
      </div>
      <div style={{ fontSize: 12, color: "var(--dim)" }}>Bake: Sat 20:00</div>
    </div>
    <TicketRow big label="Flour (Tipo 00 pizzeria)" value="645 g" />
    <TicketRow big label="Water (24 °C)" value="400 g" />
    <TicketRow label="Salt (2.8 %)" value="18.1 g" />
    <TicketRow label="Fresh yeast (0.40 %)" value="2.58 g" />
    <TicketRow label="Hydration" value="62 %" />
    <Tricolore>Impasto napoletano</Tricolore>
  </Ticket>
);

export const BigaTicket = () => (
  <Ticket>
    <TicketRow big label="Flour (Tipo 00)" value="645 g" />
    <TicketRow big label="Water (22 °C)" value="400 g" />
    <div style={{ fontSize: 12, fontWeight: 600, margin: "10px 0 4px" }}>
      — BIGA (45 % hyd) —
    </div>
    <TicketRow label="Biga flour" value="387 g" />
    <TicketRow label="Biga water" value="174 g" />
    <TicketRow label="All the yeast in the biga" value="1.29 g" />
  </Ticket>
);

export const Minimal = () => (
  <Ticket>
    <TicketRow big label="Flour" value="645 g" />
    <TicketRow big label="Water" value="400 g" />
    <TicketRow label="Salt" value="18.1 g" />
  </Ticket>
);
