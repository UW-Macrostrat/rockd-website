// @ts-ignore
import revisionInfo from "@macrostrat/revision-info-webpack";
import hyperStyles from "@macrostrat/vite-plugin-hyperstyles";
import react from "@vitejs/plugin-react";
import path from "node:path";
import vike from "vike/plugin";
import { defineConfig } from "vite";
import pkg from "./package.json";

const macrostratPackages = Object.keys(pkg.dependencies).filter(
  (name: string) => name.startsWith("@macrostrat/")
);

const gitEnv = revisionInfo(
  pkg,
  "https://github.com/UW-Macrostrat/rockd-website"
);
// prefix with VITE_ to make available to client
for (const [key, value] of Object.entries(gitEnv)) {
  process.env["VITE_" + key] = value;
}

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve("./src"),
      "#": path.resolve("./pages"),
    },
    // `@macrostrat/scoped-store` holds module-level store isolations, so a second
    // copy reads as a missing provider; it is transitive, hence named here.
    dedupe: [
      "react",
      "react-dom",
      "@macrostrat/scoped-store",
      ...macrostratPackages,
    ],
  },
  plugins: [react(), hyperStyles(), vike()],
  ssr: {
    // Every `@macrostrat/*` package is bundled for SSR, not just the ones listed
    // as direct dependencies. A *transitive* one (e.g. `@macrostrat/scoped-store`,
    // pulled in by data-components / data-sheet / mapbox-react) would otherwise
    // stay external, and Node then require()s its ESM build from inside Vite's
    // SSR runner — which throws "Cannot require() ES Module ... in a cycle" and
    // takes down any server-rendered page that imports it.
    noExternal: [/^@macrostrat\//, "mapbox-gl"],
  },
  server: {
    port: 3005,
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: "modern-compiler",
      },
    },
  },
});
