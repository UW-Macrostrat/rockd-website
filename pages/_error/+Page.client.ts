import { usePageContext } from "vike-react/usePageContext";
import h from "./main.module.sass";
import { Image } from "~/components";

function pageDoesntExist() {
  return h("div.error404", [
    h(Image, {
      src: "earth-crust.jpg",
      className: "error-image",
      width: "100%",
      height: "100%",
    }),
    h("div.error-text", [
      h("h1", "404"),
      h("h2", "The rock you are looking for doesn't exist. Keep digging."),
      h("div.buttons", [
        h(
          "button",
          { className: "btn", onClick: () => history.back() },
          "Go back"
        ),
        h("a", { className: "btn", href: "/" }, "Go home"),
      ]),
    ]),
  ]);
}

export function Page() {
  const pageContext = usePageContext();

  let msg: string; // Message shown to the user
  const { abortReason, abortStatusCode } = pageContext;
  if (typeof abortReason === "string") {
    // Handle `throw render(abortStatusCode, `You cannot access ${someCustomMessage}`)`
    msg = abortReason;
  } else if (abortStatusCode === 403) {
    // Handle `throw render(403)`
    msg =
      "You cannot access this page because you don't have enough privileges.";
  } else if (abortStatusCode === 401) {
    // Handle `throw render(401)`
    msg =
      "You cannot access this page because you aren't logged in. Please log in.";
  } else {
    // Fallback error message
    msg = pageContext.is404
      ? pageDoesntExist()
      : "Something went wrong. Try again (later).";
  }

  return h("div.error", msg);
}
