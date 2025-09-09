import revisionInfo from "@macrostrat/revision-info-webpack";
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

function hyperStyles(): Plugin {
  return {
    name: "hyper-styles",
    enforce: "post",
    // Post-process the output to add the hyperStyled import
    transform(code, id) {
      const code1 = code.replace("export default", "const styles =");
      if (cssModuleMatcher.test(id)) {
        //const code2 = code1 + "\nexport default styles\n";
        const code3 = `import hyper from "@macrostrat/hyper";
        ${code1}
        let h = hyper.styled(styles);
        // Keep backwards compatibility with the existing default style object.
        Object.assign(h, styles);
        export default h;`;
        return code3;
      }
    },
  };
}

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
    noExternal: [
      /** All dependencies that cannot be bundled on the server (e.g., due to CSS imports)
       * should be listed here.
       */
      "@macrostrat/form-components",
      "@macrostrat/ui-components",
      "@macrostrat/data-components",
      "@macrostrat/map-interface",
    ],
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: "modern-compiler",
      },
    },
  },
});
