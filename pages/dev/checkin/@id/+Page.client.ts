import h from "@macrostrat/hyper";
import { usePageContext } from "vike-react/usePageContext";
import { CheckinEditor } from "~/components/checkin-editor";

/** `/dev/checkin/:id` — edit one of your checkins */
export function Page() {
  const { routeParams } = usePageContext();
  const checkinId = parseInt(routeParams.id, 10);
  if (!Number.isFinite(checkinId)) return h("p", "Not a checkin id");
  return h(CheckinEditor, { checkinId });
}
