var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// vite.config.ts
import revisionInfo from "file:///root/rockd/web/node_modules/@macrostrat/revision-info-webpack/index.js";
import react from "file:///root/rockd/web/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import ssr from "file:///root/rockd/web/node_modules/vike/dist/esm/node/plugin/index.js";
import { defineConfig } from "file:///root/rockd/web/node_modules/vite/dist/node/index.js";
import cesium from "file:///root/rockd/web/node_modules/vite-plugin-cesium/dist/index.mjs";

// package.json
var package_default = {
  name: "@macrostrat/web",
  private: true,
  version: "2.2.3",
  description: "Macrostrat map interface",
  type: "module",
  scripts: {
    clean: "rm -rf dist/*",
    dev: "NODE_NO_WARNINGS=1 yarn run server:dev",
    build: "vite build",
    server: "tsx ./server/index.ts",
    "server:dev": "tsx --env-file=.env ./server/index.ts",
    format: "prettier --write src packages",
    "server:prod": "NODE_NO_WARNINGS=1 NODE_ENV=production yarn run server",
    start: "yarn run build && yarn run server",
    "test:runtime": "tsx tests/test-urls.ts",
    test: "vitest"
  },
  workspaces: [
    "packages/*"
  ],
  authors: [
    "David Sklar <dsklar@wisc.edu>"
  ],
  license: "MIT",
  devDependencies: {
    "@babel/core": "^7.19.6",
    "@babel/preset-env": "^7.19.4",
    "@babel/preset-typescript": "^7.18.6",
    "@macrostrat/revision-info-webpack": "^1.0.0",
    "@mdx-js/rollup": "^2.3.0",
    "@types/esprima": "^4",
    "@types/underscore": "^1",
    "@typescript-eslint/eslint-plugin": "^6.3.0",
    "@typescript-eslint/parser": "^6.3.0",
    "@yarnpkg/sdks": "^3.1.0",
    "eslint-plugin-react-hooks": "^4.6.2",
    prettier: "^2.7.1",
    sass: "^1.49.0",
    stylus: "^0.55.0",
    typescript: "^5.1.6",
    "vite-plugin-rewrite-all": "^1.0.1",
    vitest: "^1.6.0"
  },
  dependencies: {
    "@blueprintjs/core": "^5.10.2",
    "@blueprintjs/table": "^5.1.4",
    "@loadable/component": "^5.14.1",
    "@macrostrat-web/map-utils": "workspace:*",
    "@macrostrat-web/qgis-integration": "workspace:*",
    "@macrostrat-web/security": "workspace:*",
    "@macrostrat-web/settings": "workspace:*",
    "@macrostrat-web/text-toolchain": "workspace:*",
    "@macrostrat-web/utility-functions": "workspace:*",
    "@macrostrat/color-utils": "^1.0.0",
    "@macrostrat/corelle": "^2.0.1",
    "@macrostrat/data-components": "latest",
    "@macrostrat/form-components": "^0.1.2",
    "@macrostrat/hyper": "^3.0.6",
    "@macrostrat/map-interface": "^1.2.2",
    "@macrostrat/map-styles": "^1.1.1",
    "@macrostrat/mapbox-react": "^2.5.0",
    "@macrostrat/mapbox-utils": "^1.4.0",
    "@macrostrat/style-system": "^0.2.0",
    "@macrostrat/ui-components": "^4.1.2",
    "@supabase/postgrest-js": "^1.11.0",
    "@universal-middleware/express": "^0.0.2",
    "@vitejs/plugin-react": "^4.0.4",
    cesium: "^1.126.0",
    "chroma-js": "^2.4.2",
    classnames: "^2.2.6",
    compression: "^1.7.4",
    "cookie-parser": "^1.4.6",
    express: "^4.18.2",
    "hex-to-css-filter": "^5.4.0",
    jose: "^5.1.2",
    "mapbox-gl": "^2.15.0",
    "new-github-issue-url": "^1.0.0",
    react: "^18.3.0",
    "react-cookie": "^3.0.4",
    "react-datepicker": "^7.5.0",
    "react-dom": "^18.3.0",
    "react-intersection-observer": "^9.4.3",
    "react-redux": "^7.2.0",
    "react-router": "^6.8.2",
    "react-router-dom": "^6.8.2",
    "react-router-hash-link": "^2.4.3",
    "react-spring": "^9.7.3",
    recharts: "^2.13.0",
    redux: "^4.0.5",
    sirv: "^2.0.3",
    "transition-hook": "^1.5.2",
    tsx: "^4.11.2",
    vike: "^0.4.177",
    "vike-react": "^0.4.15",
    vite: "^5.3.2",
    "vite-plugin-cesium": "^1.2.22",
    zustand: "^4.5.1"
  },
  resolutions: {
    cesium: "^1.123.1",
    "resium:": "1.17.1"
  },
  prettier: {
    proseWrap: "always"
  },
  packageManager: "yarn@4.3.1"
};

// packages/text-toolchain/src/index.ts
import mdx from "file:///root/rockd/web/node_modules/@mdx-js/rollup/index.js";
import wikiLinks from "file:///root/rockd/web/node_modules/remark-wiki-link/dist/index.cjs.js";
import frontmatter from "file:///root/rockd/web/node_modules/remark-frontmatter/index.js";
import slugify2 from "file:///root/rockd/web/node_modules/@sindresorhus/slugify/index.js";
import { join as join2 } from "path";

// packages/text-toolchain/src/utils.ts
import matter from "file:///root/rockd/web/node_modules/gray-matter/index.js";
import { readFileSync } from "fs";
import slugify from "file:///root/rockd/web/node_modules/@sindresorhus/slugify/index.js";
import { globSync } from "file:///root/rockd/web/node_modules/glob/dist/esm/index.js";
import { join } from "path";
function buildPageIndex(contentDir, prefix = "/") {
  const globPath = join(contentDir, "**/*.md");
  const replacePattern = new RegExp(`^${contentDir}/`);
  const files = globSync(globPath);
  let pageIndex = {};
  let permalinkIndex = {};
  for (const path2 of files) {
    const content = readFileSync(path2, "utf8");
    const { data = {} } = matter(content);
    const newPath = path2.replace(replacePattern, "");
    if (newPath.startsWith("__drafts__")) {
      continue;
    }
    let sluggedPath = join(prefix, slugifyPath(newPath, data));
    const lastPart = newPath.split("/").pop();
    if (lastPart == null) continue;
    const name = lastPart.split(".")[0];
    const title = data.title ?? name;
    permalinkIndex[sluggedPath] = { contentFile: newPath, title };
    const pathWithoutExt = newPath.split(".")[0];
    pageIndex[pathWithoutExt] = [sluggedPath];
    if (lastPart && pageIndex[name] == null) {
      pageIndex[name] = [sluggedPath];
    }
  }
  return [pageIndex, permalinkIndex];
}
function slugifyPath(path2, frontmatter2) {
  const pathTokens = path2.split("/");
  const fileName = pathTokens.pop();
  const fileBase = fileName?.split(".")[0] || "";
  const defaultSlug = slugify(fileBase, { lowercase: true });
  const { permalink, slug } = frontmatter2;
  const fileSlug = permalink ?? slug ?? defaultSlug;
  let tokens = pathTokens.map((token) => slugify(token));
  if (fileSlug != "" && fileSlug != "index") {
    tokens.push(fileSlug);
  }
  let urlPath = tokens.join("/");
  return urlPath;
}

// packages/text-toolchain/src/index.ts
function viteTextToolchain({
  contentDir,
  wikiPrefix = "/"
}) {
  const [pageIndex, permalinkIndex] = buildPageIndex(contentDir, wikiPrefix);
  const permalinks = Object.keys(permalinkIndex);
  const include = [join2(contentDir, "**/*.md"), "**/*.mdx"];
  return mdx({
    remarkPlugins: [
      [
        wikiLinks,
        {
          pageResolver: (name) => pageIndex[name] || [
            slugify2(name, { separator: "-", lowercase: true })
          ],
          permalinks,
          hrefTemplate: (permalink) => `${permalink}`,
          aliasDivider: "|",
          wikiLinkClassName: "internal-link",
          newClassName: "not-created-yet"
        }
      ],
      [frontmatter, { type: "yaml", marker: "-" }]
    ],
    include,
    // Treat all .md files as MDX
    mdxExtensions: [".mdx", ".md"],
    mdExtensions: []
  });
}

// vite.config.ts
var __vite_injected_original_dirname = "/root/rockd/web";
var aliasedModules = [
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
  "map-components"
];
var gitEnv = revisionInfo(package_default, "https://github.com/UW-Macrostrat/web");
for (const [key, value] of Object.entries(gitEnv)) {
  process.env["VITE_" + key] = value;
}
var cesiumRoot = __require.resolve("cesium").replace("/index.cjs", "/Build");
var cesiumBuildPath = path.resolve(cesiumRoot, "Cesium");
var cssModuleMatcher = /\.module\.(css|scss|sass|styl)$/;
function hyperStyles() {
  return {
    name: "hyper-styles",
    enforce: "post",
    // Post-process the output to add the hyperStyled import
    transform(code, id) {
      const code1 = code.replace("export default", "const styles =");
      if (cssModuleMatcher.test(id)) {
        const code3 = `import hyper from "@macrostrat/hyper";
        ${code1}
        let h = hyper.styled(styles);
        // Keep backwards compatibility with the existing default style object.
        Object.assign(h, styles);
        export default h;`;
        return code3;
      }
    }
  };
}
var vite_config_default = defineConfig({
  //root: path.resolve("./src"),
  resolve: {
    conditions: ["source"],
    alias: {
      "~": path.resolve("./src"),
      "#": path.resolve("./pages")
    },
    dedupe: [...aliasedModules.map((d) => "@macrostrat/" + d)]
  },
  plugins: [
    react(),
    viteTextToolchain({
      contentDir: path.resolve(__vite_injected_original_dirname, "content"),
      wikiPrefix: "/dev/docs"
    }),
    /* Fix error with single-page app reloading where paths
    with dots (e.g., locations) are not rewritten to index
    to allow for client-side routing */
    //rewriteAll(),
    cesium({
      cesiumBuildPath,
      cesiumBuildRootPath: cesiumRoot
    }),
    hyperStyles(),
    ssr()
  ],
  envDir: path.resolve(__vite_injected_original_dirname),
  build: {
    outDir: path.resolve(__vite_injected_original_dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true
  },
  define: {
    // Cesium base URL
    CESIUM_BASE_URL: JSON.stringify("/cesium")
    // If not building for server context
  },
  ssr: {
    noExternal: [
      /** All dependencies that cannot be bundled on the server (e.g., due to CSS imports)
       * should be listed here.
       */
      "@macrostrat/form-components",
      "@macrostrat/ui-components",
      "@macrostrat/column-components",
      "@macrostrat/column-views",
      "@macrostrat/data-components",
      "@macrostrat/map-interface"
    ]
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: "modern-compiler"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIiwgInBhY2thZ2VzL3RleHQtdG9vbGNoYWluL3NyYy9pbmRleC50cyIsICJwYWNrYWdlcy90ZXh0LXRvb2xjaGFpbi9zcmMvdXRpbHMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvcm9vdC9yb2NrZC93ZWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9yb290L3JvY2tkL3dlYi92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vcm9vdC9yb2NrZC93ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcmV2aXNpb25JbmZvIGZyb20gXCJAbWFjcm9zdHJhdC9yZXZpc2lvbi1pbmZvLXdlYnBhY2tcIjtcbmltcG9ydCBtZHggZnJvbSBcIkBtZHgtanMvcm9sbHVwXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHNzciBmcm9tIFwidmlrZS9wbHVnaW5cIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgUGx1Z2luIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCBjZXNpdW0gZnJvbSBcInZpdGUtcGx1Z2luLWNlc2l1bVwiO1xuaW1wb3J0IHBrZyBmcm9tIFwiLi9wYWNrYWdlLmpzb25cIjtcblxuLy8gTm9uLXRyYW5zcGlsZWQgdHlwZXNjcmlwdCBjYW4ndCBiZSBpbXBvcnRlZCBhcyBhIHN0YW5kYWxvbmUgcGFja2FnZVxuaW1wb3J0IHRleHRUb29sY2hhaW4gZnJvbSBcIi4vcGFja2FnZXMvdGV4dC10b29sY2hhaW4vc3JjXCI7XG5cbmNvbnN0IGFsaWFzZWRNb2R1bGVzID0gW1xuICBcInVpLWNvbXBvbmVudHNcIixcbiAgXCJjb2x1bW4tY29tcG9uZW50c1wiLFxuICBcImFwaS10eXBlc1wiLFxuICBcImFwaS12aWV3c1wiLFxuICBcImNvbHVtbi12aWV3c1wiLFxuICBcInRpbWVzY2FsZVwiLFxuICBcIm1hcC1pbnRlcmZhY2VcIixcbiAgXCJtYXBib3gtdXRpbHNcIixcbiAgXCJtYXBib3gtcmVhY3RcIixcbiAgXCJtYXAtc3R5bGVzXCIsXG4gIFwiY2VzaXVtLXZpZXdlclwiLFxuICBcIm1hcC1jb21wb25lbnRzXCIsXG5dO1xuXG5jb25zdCBnaXRFbnYgPSByZXZpc2lvbkluZm8ocGtnLCBcImh0dHBzOi8vZ2l0aHViLmNvbS9VVy1NYWNyb3N0cmF0L3dlYlwiKTtcbi8vIHByZWZpeCB3aXRoIFZJVEVfIHRvIG1ha2UgYXZhaWxhYmxlIHRvIGNsaWVudFxuZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZ2l0RW52KSkge1xuICBwcm9jZXNzLmVudltcIlZJVEVfXCIgKyBrZXldID0gdmFsdWU7XG59XG5cbmNvbnN0IGNlc2l1bVJvb3QgPSByZXF1aXJlLnJlc29sdmUoXCJjZXNpdW1cIikucmVwbGFjZShcIi9pbmRleC5janNcIiwgXCIvQnVpbGRcIik7XG5jb25zdCBjZXNpdW1CdWlsZFBhdGggPSBwYXRoLnJlc29sdmUoY2VzaXVtUm9vdCwgXCJDZXNpdW1cIik7XG5cbi8vIENoZWNrIGlmIHdlIGFyZSBidWlsZGluZyBmb3Igc2VydmVyIGNvbnRleHRcblxuY29uc3QgY3NzTW9kdWxlTWF0Y2hlciA9IC9cXC5tb2R1bGVcXC4oY3NzfHNjc3N8c2Fzc3xzdHlsKSQvO1xuXG5mdW5jdGlvbiBoeXBlclN0eWxlcygpOiBQbHVnaW4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6IFwiaHlwZXItc3R5bGVzXCIsXG4gICAgZW5mb3JjZTogXCJwb3N0XCIsXG4gICAgLy8gUG9zdC1wcm9jZXNzIHRoZSBvdXRwdXQgdG8gYWRkIHRoZSBoeXBlclN0eWxlZCBpbXBvcnRcbiAgICB0cmFuc2Zvcm0oY29kZSwgaWQpIHtcbiAgICAgIGNvbnN0IGNvZGUxID0gY29kZS5yZXBsYWNlKFwiZXhwb3J0IGRlZmF1bHRcIiwgXCJjb25zdCBzdHlsZXMgPVwiKTtcbiAgICAgIGlmIChjc3NNb2R1bGVNYXRjaGVyLnRlc3QoaWQpKSB7XG4gICAgICAgIC8vY29uc3QgY29kZTIgPSBjb2RlMSArIFwiXFxuZXhwb3J0IGRlZmF1bHQgc3R5bGVzXFxuXCI7XG4gICAgICAgIGNvbnN0IGNvZGUzID0gYGltcG9ydCBoeXBlciBmcm9tIFwiQG1hY3Jvc3RyYXQvaHlwZXJcIjtcbiAgICAgICAgJHtjb2RlMX1cbiAgICAgICAgbGV0IGggPSBoeXBlci5zdHlsZWQoc3R5bGVzKTtcbiAgICAgICAgLy8gS2VlcCBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB3aXRoIHRoZSBleGlzdGluZyBkZWZhdWx0IHN0eWxlIG9iamVjdC5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihoLCBzdHlsZXMpO1xuICAgICAgICBleHBvcnQgZGVmYXVsdCBoO2A7XG4gICAgICAgIHJldHVybiBjb2RlMztcbiAgICAgIH1cbiAgICB9LFxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAvL3Jvb3Q6IHBhdGgucmVzb2x2ZShcIi4vc3JjXCIpLFxuICByZXNvbHZlOiB7XG4gICAgY29uZGl0aW9uczogW1wic291cmNlXCJdLFxuICAgIGFsaWFzOiB7XG4gICAgICBcIn5cIjogcGF0aC5yZXNvbHZlKFwiLi9zcmNcIiksXG4gICAgICBcIiNcIjogcGF0aC5yZXNvbHZlKFwiLi9wYWdlc1wiKSxcbiAgICB9LFxuICAgIGRlZHVwZTogWy4uLmFsaWFzZWRNb2R1bGVzLm1hcCgoZCkgPT4gXCJAbWFjcm9zdHJhdC9cIiArIGQpXSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgdGV4dFRvb2xjaGFpbih7XG4gICAgICBjb250ZW50RGlyOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcImNvbnRlbnRcIiksXG4gICAgICB3aWtpUHJlZml4OiBcIi9kZXYvZG9jc1wiLFxuICAgIH0pLFxuICAgIC8qIEZpeCBlcnJvciB3aXRoIHNpbmdsZS1wYWdlIGFwcCByZWxvYWRpbmcgd2hlcmUgcGF0aHNcbiAgICB3aXRoIGRvdHMgKGUuZy4sIGxvY2F0aW9ucykgYXJlIG5vdCByZXdyaXR0ZW4gdG8gaW5kZXhcbiAgICB0byBhbGxvdyBmb3IgY2xpZW50LXNpZGUgcm91dGluZyAqL1xuICAgIC8vcmV3cml0ZUFsbCgpLFxuICAgIGNlc2l1bSh7XG4gICAgICBjZXNpdW1CdWlsZFBhdGgsXG4gICAgICBjZXNpdW1CdWlsZFJvb3RQYXRoOiBjZXNpdW1Sb290LFxuICAgIH0pLFxuICAgIGh5cGVyU3R5bGVzKCksXG4gICAgc3NyKCksXG4gIF0sXG4gIGVudkRpcjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSksXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcImRpc3RcIiksXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICB9LFxuICBkZWZpbmU6IHtcbiAgICAvLyBDZXNpdW0gYmFzZSBVUkxcbiAgICBDRVNJVU1fQkFTRV9VUkw6IEpTT04uc3RyaW5naWZ5KFwiL2Nlc2l1bVwiKSxcbiAgICAvLyBJZiBub3QgYnVpbGRpbmcgZm9yIHNlcnZlciBjb250ZXh0XG4gIH0sXG4gIHNzcjoge1xuICAgIG5vRXh0ZXJuYWw6IFtcbiAgICAgIC8qKiBBbGwgZGVwZW5kZW5jaWVzIHRoYXQgY2Fubm90IGJlIGJ1bmRsZWQgb24gdGhlIHNlcnZlciAoZS5nLiwgZHVlIHRvIENTUyBpbXBvcnRzKVxuICAgICAgICogc2hvdWxkIGJlIGxpc3RlZCBoZXJlLlxuICAgICAgICovXG4gICAgICBcIkBtYWNyb3N0cmF0L2Zvcm0tY29tcG9uZW50c1wiLFxuICAgICAgXCJAbWFjcm9zdHJhdC91aS1jb21wb25lbnRzXCIsXG4gICAgICBcIkBtYWNyb3N0cmF0L2NvbHVtbi1jb21wb25lbnRzXCIsXG4gICAgICBcIkBtYWNyb3N0cmF0L2NvbHVtbi12aWV3c1wiLFxuICAgICAgXCJAbWFjcm9zdHJhdC9kYXRhLWNvbXBvbmVudHNcIixcbiAgICAgIFwiQG1hY3Jvc3RyYXQvbWFwLWludGVyZmFjZVwiLFxuICAgIF0sXG4gIH0sXG4gIGNzczoge1xuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgIHNhc3M6IHtcbiAgICAgICAgYXBpOiBcIm1vZGVybi1jb21waWxlclwiLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iLCAie1xuICBcIm5hbWVcIjogXCJAbWFjcm9zdHJhdC93ZWJcIixcbiAgXCJwcml2YXRlXCI6IHRydWUsXG4gIFwidmVyc2lvblwiOiBcIjIuMi4zXCIsXG4gIFwiZGVzY3JpcHRpb25cIjogXCJNYWNyb3N0cmF0IG1hcCBpbnRlcmZhY2VcIixcbiAgXCJ0eXBlXCI6IFwibW9kdWxlXCIsXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJjbGVhblwiOiBcInJtIC1yZiBkaXN0LypcIixcbiAgICBcImRldlwiOiBcIk5PREVfTk9fV0FSTklOR1M9MSB5YXJuIHJ1biBzZXJ2ZXI6ZGV2XCIsXG4gICAgXCJidWlsZFwiOiBcInZpdGUgYnVpbGRcIixcbiAgICBcInNlcnZlclwiOiBcInRzeCAuL3NlcnZlci9pbmRleC50c1wiLFxuICAgIFwic2VydmVyOmRldlwiOiBcInRzeCAtLWVudi1maWxlPS5lbnYgLi9zZXJ2ZXIvaW5kZXgudHNcIixcbiAgICBcImZvcm1hdFwiOiBcInByZXR0aWVyIC0td3JpdGUgc3JjIHBhY2thZ2VzXCIsXG4gICAgXCJzZXJ2ZXI6cHJvZFwiOiBcIk5PREVfTk9fV0FSTklOR1M9MSBOT0RFX0VOVj1wcm9kdWN0aW9uIHlhcm4gcnVuIHNlcnZlclwiLFxuICAgIFwic3RhcnRcIjogXCJ5YXJuIHJ1biBidWlsZCAmJiB5YXJuIHJ1biBzZXJ2ZXJcIixcbiAgICBcInRlc3Q6cnVudGltZVwiOiBcInRzeCB0ZXN0cy90ZXN0LXVybHMudHNcIixcbiAgICBcInRlc3RcIjogXCJ2aXRlc3RcIlxuICB9LFxuICBcIndvcmtzcGFjZXNcIjogW1xuICAgIFwicGFja2FnZXMvKlwiXG4gIF0sXG4gIFwiYXV0aG9yc1wiOiBbXG4gICAgXCJEYXZpZCBTa2xhciA8ZHNrbGFyQHdpc2MuZWR1PlwiXG4gIF0sXG4gIFwibGljZW5zZVwiOiBcIk1JVFwiLFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJAYmFiZWwvY29yZVwiOiBcIl43LjE5LjZcIixcbiAgICBcIkBiYWJlbC9wcmVzZXQtZW52XCI6IFwiXjcuMTkuNFwiLFxuICAgIFwiQGJhYmVsL3ByZXNldC10eXBlc2NyaXB0XCI6IFwiXjcuMTguNlwiLFxuICAgIFwiQG1hY3Jvc3RyYXQvcmV2aXNpb24taW5mby13ZWJwYWNrXCI6IFwiXjEuMC4wXCIsXG4gICAgXCJAbWR4LWpzL3JvbGx1cFwiOiBcIl4yLjMuMFwiLFxuICAgIFwiQHR5cGVzL2VzcHJpbWFcIjogXCJeNFwiLFxuICAgIFwiQHR5cGVzL3VuZGVyc2NvcmVcIjogXCJeMVwiLFxuICAgIFwiQHR5cGVzY3JpcHQtZXNsaW50L2VzbGludC1wbHVnaW5cIjogXCJeNi4zLjBcIixcbiAgICBcIkB0eXBlc2NyaXB0LWVzbGludC9wYXJzZXJcIjogXCJeNi4zLjBcIixcbiAgICBcIkB5YXJucGtnL3Nka3NcIjogXCJeMy4xLjBcIixcbiAgICBcImVzbGludC1wbHVnaW4tcmVhY3QtaG9va3NcIjogXCJeNC42LjJcIixcbiAgICBcInByZXR0aWVyXCI6IFwiXjIuNy4xXCIsXG4gICAgXCJzYXNzXCI6IFwiXjEuNDkuMFwiLFxuICAgIFwic3R5bHVzXCI6IFwiXjAuNTUuMFwiLFxuICAgIFwidHlwZXNjcmlwdFwiOiBcIl41LjEuNlwiLFxuICAgIFwidml0ZS1wbHVnaW4tcmV3cml0ZS1hbGxcIjogXCJeMS4wLjFcIixcbiAgICBcInZpdGVzdFwiOiBcIl4xLjYuMFwiXG4gIH0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkBibHVlcHJpbnRqcy9jb3JlXCI6IFwiXjUuMTAuMlwiLFxuICAgIFwiQGJsdWVwcmludGpzL3RhYmxlXCI6IFwiXjUuMS40XCIsXG4gICAgXCJAbG9hZGFibGUvY29tcG9uZW50XCI6IFwiXjUuMTQuMVwiLFxuICAgIFwiQG1hY3Jvc3RyYXQtd2ViL21hcC11dGlsc1wiOiBcIndvcmtzcGFjZToqXCIsXG4gICAgXCJAbWFjcm9zdHJhdC13ZWIvcWdpcy1pbnRlZ3JhdGlvblwiOiBcIndvcmtzcGFjZToqXCIsXG4gICAgXCJAbWFjcm9zdHJhdC13ZWIvc2VjdXJpdHlcIjogXCJ3b3Jrc3BhY2U6KlwiLFxuICAgIFwiQG1hY3Jvc3RyYXQtd2ViL3NldHRpbmdzXCI6IFwid29ya3NwYWNlOipcIixcbiAgICBcIkBtYWNyb3N0cmF0LXdlYi90ZXh0LXRvb2xjaGFpblwiOiBcIndvcmtzcGFjZToqXCIsXG4gICAgXCJAbWFjcm9zdHJhdC13ZWIvdXRpbGl0eS1mdW5jdGlvbnNcIjogXCJ3b3Jrc3BhY2U6KlwiLFxuICAgIFwiQG1hY3Jvc3RyYXQvY29sb3ItdXRpbHNcIjogXCJeMS4wLjBcIixcbiAgICBcIkBtYWNyb3N0cmF0L2NvcmVsbGVcIjogXCJeMi4wLjFcIixcbiAgICBcIkBtYWNyb3N0cmF0L2RhdGEtY29tcG9uZW50c1wiOiBcImxhdGVzdFwiLFxuICAgIFwiQG1hY3Jvc3RyYXQvZm9ybS1jb21wb25lbnRzXCI6IFwiXjAuMS4yXCIsXG4gICAgXCJAbWFjcm9zdHJhdC9oeXBlclwiOiBcIl4zLjAuNlwiLFxuICAgIFwiQG1hY3Jvc3RyYXQvbWFwLWludGVyZmFjZVwiOiBcIl4xLjIuMlwiLFxuICAgIFwiQG1hY3Jvc3RyYXQvbWFwLXN0eWxlc1wiOiBcIl4xLjEuMVwiLFxuICAgIFwiQG1hY3Jvc3RyYXQvbWFwYm94LXJlYWN0XCI6IFwiXjIuNS4wXCIsXG4gICAgXCJAbWFjcm9zdHJhdC9tYXBib3gtdXRpbHNcIjogXCJeMS40LjBcIixcbiAgICBcIkBtYWNyb3N0cmF0L3N0eWxlLXN5c3RlbVwiOiBcIl4wLjIuMFwiLFxuICAgIFwiQG1hY3Jvc3RyYXQvdWktY29tcG9uZW50c1wiOiBcIl40LjEuMlwiLFxuICAgIFwiQHN1cGFiYXNlL3Bvc3RncmVzdC1qc1wiOiBcIl4xLjExLjBcIixcbiAgICBcIkB1bml2ZXJzYWwtbWlkZGxld2FyZS9leHByZXNzXCI6IFwiXjAuMC4yXCIsXG4gICAgXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiOiBcIl40LjAuNFwiLFxuICAgIFwiY2VzaXVtXCI6IFwiXjEuMTI2LjBcIixcbiAgICBcImNocm9tYS1qc1wiOiBcIl4yLjQuMlwiLFxuICAgIFwiY2xhc3NuYW1lc1wiOiBcIl4yLjIuNlwiLFxuICAgIFwiY29tcHJlc3Npb25cIjogXCJeMS43LjRcIixcbiAgICBcImNvb2tpZS1wYXJzZXJcIjogXCJeMS40LjZcIixcbiAgICBcImV4cHJlc3NcIjogXCJeNC4xOC4yXCIsXG4gICAgXCJoZXgtdG8tY3NzLWZpbHRlclwiOiBcIl41LjQuMFwiLFxuICAgIFwiam9zZVwiOiBcIl41LjEuMlwiLFxuICAgIFwibWFwYm94LWdsXCI6IFwiXjIuMTUuMFwiLFxuICAgIFwibmV3LWdpdGh1Yi1pc3N1ZS11cmxcIjogXCJeMS4wLjBcIixcbiAgICBcInJlYWN0XCI6IFwiXjE4LjMuMFwiLFxuICAgIFwicmVhY3QtY29va2llXCI6IFwiXjMuMC40XCIsXG4gICAgXCJyZWFjdC1kYXRlcGlja2VyXCI6IFwiXjcuNS4wXCIsXG4gICAgXCJyZWFjdC1kb21cIjogXCJeMTguMy4wXCIsXG4gICAgXCJyZWFjdC1pbnRlcnNlY3Rpb24tb2JzZXJ2ZXJcIjogXCJeOS40LjNcIixcbiAgICBcInJlYWN0LXJlZHV4XCI6IFwiXjcuMi4wXCIsXG4gICAgXCJyZWFjdC1yb3V0ZXJcIjogXCJeNi44LjJcIixcbiAgICBcInJlYWN0LXJvdXRlci1kb21cIjogXCJeNi44LjJcIixcbiAgICBcInJlYWN0LXJvdXRlci1oYXNoLWxpbmtcIjogXCJeMi40LjNcIixcbiAgICBcInJlYWN0LXNwcmluZ1wiOiBcIl45LjcuM1wiLFxuICAgIFwicmVjaGFydHNcIjogXCJeMi4xMy4wXCIsXG4gICAgXCJyZWR1eFwiOiBcIl40LjAuNVwiLFxuICAgIFwic2lydlwiOiBcIl4yLjAuM1wiLFxuICAgIFwidHJhbnNpdGlvbi1ob29rXCI6IFwiXjEuNS4yXCIsXG4gICAgXCJ0c3hcIjogXCJeNC4xMS4yXCIsXG4gICAgXCJ2aWtlXCI6IFwiXjAuNC4xNzdcIixcbiAgICBcInZpa2UtcmVhY3RcIjogXCJeMC40LjE1XCIsXG4gICAgXCJ2aXRlXCI6IFwiXjUuMy4yXCIsXG4gICAgXCJ2aXRlLXBsdWdpbi1jZXNpdW1cIjogXCJeMS4yLjIyXCIsXG4gICAgXCJ6dXN0YW5kXCI6IFwiXjQuNS4xXCJcbiAgfSxcbiAgXCJyZXNvbHV0aW9uc1wiOiB7XG4gICAgXCJjZXNpdW1cIjogXCJeMS4xMjMuMVwiLFxuICAgIFwicmVzaXVtOlwiOiBcIjEuMTcuMVwiXG4gIH0sXG4gIFwicHJldHRpZXJcIjoge1xuICAgIFwicHJvc2VXcmFwXCI6IFwiYWx3YXlzXCJcbiAgfSxcbiAgXCJwYWNrYWdlTWFuYWdlclwiOiBcInlhcm5ANC4zLjFcIlxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvcm9vdC9yb2NrZC93ZWIvcGFja2FnZXMvdGV4dC10b29sY2hhaW4vc3JjXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvcm9vdC9yb2NrZC93ZWIvcGFja2FnZXMvdGV4dC10b29sY2hhaW4vc3JjL2luZGV4LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9yb290L3JvY2tkL3dlYi9wYWNrYWdlcy90ZXh0LXRvb2xjaGFpbi9zcmMvaW5kZXgudHNcIjtpbXBvcnQgbWR4IGZyb20gXCJAbWR4LWpzL3JvbGx1cFwiO1xuaW1wb3J0IHdpa2lMaW5rcyBmcm9tIFwicmVtYXJrLXdpa2ktbGlua1wiO1xuaW1wb3J0IGZyb250bWF0dGVyIGZyb20gXCJyZW1hcmstZnJvbnRtYXR0ZXJcIjtcbmltcG9ydCBzbHVnaWZ5IGZyb20gXCJAc2luZHJlc29yaHVzL3NsdWdpZnlcIjtcbmltcG9ydCB7IGpvaW4gfSBmcm9tIFwicGF0aFwiO1xuXG5pbXBvcnQgeyBidWlsZFBhZ2VJbmRleCB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmV4cG9ydCB7IGJ1aWxkUGFnZUluZGV4IH07XG5cbmludGVyZmFjZSBUZXh0VG9vbENoYWluT3B0aW9ucyB7XG4gIGNvbnRlbnREaXI6IHN0cmluZztcbiAgd2lraVByZWZpeD86IHN0cmluZztcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdml0ZVRleHRUb29sY2hhaW4oe1xuICBjb250ZW50RGlyLFxuICB3aWtpUHJlZml4ID0gXCIvXCIsXG59OiBUZXh0VG9vbENoYWluT3B0aW9ucykge1xuICBjb25zdCBbcGFnZUluZGV4LCBwZXJtYWxpbmtJbmRleF0gPSBidWlsZFBhZ2VJbmRleChjb250ZW50RGlyLCB3aWtpUHJlZml4KTtcbiAgY29uc3QgcGVybWFsaW5rcyA9IE9iamVjdC5rZXlzKHBlcm1hbGlua0luZGV4KTtcblxuICBjb25zdCBpbmNsdWRlID0gW2pvaW4oY29udGVudERpciwgXCIqKi8qLm1kXCIpLCBcIioqLyoubWR4XCJdO1xuXG4gIHJldHVybiBtZHgoe1xuICAgIHJlbWFya1BsdWdpbnM6IFtcbiAgICAgIFtcbiAgICAgICAgd2lraUxpbmtzLFxuICAgICAgICB7XG4gICAgICAgICAgcGFnZVJlc29sdmVyOiAobmFtZTogc3RyaW5nKSA9PlxuICAgICAgICAgICAgcGFnZUluZGV4W25hbWVdIHx8IFtcbiAgICAgICAgICAgICAgc2x1Z2lmeShuYW1lLCB7IHNlcGFyYXRvcjogXCItXCIsIGxvd2VyY2FzZTogdHJ1ZSB9KSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgcGVybWFsaW5rcyxcbiAgICAgICAgICBocmVmVGVtcGxhdGU6IChwZXJtYWxpbms6IHN0cmluZykgPT4gYCR7cGVybWFsaW5rfWAsXG4gICAgICAgICAgYWxpYXNEaXZpZGVyOiBcInxcIixcbiAgICAgICAgICB3aWtpTGlua0NsYXNzTmFtZTogXCJpbnRlcm5hbC1saW5rXCIsXG4gICAgICAgICAgbmV3Q2xhc3NOYW1lOiBcIm5vdC1jcmVhdGVkLXlldFwiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIFtmcm9udG1hdHRlciwgeyB0eXBlOiBcInlhbWxcIiwgbWFya2VyOiBcIi1cIiB9XSxcbiAgICBdLFxuICAgIGluY2x1ZGUsXG4gICAgLy8gVHJlYXQgYWxsIC5tZCBmaWxlcyBhcyBNRFhcbiAgICBtZHhFeHRlbnNpb25zOiBbXCIubWR4XCIsIFwiLm1kXCJdLFxuICAgIG1kRXh0ZW5zaW9uczogW10sXG4gIH0pO1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvcm9vdC9yb2NrZC93ZWIvcGFja2FnZXMvdGV4dC10b29sY2hhaW4vc3JjXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvcm9vdC9yb2NrZC93ZWIvcGFja2FnZXMvdGV4dC10b29sY2hhaW4vc3JjL3V0aWxzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9yb290L3JvY2tkL3dlYi9wYWNrYWdlcy90ZXh0LXRvb2xjaGFpbi9zcmMvdXRpbHMudHNcIjtpbXBvcnQgbWF0dGVyIGZyb20gXCJncmF5LW1hdHRlclwiO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgc2x1Z2lmeSBmcm9tIFwiQHNpbmRyZXNvcmh1cy9zbHVnaWZ5XCI7XG5pbXBvcnQgeyBnbG9iU3luYyB9IGZyb20gXCJnbG9iXCI7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSBcInBhdGhcIjtcblxuZXhwb3J0IHR5cGUgUGFnZUluZGV4ID0geyBbazogc3RyaW5nXTogc3RyaW5nW10gfTtcbmV4cG9ydCB0eXBlIFBlcm1hbGlua0luZGV4ID0ge1xuICBbazogc3RyaW5nXTogeyBjb250ZW50RmlsZTogc3RyaW5nOyB0aXRsZTogc3RyaW5nIH07XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRQYWdlSW5kZXgoXG4gIGNvbnRlbnREaXI6IHN0cmluZyxcbiAgcHJlZml4OiBzdHJpbmcgPSBcIi9cIlxuKTogW1BhZ2VJbmRleCwgUGVybWFsaW5rSW5kZXhdIHtcbiAgLy8gV2FsayB0aGUgdHJlZSBhbmQgZ2VuZXJhdGUgcGVybWFsaW5rcyBmb3IgZWFjaCBwYWdlXG4gIC8vIEFsd2F5cyBoYXBwZW5zIG9uIHRoZSBzZXJ2ZXIgc2lkZS5cblxuICBjb25zdCBnbG9iUGF0aCA9IGpvaW4oY29udGVudERpciwgXCIqKi8qLm1kXCIpO1xuICBjb25zdCByZXBsYWNlUGF0dGVybiA9IG5ldyBSZWdFeHAoYF4ke2NvbnRlbnREaXJ9L2ApO1xuXG4gIGNvbnN0IGZpbGVzID0gZ2xvYlN5bmMoZ2xvYlBhdGgpO1xuICBsZXQgcGFnZUluZGV4OiBQYWdlSW5kZXggPSB7fTtcbiAgbGV0IHBlcm1hbGlua0luZGV4OiBQZXJtYWxpbmtJbmRleCA9IHt9O1xuXG4gIGZvciAoY29uc3QgcGF0aCBvZiBmaWxlcykge1xuICAgIC8vIEdldCB5YW1sIGZyb250bWF0dGVyIGZyb20gZmlsZVxuICAgIGNvbnN0IGNvbnRlbnQgPSByZWFkRmlsZVN5bmMocGF0aCwgXCJ1dGY4XCIpO1xuICAgIGNvbnN0IHsgZGF0YSA9IHt9IH0gPSBtYXR0ZXIoY29udGVudCk7XG5cbiAgICBjb25zdCBuZXdQYXRoID0gcGF0aC5yZXBsYWNlKHJlcGxhY2VQYXR0ZXJuLCBcIlwiKTtcblxuICAgIGlmIChuZXdQYXRoLnN0YXJ0c1dpdGgoXCJfX2RyYWZ0c19fXCIpKSB7XG4gICAgICAvLyBTa2lwIGRyYWZ0cyBmb3IgcGFnZSBpbmRleFxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgbGV0IHNsdWdnZWRQYXRoID0gam9pbihwcmVmaXgsIHNsdWdpZnlQYXRoKG5ld1BhdGgsIGRhdGEpKTtcblxuICAgIGNvbnN0IGxhc3RQYXJ0ID0gbmV3UGF0aC5zcGxpdChcIi9cIikucG9wKCk7XG5cbiAgICBpZiAobGFzdFBhcnQgPT0gbnVsbCkgY29udGludWU7XG4gICAgY29uc3QgbmFtZSA9IGxhc3RQYXJ0LnNwbGl0KFwiLlwiKVswXTtcblxuICAgIGNvbnN0IHRpdGxlID0gZGF0YS50aXRsZSA/PyBuYW1lO1xuICAgIHBlcm1hbGlua0luZGV4W3NsdWdnZWRQYXRoXSA9IHsgY29udGVudEZpbGU6IG5ld1BhdGgsIHRpdGxlIH07XG5cbiAgICBjb25zdCBwYXRoV2l0aG91dEV4dCA9IG5ld1BhdGguc3BsaXQoXCIuXCIpWzBdO1xuXG4gICAgcGFnZUluZGV4W3BhdGhXaXRob3V0RXh0XSA9IFtzbHVnZ2VkUGF0aF07XG4gICAgaWYgKGxhc3RQYXJ0ICYmIHBhZ2VJbmRleFtuYW1lXSA9PSBudWxsKSB7XG4gICAgICBwYWdlSW5kZXhbbmFtZV0gPSBbc2x1Z2dlZFBhdGhdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gW3BhZ2VJbmRleCwgcGVybWFsaW5rSW5kZXhdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2x1Z2lmeVBhdGgocGF0aDogc3RyaW5nLCBmcm9udG1hdHRlcjogYW55KSB7XG4gIC8vIEdlbmVyYXRlIGEgdG9rZW5pemVkIHNsdWcgZnJvbSBhIG1hcmtkb3duIGZpbGUgcGF0aCB1c2luZyBHaXRIdWIncyBzdHlsZSxcbiAgLy8gb3ZlcnJpZGRlbiBieSB0aGUgcGVybWFsaW5rIGlmIHByb3ZpZGVkIGluIG1ldGFkYXRhXG5cbiAgY29uc3QgcGF0aFRva2VucyA9IHBhdGguc3BsaXQoXCIvXCIpO1xuICBjb25zdCBmaWxlTmFtZSA9IHBhdGhUb2tlbnMucG9wKCk7XG4gIGNvbnN0IGZpbGVCYXNlID0gZmlsZU5hbWU/LnNwbGl0KFwiLlwiKVswXSB8fCBcIlwiO1xuICBjb25zdCBkZWZhdWx0U2x1ZyA9IHNsdWdpZnkoZmlsZUJhc2UsIHsgbG93ZXJjYXNlOiB0cnVlIH0pO1xuXG4gIGNvbnN0IHsgcGVybWFsaW5rLCBzbHVnIH0gPSBmcm9udG1hdHRlcjtcblxuICBjb25zdCBmaWxlU2x1ZyA9IHBlcm1hbGluayA/PyBzbHVnID8/IGRlZmF1bHRTbHVnO1xuXG4gIGxldCB0b2tlbnMgPSBwYXRoVG9rZW5zLm1hcCgodG9rZW4pID0+IHNsdWdpZnkodG9rZW4pKTtcblxuICBpZiAoZmlsZVNsdWcgIT0gXCJcIiAmJiBmaWxlU2x1ZyAhPSBcImluZGV4XCIpIHtcbiAgICB0b2tlbnMucHVzaChmaWxlU2x1Zyk7XG4gIH1cblxuICAvLyBKb2luIHRoZSBwYXRoIHRva2VucyBiYWNrIHRvZ2V0aGVyXG4gIGxldCB1cmxQYXRoID0gdG9rZW5zLmpvaW4oXCIvXCIpO1xuICByZXR1cm4gdXJsUGF0aDtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7O0FBQStOLE9BQU8sa0JBQWtCO0FBRXhQLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsb0JBQTRCO0FBQ3JDLE9BQU8sWUFBWTs7O0FDTm5CO0FBQUEsRUFDRSxNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsRUFDWCxTQUFXO0FBQUEsRUFDWCxhQUFlO0FBQUEsRUFDZixNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsSUFDVCxPQUFTO0FBQUEsSUFDVCxLQUFPO0FBQUEsSUFDUCxPQUFTO0FBQUEsSUFDVCxRQUFVO0FBQUEsSUFDVixjQUFjO0FBQUEsSUFDZCxRQUFVO0FBQUEsSUFDVixlQUFlO0FBQUEsSUFDZixPQUFTO0FBQUEsSUFDVCxnQkFBZ0I7QUFBQSxJQUNoQixNQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsWUFBYztBQUFBLElBQ1o7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFX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T0FBTztBQUFBLElBQ0wsUUFBUSxLQUFLLFFBQVEsa0NBQVcsTUFBTTtBQUFBLElBQ3RDLGFBQWE7QUFBQSxJQUNiLFdBQVc7QUFBQSxFQUNiO0FBQUEsRUFDQSxRQUFRO0FBQUE7QUFBQSxJQUVOLGlCQUFpQixLQUFLLFVBQVUsU0FBUztBQUFBO0FBQUEsRUFFM0M7QUFBQSxFQUNBLEtBQUs7QUFBQSxJQUNILFlBQVk7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUlWO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsS0FBSztBQUFBLElBQ0gscUJBQXFCO0FBQUEsTUFDbkIsTUFBTTtBQUFBLFFBQ0osS0FBSztBQUFBLE1BQ1A7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInNsdWdpZnkiLCAiam9pbiIsICJwYXRoIiwgImZyb250bWF0dGVyIiwgImpvaW4iLCAic2x1Z2lmeSJdCn0K
