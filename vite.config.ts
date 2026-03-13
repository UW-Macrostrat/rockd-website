import revisionInfo from "@macrostrat/revision-info-webpack";
import hyperStyles from "@macrostrat/vite-plugin-hyperstyles";
import react from "@vitejs/plugin-react";
import path from "path";
import ssr from "vike/plugin";
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

// Check if we are building for server context

const cssModuleMatcher = /\.module\.(css|scss|sass|styl)$/;

export default defineConfig({
  //root: path.resolve("./src"),
  resolve: {
    conditions: ["source"],
    alias: {
      "~": path.resolve("./src"),
      "#": path.resolve("./pages"),
    },
    dedupe: [...aliasedModules.map((d) => "@macrostrat/" + d)],
  },
  plugins: [react(), hyperStyles(), ssr()],
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true,
  },
  ssr: {
    noExternal: macrostratPackages
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: "modern-compiler",
      },
    },
  },
});
