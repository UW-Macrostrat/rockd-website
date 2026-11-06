import h from "@macrostrat/hyper";
import { usePageContext } from "vike-react/usePageContext";
import { CheckinEditor } from "~/components/checkin-editor";

/** `/dev/create-edit-checkin/new` — a blank checkin, or a stored draft (`?draft=<key>`) */
export function Page() {
  const { urlParsed } = usePageContext();
  const draftKey = urlParsed.search?.draft ?? null;
  return h(CheckinEditor, { checkinId: null, draftKey });
}
