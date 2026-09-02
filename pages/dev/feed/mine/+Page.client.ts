import h from "@macrostrat/hyper";
import { FeedPage } from "../feed-page";

/** `/dev/feed/mine` — the signed-in user's own checkins. */
export function Page() {
  return h(FeedPage, { feedType: "mine" });
}
