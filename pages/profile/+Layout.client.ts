// Gated for the same reason pages/my-checkins/ and pages/login/ are: this page
// is only reachable after a login, and /login itself 404s in production.
// Remove the guards together when the web login flow launches.

import React from "react";
import { DevGuard } from "~/components/dev-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return React.createElement(DevGuard, null, children);
}
