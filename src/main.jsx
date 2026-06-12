import "./storage-shim.js"; // DOIT être importé avant le composant (fournit window.storage)
import React from "react";
import { createRoot } from "react-dom/client";
import DoughControl from "./dough-control.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DoughControl />
  </React.StrictMode>
);
