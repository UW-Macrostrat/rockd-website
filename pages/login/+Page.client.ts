import h from "@macrostrat/hyper";
import { Button, Callout } from "@blueprintjs/core";
import { useState } from "react";
import { saveRockdAuth } from "./rockd-auth";
import s from "../index/main.module.sass";
import { Image } from "~/components";
import { SETTINGS } from "~/settings";

const ROCKD_LOGIN_ENDPOINT = `${SETTINGS.rockdApiURL}/login`;

export function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      window.location.href = "/dev/strabospot";
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
