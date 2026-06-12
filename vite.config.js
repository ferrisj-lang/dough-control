import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" → le build fonctionne aussi bien sur un domaine racine (Vercel/Netlify)
// que sous un sous-chemin GitHub Pages (https://user.github.io/dough-control/).
export default defineConfig({
  plugins: [react()],
  base: "./",
});
