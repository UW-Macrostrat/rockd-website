// pages/dev/+Layout.client.ts
// Applied automatically by Vike to every page under pages/dev/

import React from "react";
import { DevGuard } from "../../src/components/dev-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return React.createElement(DevGuard, null, children);
}
