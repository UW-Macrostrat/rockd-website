import { AnchorButton } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import { useRockdAuth } from "./rockd-auth";
import { UserPersona } from "./user-persona";

/** The signed-in user's actions for a page header: New checkin, then the
 * sign-in indicator. Signed out, just the indicator. */
export function AccountActions() {
  const { personId } = useRockdAuth();
  return h([
    h.if(personId != null)(
      AnchorButton,
      {
        key: "new",
        href: "/dev/checkin/new",
        icon: "add",
        minimal: true,
        small: true,
      },
      "New checkin"
    ),
    h(UserPersona, { key: "persona" }),
  ]);
}
