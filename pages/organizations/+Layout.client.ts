import React from "react";
import { DevGuard } from "~/components/dev-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return React.createElement(DevGuard, null, children);
}
