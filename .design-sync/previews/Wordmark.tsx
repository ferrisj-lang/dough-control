import React from "react";
import { Wordmark, Chip } from "dough-control";

export const Default = () => <Wordmark />;

export const InWizardHeader = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <Wordmark />
    <div style={{ flex: 1 }} />
    <Chip sm>🌐 EN</Chip>
    <Chip sm>🇪🇺 °C/g</Chip>
  </div>
);

export const CustomText = () => <Wordmark>Impasto</Wordmark>;
