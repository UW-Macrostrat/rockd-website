import { AnchorButton } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import { useData } from "vike-react/useData";
import { useRockdAuth } from "~/components/auth";
import { isDevelopmentEnvironment } from "~/settings";

/** Edit, for the checkin's owner, in the checkin page's header — on the
 * development deployment, where the editor is served */
export default function CheckinPageActions() {
  const { checkin } = useData<{
    checkin?: { checkin_id: number; person_id: number };
  }>();
  const { personId } = useRockdAuth();
  if (!isDevelopmentEnvironment()) return null;
  if (checkin == null || personId == null || checkin.person_id !== personId)
    return null;
  return h(
    AnchorButton,
    {
      href: `/dev/checkin/${checkin.checkin_id}`,
      icon: "edit",
      minimal: true,
      small: true,
    },
    "Edit"
  );
}
