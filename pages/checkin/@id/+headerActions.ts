import { AnchorButton } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import { useData } from "vike-react/useData";
import { useRockdAuth } from "~/components/auth";

/** Edit, for the checkin's owner, in the checkin page's header */
export default function CheckinPageActions() {
  const { checkin } = useData<{
    checkin?: { checkin_id: number; person_id: number };
  }>();
  const { personId } = useRockdAuth();
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
