// pages/my_checkins/+Layout.client.ts
// Applied automatically by Vike to every page under pages/my_checkins/
//
// Gated for the same reason pages/login/ is: this page is only reachable after
// a login, and /login itself 404s in production. Remove both guards together
// when the web login flow launches.

import React from "react";
import { DevGuard } from "../../src/components/dev-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return React.createElement(DevGuard, null, children);
}
