import { Button, Callout, Spinner } from "@blueprintjs/core";
import { useState } from "react";
import h from "@macrostrat/hyper";
import {
  loginAndRefreshStrabospot,
  clearStoredStrabospotAuth,
  getStoredStrabospotAuth,
} from "../strabospot-integration";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#171b2b",
    color: "#f4f4f7",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  header: {
    height: "66px",
    background: "#262938",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px",
    boxSizing: "border-box" as const,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "52px",
  },
  logo: {
    fontSize: "18px",
    fontWeight: 400,
    color: "#ffffff",
    letterSpacing: "0.01em",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "36px",
    fontSize: "16px",
    color: "#ffffff",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "34px",
    fontSize: "16px",
    color: "#ffffff",
  },
  navText: {
    color: "#ffffff",
    textDecoration: "none",
    cursor: "default",
  },
  main: {
    paddingTop: "54px",
    paddingLeft: "32px",
    paddingRight: "32px",
    paddingBottom: "48px",
  },
  content: {
    maxWidth: "1360px",
    margin: "0 auto",
  },
  titleWrap: {
    textAlign: "center" as const,
    marginBottom: "56px",
  },
  title: {
    margin: 0,
    fontSize: "42px",
    fontWeight: 300,
    color: "#f5f5f7",
  },
  underline: {
    width: "380px",
    height: "4px",
    background: "#e44d71",
    margin: "24px auto 0",
  },
  formArea: {
    maxWidth: "1320px",
    margin: "0 auto",
  },
  formRow: {
    marginBottom: "36px",
  },
  label: {
    display: "block",
    fontSize: "18px",
    color: "#f4f4f7",
    marginBottom: "10px",
    fontWeight: 400,
  },
  input: {
    width: "100%",
    height: "60px",
    boxSizing: "border-box" as const,
    background: "#cfd5e0",
    color: "#111827",
    border: "none",
    borderRadius: "4px",
    padding: "0 20px",
    fontSize: "18px",
    outline: "none",
  },
  buttonRow: {
    marginTop: "18px",
  },
  loginButton: {
    background: "#e44d71",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    width: "132px",
    height: "58px",
    fontSize: "18px",
    fontWeight: 400,
    boxShadow: "none",
  },
  helperText: {
    marginTop: "42px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "42px",
    color: "#ef6b8d",
    fontSize: "18px",
  },
  helperLine: {
    color: "#ef6b8d",
  },
  clearWrap: {
    marginTop: "22px",
  },
  clearButton: {
    color: "#bfc7d8",
    background: "transparent",
    border: "none",
    padding: 0,
    fontSize: "15px",
    cursor: "pointer",
  },
  spinnerWrap: {
    marginTop: "16px",
  },
  status: {
    marginTop: "28px",
    maxWidth: "900px",
  },
  resultPre: {
    whiteSpace: "pre-wrap" as const,
    overflowX: "auto" as const,
    margin: 0,
  },
};

export function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(getStoredStrabospotAuth());
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e?: Event) {
    e?.preventDefault?.();
    setIsLoading(true);
    setError(null);

    try {
      const auth = await loginAndRefreshStrabospot(email, password);
      setResult(auth);
      window.location.href = "/dev/strabospot";
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    clearStoredStrabospotAuth();
    setResult(null);
    setError(null);
  }

  return h("div", { style: styles.page }, [
    h("header", { style: styles.header }, [
      h("div", { style: styles.headerLeft }, [
        h("div", { style: styles.logo }, "STRABOSPOT"),
        h("div", { style: styles.nav }, [
          h("span", { style: styles.navText }, "StraboField"),
          h("span", { style: styles.navText }, "StraboMicro"),
          h("span", { style: styles.navText }, "StraboExperimental"),
        ]),
      ]),
      h("div", { style: styles.navRight }, [
        h("span", { style: styles.navText }, "About"),
        h("span", { style: styles.navText }, "Search"),
        h("span", { style: styles.navText }, "Help"),
        h("span", { style: styles.navText }, "More"),
        h("span", { style: styles.navText }, "Account"),
      ]),
    ]),

    h("main", { style: styles.main }, [
      h("div", { style: styles.content }, [
        h("div", { style: styles.titleWrap }, [
          h("h1", { style: styles.title }, "StraboSpot Login"),
          h("div", { style: styles.underline }),
        ]),

        h("div", { style: styles.formArea }, [
          h(
            "form",
            {
              onSubmit: handleSubmit,
            },
            [
              h("div", { style: styles.formRow }, [
                h("label", { for: "email", style: styles.label }, "Email:"),
                h("input", {
                  id: "email",
                  name: "email",
                  type: "text",
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  autoComplete: "username",
                  style: styles.input,
                }),
              ]),

              h("div", { style: styles.formRow }, [
                h(
                  "label",
                  { for: "password", style: styles.label },
                  "Password:"
                ),
                h("input", {
                  id: "password",
                  name: "password",
                  type: "password",
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  autoComplete: "current-password",
                  style: styles.input,
                }),
              ]),

              h("div", { style: styles.buttonRow }, [
                h(
                  Button,
                  {
                    type: "submit",
                    loading: isLoading,
                    style: styles.loginButton,
                  },
                  "Login"
                ),
              ]),
            ]
          ),

          h("div", { style: styles.clearWrap }, [
            h(
              "button",
              {
                type: "button",
                onClick: handleClear,
                disabled: isLoading,
                style: styles.clearButton,
              },
              "Clear saved auth"
            ),
          ]),

          h.if(isLoading)(
            "div",
            { style: styles.spinnerWrap },
            h(Spinner, { size: 18 })
          ),

          h("div", { style: styles.helperText }, [
            h("div", { style: styles.helperLine }, "Sign up for new account."),
            h("div", { style: styles.helperLine }, "Forgot Password?"),
            h("div", { style: styles.helperLine }, "Resend Validation Link?"),
          ]),

          h.if(error != null)(
            "div",
            { style: styles.status },
            h(
              Callout,
              { intent: "danger", title: "Authentication failed" },
              h("pre", { style: styles.resultPre }, error)
            )
          ),

          h.if(result != null)(
            "div",
            { style: styles.status },
            h(
              Callout,
              { intent: "success", title: "Authenticated" },
              h(
                "pre",
                { style: styles.resultPre },
                JSON.stringify(result, null, 2)
              )
            )
          ),
        ]),
      ]),
    ]),
  ]);
}
