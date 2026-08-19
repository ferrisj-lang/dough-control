import React from "react";
import { Emblem, Checker } from "dough-control";

export const Default = () => <Emblem tagline="Gram-precise Neapolitan dough" />;

export const French = () => <Emblem tagline="Pâte napolitaine au gramme près" />;

export const NoTagline = () => <Emblem />;

export const StartScreenHeader = () => (
  <div style={{ textAlign: "center" }}>
    <Emblem tagline="Gram-precise Neapolitan dough" />
    <Checker style={{ marginTop: 18 }} />
  </div>
);
