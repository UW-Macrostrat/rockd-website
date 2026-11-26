import h from "@macrostrat/hyper";
import { usePageContext } from "vike-react/usePageContext";
import { OrganizationPage } from "~/components/organizations";

/** `/orgs/:id` — one organization, opened from a card in the directory. The
 * id may be a number or a slug; the API resolves either, so it is passed
 * through as it was written. */
export function Page() {
  const { routeParams } = usePageContext();
  return h(OrganizationPage, { id: routeParams.id });
}
