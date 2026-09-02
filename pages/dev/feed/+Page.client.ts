import h from "@macrostrat/hyper";
import { FeedPage } from "./feed-page";

/** `/dev/feed` — the `all` feed. */
export function Page() {
  return h(FeedPage, { feedType: "all" });
}
