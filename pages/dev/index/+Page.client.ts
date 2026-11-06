import hyper from "@macrostrat/hyper";
import type { ReactNode } from "react";
import styles from "./dev-index.module.sass";

const h = hyper.styled(styles);

// Every page on the site, found from its `+Page` file so a new page is listed
// without editing this one, and each folder's own `+config.ts` for its title.
// All are read as text, never imported: the root `+config.ts` pulls in
// build-time server code (`vike-photon`) that can't be bundled for the browser.
const pageFiles = import.meta.glob("/pages/**/+Page*.ts", {
  query: "?raw",
  import: "default",
});
const configs = import.meta.glob<string>("/pages/**/+config.ts", {
  eager: true,
  query: "?raw",
  import: "default",
});
// The folders whose `+guard.ts` is the production guard (a 403 outside
// development)
const guards = import.meta.glob<string>("/pages/**/+guard.ts", {
  eager: true,
  query: "?raw",
  import: "default",
});
const guardedDirs = Object.entries(guards)
  .filter(([, source]) => source.includes("productionGuard"))
  .map(([file]) => pageDir(file));

interface SitePage {
  path: string;
  title: string;
  // A route with a parameter (`@id`) has no single URL to link to
  linkable: boolean;
}

/** A page file's folder under `pages/`, e.g. `dev/feed` */
function pageDir(file: string) {
  return file.replace(/^\/pages\//, "").replace(/\/?\+[^/]*$/, "");
}

function isUnder(dir: string, parent: string) {
  return dir === parent || dir.startsWith(parent + "/");
}

/** The pages in the folders matching `include`, by URL */
function sitePages(include: (dir: string) => boolean): SitePage[] {
  const dirs = Object.keys(pageFiles).map(pageDir).filter(include);
  return [...new Set(dirs)]
    .map((dir) => {
      const segments = dir.split("/");
      // `index` folders take their parent's URL
      const route = segments.filter((s) => s !== "index").map(routeSegment);
      let title = configTitle(configs[`/pages/${dir}/+config.ts`]);
      if (title == null) title = fallbackTitle(segments);
      return {
        path: "/" + route.join("/"),
        title,
        linkable: !dir.includes("@"),
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** The `title` string in a `+config.ts`'s source, if it sets one */
function configTitle(source: string | undefined) {
  return source?.match(/\btitle:\s*["'`]([^"'`]+)["'`]/)?.[1];
}

function routeSegment(segment: string) {
  if (segment.startsWith("@")) return ":" + segment.slice(1);
  return segment;
}

/** A page's title when its folder's config sets none: the folder's name, or
 * for a parameter route (`@id`, whose title may come from the route itself)
 * its parent's title, by that parameter */
function fallbackTitle(segments: string[]) {
  const last = segments[segments.length - 1];
  if (!last.startsWith("@")) return humanize(last);
  const parent = segments.slice(0, -1);
  let parentTitle = configTitle(
    configs[`/pages/${parent.join("/")}/+config.ts`]
  );
  if (parentTitle == null) parentTitle = humanize(parent[parent.length - 1]);
  return `${parentTitle} (by ${last.slice(1)})`;
}

function humanize(segment: string) {
  const words = segment.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** `/dev` — links to every page in the development section, then to the
 * other pages whose guard denies access in production. */
export function Page() {
  const devPages = sitePages(
    (dir) => isUnder(dir, "dev") && dir !== "dev/index"
  );
  const otherGuarded = sitePages(
    (dir) =>
      !isUnder(dir, "dev") &&
      guardedDirs.some((guarded) => isUnder(dir, guarded))
  );
  return h("div.dev-index", [
    h(PageList, { title: "Development pages", pages: devPages }),
    h(PageList, {
      title: "Other pages behind a dev guard",
      description: "Access is denied (403) on these in production.",
      pages: otherGuarded,
    }),
  ]);
}

function PageList({
  title,
  description,
  pages,
}: {
  title: string;
  description?: string;
  pages: SitePage[];
}) {
  return h("section.page-list", [
    h("h2.page-list-title", title),
    h.if(description != null)("p.page-list-description", description),
    h("ul.dev-pages", pages.map(DevPageLink)),
  ]);
}

function DevPageLink({ path, title, linkable }: SitePage) {
  let link: ReactNode = h("span.dev-page-title", title);
  if (linkable) link = h("a.dev-page-title", { href: path }, title);
  return h("li.dev-page", { key: path }, [link, h("code.dev-page-path", path)]);
}
