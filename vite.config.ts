// @ts-ignore
import revisionInfo from "@macrostrat/revision-info-webpack";
import hyperStyles from "@macrostrat/vite-plugin-hyperstyles";
import react from "@vitejs/plugin-react";
import path from "node:path";
import vike from "vike/plugin";
import { defineConfig, Plugin } from "vite";
import pkg from "./package.json";

const aliasedModules = [
  "ui-components",
  "column-components",
  "api-types",
  "api-views",
  "column-views",
  "timescale",
  "map-interface",
  "mapbox-utils",
  "mapbox-react",
  "map-styles",
  "cesium-viewer",
  "map-components",
];

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
    dedupe: ["react", "react-dom", ...macrostratPackages],
  },
  plugins: [react(), hyperStyles(), vike()],
  ssr: {
    noExternal: [...macrostratPackages, "mapbox-gl"],
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: "modern-compiler",
      },
    },
  },
});
