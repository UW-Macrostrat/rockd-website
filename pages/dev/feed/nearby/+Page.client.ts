import h from "@macrostrat/hyper";
import { FeedPage } from "../feed-page";

/** `/dev/feed/nearby` — checkins near a center point set on the helper map. */
export function Page() {
  return h(FeedPage, { feedType: "nearby" });
}
