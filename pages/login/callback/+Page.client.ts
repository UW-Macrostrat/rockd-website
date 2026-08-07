import h from "@macrostrat/hyper";
import { Callout, Spinner } from "@blueprintjs/core";
import { useEffect, useState } from "react";
import { saveRockdAuth } from "../rockd-auth";

/**
 * Lands here after the Rockd API completes an OAuth flow and redirects with
 * ?token=<jwt>. Stores the session and forwards on.
 */

interface TokenClaims {
  person_id?: number;
  exp?: number;
}

function decodeClaims(token: string): TokenClaims | null {
  try {
    const payload = token.split(".")[1];
    if (payload == null) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function Page() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (token == null) {
      window.location.replace("/login?error=missing_token");
      return;
    }

    // api verifies the signature on every request that uses this token. We read the payload
    // only to recover person_id and the expiry.
    const claims = decodeClaims(token);
    if (claims?.person_id == null) {
      setError("The sign-in token could not be read.");
      return;
    }

    saveRockdAuth({
      token,
      expires: claims.exp != null ? claims.exp * 1000 : 0,
      // Only person_id is available from the token. Name/email stay empty
      // until the API exposes an endpoint returning the full person record.
      person: { person_id: claims.person_id },
    } as any);

    window.location.replace("/");
  }, []);

  if (error != null) {
    return h(
      "div",
      { style: { padding: "2rem", maxWidth: "480px", margin: "0 auto" } },
      h(Callout, { intent: "danger", title: "Sign-in failed" }, [
        h("p", error),
        h("p", h("a", { href: "/login" }, "Back to login")),
      ])
    );
  }

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        padding: "4rem 2rem",
      },
    },
    [h(Spinner), h("p", "Signing you in…")]
  );
}
