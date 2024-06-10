import { apiV2Prefix } from "@macrostrat-web/settings";
import { preprocessUnits } from "@macrostrat/column-views/src/helpers";
import fetch from "node-fetch";

import { ColumnSummary } from "~/pages/map/map-interface/app-state/handlers/columns";
import { fetchAPIData } from "~/pages/columns/utils";

async function getAndUnwrap<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const res1 = await res.json();
  return res1.success.data;
}

export async function onBeforeRender(pageContext) {
  // `.page.server.js` files always run in Node.js; we could use SQL/ORM queries here.
  const col_id = pageContext.routeParams.column;

  // In cases where we are in a project context, we need to fetch the project data
  const project_id = pageContext.routeParams.project;

  // https://v2.macrostrat.org/api/v2/columns?col_id=3&response=long

  const baseRoute = project_id == null ? "/columns" : `/defs/columns`;
  const linkPrefix = project_id == null ? "/" : `/projects/${project_id}/`;

  /** This is a hack to make sure that all requisite data is on the table. */
  const responses = await Promise.all([
    project_id == null
      ? Promise.resolve(null)
      : getAndUnwrap(apiV2Prefix + `/defs/projects?project_id=${project_id}`),
    getAndUnwrap(
      apiV2Prefix +
        baseRoute +
        "?format=geojson&response=long&in_process=true&col_id=" +
        col_id
    ),
    fetchAPIData(`/units`, {
      response: "long",
      col_id,
    }),
  ]);

  const [projectData, column, unitsLong]: [any, any, any] = responses;

  const col = column?.features[0];

  const columnInfo: ColumnSummary = {
    ...col.properties,
    geometry: col.geometry,
    units: preprocessUnits(unitsLong),
  };

  return {
    pageContext: {
      exports: {
        ...pageContext.exports,
        title: columnInfo.col_name,
      },
      pageProps: {
        columnInfo,
        linkPrefix,
        project: projectData?.[0],
      },
    },
  };
}
