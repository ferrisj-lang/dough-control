import React from "react";
import { Tricolore, Ticket, TicketRow } from "dough-control";

export const Default = () => <Tricolore>Impasto napoletano</Tricolore>;

export const AsTicketFooter = () => (
  <Ticket>
    <TicketRow big label="Flour (Tipo 00 pizzeria)" value="645 g" />
    <TicketRow big label="Water (24 °C)" value="400 g" />
    <TicketRow label="Salt (2.8 %)" value="18.1 g" />
    <Tricolore>Impasto napoletano</Tricolore>
  </Ticket>
);

export const ShortLabel = () => <Tricolore>Vera pizza</Tricolore>;
