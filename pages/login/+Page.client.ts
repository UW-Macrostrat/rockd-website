import h from "@macrostrat/hyper";
import { Button, Callout } from "@blueprintjs/core";
import { useState } from "react";
import { saveRockdAuth } from "./rockd-auth";
import s from "../index/main.module.sass";
import ob from "./oauth-buttons.module.sass";
import { Image } from "~/components";
import { SETTINGS } from "~/settings";

const ROCKD_LOGIN_ENDPOINT = `${SETTINGS.rockdApiURL}/login`;

const ROCKD_AUTH_BASE = `${SETTINGS.rockdApiURL.replace(/\/$/, "")}/auth`;

const GoogleMark = h(
  "svg",
  { width: 18, height: 18, viewBox: "0 0 48 48", "aria-hidden": true },
  [
    h("path", {
      fill: "#EA4335",
      d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z",
    }),
    h("path", {
      fill: "#4285F4",
      d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z",
    }),
    h("path", {
      fill: "#FBBC05",
      d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.97-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z",
    }),
    h("path", {
      fill: "#34A853",
      d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z",
    }),
  ]
);

const FacebookMark = h(
  "svg",
  { width: 20, height: 20, viewBox: "0 0 24 24", "aria-hidden": true },
  h("path", {
    fill: "#fff",
    d: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z",
  })
);

const OAUTH_PROVIDERS = [
  { id: "google", label: "Continue with Google", mark: GoogleMark },
  { id: "facebook", label: "Continue with Facebook", mark: FacebookMark },
];

const OAUTH_ERRORS: Record<string, string> = {
  denied: "Authorization was cancelled or denied by the provider.",
  invalid_state: "That sign-in link expired or didn't start here. Try again.",
  provider_error:
    "The provider couldn't complete the sign-in. Please try again.",
  login_failed: "We couldn't complete the sign-in. Please try again.",
  missing_token: "The sign-in response was missing a token.",
};

function initialError(): string | null {
  if (typeof window === "undefined") return null;
  const reason = new URLSearchParams(window.location.search).get("error");
  if (reason == null) return null;
  return OAUTH_ERRORS[reason] ?? `Login failed (${reason})`;
}

export function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);

  async function handleSubmit(e?: Event) {
    e?.preventDefault?.();
    setError(null);

    try {
      const res = await fetch(ROCKD_LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(JSON.stringify(body, null, 2));
      }

      saveRockdAuth(body);
      const redirectURI = new URLSearchParams(window.location.search).get(
        "redirect_uri"
      );
      const token = body?.token ?? body?.person?.token;

      if (redirectURI != null && token != null) {
        const callbackURL = new URL(redirectURI);
        callbackURL.searchParams.set("token", token);
        window.location.href = callbackURL.toString();
        return;
      }
      window.location.href = "/my_checkins";
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
    }
  }

  return s("div.full-height-container", [
    s("div.mask", [
      s(Image, {
        src: "main-page/field.jpg",
        className: "start-img back-img",
        alt: "Field",
      }),
    ]),

    s("div.main-content.side-by-side", [
      s("div.content-panel.app-info", [
        s(Image, {
          src: "main-page/rockd_transparent.png",
          className: "not-huge",
          alt: "Rockd logo",
        }),

        s("p.tagline", "Learn about, explore, and document the geologic world"),

        h(
          "div",
          {
            style: {
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginTop: "1.5rem",
            },
          },
          [
            h(
              "form",
              {
                onSubmit: handleSubmit,
                style: {
                  width: "100%",
                  maxWidth: "420px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                },
              },
              [
                h("input", {
                  type: "email",
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  placeholder: "Email",
                  style: {
                    padding: "0.85rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    fontSize: "1rem",
                  },
                }),

                h("input", {
                  type: "password",
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  placeholder: "Password",
                  style: {
                    padding: "0.85rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    fontSize: "1rem",
                  },
                }),

                h(
                  Button,
                  {
                    type: "submit",
                    background: "var(--panel-background-color, white)",
                    style: {
                      width: "fit-content",
                      alignSelf: "center",
                    },
                  },
                  "Login"
                ),

                h(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    },
                  },
                  [
                    h("hr", {
                      style: {
                        flex: 1,
                        border: 0,
                        borderTop: "1px solid #ccc",
                      },
                    }),
                    h(
                      "span",
                      { style: { fontSize: "0.85rem", opacity: 0.7 } },
                      "or"
                    ),
                    h("hr", {
                      style: {
                        flex: 1,
                        border: 0,
                        borderTop: "1px solid #ccc",
                      },
                    }),
                  ]
                ),

                ob(
                  "div.oauth-buttons",
                  OAUTH_PROVIDERS.map(({ id, label, mark }) =>
                    ob(
                      `a.oauth-button.${id}`,
                      { key: id, href: `${ROCKD_AUTH_BASE}/${id}` },
                      [mark, h("span", label)]
                    )
                  )
                ),

                h.if(error != null)(
                  Callout,
                  { intent: "danger", title: "Login failed" },
                  error
                ),
              ]
            ),
          ]
        ),
      ]),

      s(Image, {
        src: "main-page/main.png",
        className: "main-img",
        alt: "Rockd app preview",
      }),
    ]),
  ]);
}
