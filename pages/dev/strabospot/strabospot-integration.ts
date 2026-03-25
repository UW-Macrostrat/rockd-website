import { Button, Callout, Spinner } from "@blueprintjs/core";
import { useState } from "react";
import h from "@macrostrat/hyper";

const CONVERT_ENDPOINT =
  "https://dev.macrostrat.org/api/v3/dev/convert/field-site?in=checkin&out=spot";

interface SendToStrabospotButtonProps {
  checkin: any;
}

export function SendToStrabospotButton({
  checkin,
}: SendToStrabospotButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [responseBody, setResponseBody] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setIsLoading(true);
    setError(null);
    setResponseBody(null);

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
      } catch {
        // keep raw text if response is not JSON
      }

      if (!res.ok) {
        setError(
          typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2)
        );
        return;
      }

      setResponseBody(parsed);
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
        intent: "primary",
        fill: true,
        loading: isLoading,
        onClick: handleSend,
        style: { marginTop: "0.5rem" },
      },
      "Send to Strabospot"
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
