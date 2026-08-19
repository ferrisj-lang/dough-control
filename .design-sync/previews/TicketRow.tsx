import React from "react";
import { Ticket, TicketRow } from "dough-control";

export const Emphasised = () => (
  <Ticket>
    <TicketRow big label="Flour (Tipo 00 pizzeria)" value="645 g" />
    <TicketRow big label="Water (24 °C)" value="400 g" />
  </Ticket>
);

export const Standard = () => (
  <Ticket>
    <TicketRow label="Salt (2.8 %)" value="18.1 g" />
    <TicketRow label="Fresh yeast (0.40 %)" value="2.58 g" />
    <TicketRow label="Hydration" value="62 %" />
  </Ticket>
);

export const Mixed = () => (
  <Ticket>
    <TicketRow big label="Flour" value="645 g" />
    <TicketRow big label="Water" value="400 g" />
    <TicketRow label="Salt" value="18.1 g" />
    <TicketRow label="Yeast" value="2.58 g" />
  </Ticket>
);
