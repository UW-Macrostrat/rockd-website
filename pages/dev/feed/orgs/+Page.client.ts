import h from "@macrostrat/hyper";
import { FeedPage } from "../feed-page";

/** `/dev/feed/orgs` — checkins shared with an organization, across every
 * organization the visitor can see. */
export function Page() {
  return h(FeedPage, { feedType: "orgs" });
}
