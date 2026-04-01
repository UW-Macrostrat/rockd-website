import h from "@macrostrat/hyper";
import { Button, Callout } from "@blueprintjs/core";
import { useState } from "react";
import {
  loginAndRefreshStrabospot,
  getStoredStrabospotAuth,
} from "../strabospot-integration";
import s from "../../../index/main.module.sass";
import { Image } from "~/components";

export function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<any>(getStoredStrabospotAuth());
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e?: Event) {
    e?.preventDefault?.();
    setError(null);

    try {
      const auth = await loginAndRefreshStrabospot(email, password);
      setResult(auth);
      window.location.href = "/dev/strabospot";
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
      setResult(null);
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

        h(
          "div",
          {
            style: {
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.75rem",
              marginTop: "1rem",
              marginBottom: "1rem",
            },
          },
          [
            h("img", {
              src: "https://strabospot.org/includes/mimages/pic01.jpg",
              alt: "Strabospot logo",
              style: {
                width: "56px",
                height: "56px",
                objectFit: "cover",
                borderRadius: "10px",
                display: "block",
              },
            }),

            h(
              "h2",
              {
                style: {
                  margin: 0,
                  color: "white",
                  fontWeight: 600,
                  fontSize: "1.5rem",
                },
              },
              "Strabospot Login"
            ),
          ]
        ),

        h(
          "div",
          {
            style: {
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginTop: "0.5rem",
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
                  type: "text",
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  placeholder: "Email",
                  autoComplete: "username",
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
                  autoComplete: "current-password",
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

                h.if(error != null)(
                  Callout,
                  { intent: "danger", title: "Authentication failed" },
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
