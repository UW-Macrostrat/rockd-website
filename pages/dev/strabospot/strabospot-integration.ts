import { Button, Callout, Spinner } from "@blueprintjs/core";
import { useState } from "react";
import h from "@macrostrat/hyper";

const CONVERT_ENDPOINT =
  "https://dev.macrostrat.org/api/v3/dev/convert/field-site?in=checkin&out=spot";

const STRABOSPOT_LOGIN_ENDPOINT = "https://strabospot.org/jwtauth/login";
const STRABOSPOT_REFRESH_ENDPOINT = "https://strabospot.org/jwtauth/refresh";
const STORAGE_KEY = "strabospot-auth";

export interface StrabospotLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: {
    pkey: string;
    email: string;
    name: string;
  };
}

export interface StrabospotRefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface StoredStrabospotAuth {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user?: {
    pkey: string;
    email: string;
    name: string;
  };
}

async function parseJsonResponse(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function loginToStrabospot(email: string, password: string) {
  const res = await fetch(STRABOSPOT_LOGIN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify({ email, password }),
  });

  const body = await parseJsonResponse(res);

  if (!res.ok) {
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  }

  return body as StrabospotLoginResponse;
}

export async function refreshStrabospotToken(refreshToken: string) {
  const res = await fetch(STRABOSPOT_REFRESH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const body = await parseJsonResponse(res);

  if (!res.ok) {
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  }

  return body as StrabospotRefreshResponse;
}

export async function loginAndRefreshStrabospot(
  email: string,
  password: string
) {
  const login = await loginToStrabospot(email, password);
  const refresh = await refreshStrabospotToken(login.refresh_token);

  const auth = {
    accessToken: refresh.access_token, // latest access token
    refreshToken: login.refresh_token,
    tokenType: refresh.token_type ?? login.token_type,
    expiresIn: refresh.expires_in ?? login.expires_in,
    user: login.user,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  return auth;
}

export function getStoredStrabospotAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw == null) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStoredStrabospotAuth() {
  localStorage.removeItem(STORAGE_KEY);
}
interface SendToStrabospotButtonProps {
  checkin: any;
}

export async function refreshStoredStrabospotAuth(): Promise<boolean> {
  const auth = getStoredStrabospotAuth();

  if (auth == null || auth.refreshToken == null) {
    return false;
  }

  try {
    const refresh = await refreshStrabospotToken(auth.refreshToken);

    const updatedAuth = {
      ...auth,
      accessToken: refresh.access_token,
      tokenType: refresh.token_type ?? auth.tokenType,
      expiresIn: refresh.expires_in ?? auth.expiresIn,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAuth));
    return true;
  } catch (err: any) {
    clearStoredStrabospotAuth();
    return false;
  }
}

export function getStrabospotAccessToken(): string | null {
  const auth = getStoredStrabospotAuth();
  return auth?.accessToken ?? null;
}

const sendToStrabospotButtonBaseStyle = {
  marginTop: "0.5rem",
  whiteSpace: "normal" as const,
  wordBreak: "break-word" as const,
  textAlign: "center" as const,
  lineHeight: 1.2,
  minHeight: "38px",
  height: "auto",
  padding: "8px 10px",
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "12px",
  border: "1px solid transparent",
  transition: "all 120ms ease",
};

const sendToStrabospotButtonStyles = {
  default: {
    ...sendToStrabospotButtonBaseStyle,
  },
  sent: {
    ...sendToStrabospotButtonBaseStyle,
    background: "linear-gradient(180deg, #bfc6d2 0%, #a8b1bf 100%)",
    color: "#364152",
    border: "1px solid #8f99a8",
    boxShadow:
      "inset 0 2px 4px rgba(55,65,81,0.22), inset 0 -1px 0 rgba(255,255,255,0.35), 0 1px 0 rgba(255,255,255,0.2)",
    transform: "translateY(1px)",
  },
};

export function SendToStrabospotButton({
  checkin,
}: SendToStrabospotButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [responseBody, setResponseBody] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasSent, setWasSent] = useState(false);

  async function handleSend() {
    setIsLoading(true);
    setError(null);
    setResponseBody(null);
    setWasSent(false);

    try {
      const res = await fetch(CONVERT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkin),
      });

      const text = await res.text();

      let parsed: any = text;
      try {
        parsed = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        setError(
          typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2)
        );
        return;
      }

      setResponseBody(parsed);
      setWasSent(true);
    } catch (err: any) {
      setError(err?.message ?? "Request failed");
    } finally {
      setIsLoading(false);
    }
  }

  return h("div.strabospot-integration", [
    h(
      Button,
      {
        fill: true,
        loading: isLoading,
        onClick: handleSend,
        style: wasSent
          ? sendToStrabospotButtonStyles.sent
          : sendToStrabospotButtonStyles.default,
      },
      wasSent ? "Sent to Strabospot" : "Send to Strabospot"
    ),

    h.if(isLoading)(
      "div",
      { style: { marginTop: "0.5rem" } },
      h(Spinner, { size: 18 })
    ),

    h.if(error != null)(
      "div",
      { style: { marginTop: "0.5rem" } },
      h(
        Callout,
        { intent: "danger", title: "Conversion failed" },
        h(
          "pre",
          {
            style: {
              whiteSpace: "pre-wrap",
              overflowX: "auto",
              margin: 0,
            },
          },
          error
        )
      )
    ),

    h.if(responseBody != null)(
      "div",
      { style: { marginTop: "0.5rem" } },
      h(
        Callout,
        { intent: "success", title: "Conversion response" },
        h(
          "pre",
          {
            style: {
              whiteSpace: "pre-wrap",
              overflowX: "auto",
              margin: 0,
              maxHeight: "240px",
            },
          },
          typeof responseBody === "string"
            ? responseBody
            : JSON.stringify(responseBody, null, 2)
        )
      )
    ),
  ]);
}
