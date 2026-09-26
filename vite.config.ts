import { defineConfig } from "vite";

// The production build is served at https://<user>.github.io/Hombre_de_vitruvio/,
// so assets there must be requested relative to that subpath. Local dev keeps
// serving from "/" so `npm run dev` at localhost is unaffected.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/Hombre_de_vitruvio/" : "/",
}));
