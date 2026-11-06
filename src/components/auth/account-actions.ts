import { AnchorButton } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import { useRockdAuth } from "./rockd-auth";
import { UserPersona } from "./user-persona";

/** The signed-in user's actions for a page header: New checkin (the blue
 * button `/dev/create-edit-checkin` has), then the sign-in indicator. Signed out, just the
 * indicator. */
export function AccountActions() {
  const { personId } = useRockdAuth();
  return h([
    h.if(personId != null)(
      AnchorButton,
      {
        key: "new",
        href: "/dev/create-edit-checkin/new",
        icon: "add",
        intent: "primary",
      },
      "New checkin"
    ),
    h(UserPersona, { key: "persona" }),
  ]);
}
