import h from "@macrostrat/hyper";
import { ProfilePage } from "~/components/profile";

/** `/profile` — your account, your organizations, and the join requests
 * waiting on you. */
export function Page() {
  return h(ProfilePage);
}
