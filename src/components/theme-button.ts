import h from "@macrostrat/hyper";
import { DarkModeButton, useDarkMode } from "@macrostrat/ui-components";
import { useEffect, useState } from "react";

/** The dark-mode toggle, as Macrostrat's site has it. The server can't know
 * the reader's theme, so the label follows it only once mounted, keeping the
 * server render and hydration in agreement. */
export function ThemeButton({ className }: { className?: string }) {
  const darkMode = useDarkMode();
  const mounted = useIsMounted();
  const isEnabled = darkMode.isEnabled && mounted;

  let text = "Turn off the lights";
  if (isEnabled) {
    text = "Turn on the lights";
  }
  return h(
    DarkModeButton,
    { className, minimal: true, active: false, allowReset: true },
    h("span", text)
  );
}

function useIsMounted(): boolean {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return isMounted;
}
