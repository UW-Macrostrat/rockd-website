import React, { useState, useEffect } from "react";
import { Button, Callout, Intent, Classes } from "@blueprintjs/core";
import classNames from "classnames";
import "./main.sass";
import h from "@macrostrat/hyper";

type LoginFormState = {
  username: string;
  password: string;
};

function isValid({ username, password }: LoginFormState): boolean {
  return (
    username != null &&
    password != null &&
    username.length >= 4 &&
    password.length >= 4
  );
}

function LoginForm() {
  const [state, setState] = useState<LoginFormState>({
    username: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [linkStraboResponse, setLinkStraboResponse] = useState<any>(null);
  const [jParam, setJParam] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const j = params.get("j");
    if (j) {
      setJParam(j);
    }
  }, []);

  const submitForm = async () => {
    try {
      const login = await fetch("https://dev.rockd.org/api/v2/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: state.username,
          password: state.password,
        }),
      });
      const loginBody = await login.json();
      console.log(loginBody);
      if (login.status === 502) {
        setError("The server is not available");
        return;
      }
      if (login.ok) {
        if (jParam) {
          const mergedBody = {
            ...loginBody,
            strabo_jwt: jParam,
          };
          const linkStrabo = await fetch(
            "https://dev.rockd.org/api/v2/link-strabospot",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(mergedBody),
            }
          );
          const linkStraboBody = await linkStrabo.json();
          console.log("Link Strabospot!", linkStraboBody);
          setLinkStraboResponse(linkStraboBody);
        }
        setLoggedIn(true);
        setError(null);
        return;
      }
    } catch (err) {
      setError("Something went wrong");
    }
  };

  const onChange = (e) => {
    if (!e.target) return;
    setState({ ...state, [e.target.name]: e.target.value });
  };

  const className = classNames(Classes.INPUT, "bp4-large");

  useEffect(() => {
    const sendRockdJWTToStrabo = async () => {
      if (loggedIn && linkStraboResponse && jParam) {
        try {
          const rockdJWTToStrabo = await fetch(
            "https://strabospot.org/db/macroJWT",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jParam}`,
              },
              body: JSON.stringify(linkStraboResponse),
            }
          );
          const straboResponse = await rockdJWTToStrabo.json();
          console.log("Strabo Response:", straboResponse);
        } catch (err) {
          console.error("Failed to send Rockd JWT to Strabo:", err);
        }
      }
    };
    sendRockdJWTToStrabo();
  }, [loggedIn, linkStraboResponse, jParam]);

  if (loggedIn) {
    return h("div", { className: "login-page" }, [
      h(Callout, {
        title: "Login Successful",
        intent: Intent.SUCCESS,
        className: "login-info",
        children: linkStraboResponse
          ? h(
              "pre",
              { className: "login-json" },
              JSON.stringify(linkStraboResponse, null, 2)
            )
          : {},
      }),
      h(
        Button,
        { intent: Intent.DANGER, onClick: () => setLoggedIn(false) },
        "Logout"
      ),
    ]);
  } else {
    return h("div", { className: "login-page" }, [
      h("h2", "Login"),
      error &&
        h(Callout, {
          className: "login-info",
          title: "Login Error",
          intent: Intent.DANGER,
          children: error,
        }),
      h(
        "form.login-form",
        {
          onSubmit: (e) => {
            e.preventDefault(); // Prevent form reload
            submitForm();
          },
        },
        [
          h("input", {
            type: "text",
            name: "username",
            value: state.username,
            onChange,
            className,
            placeholder: "Username",
          }),
          h("input", {
            type: "password",
            name: "password",
            value: state.password,
            onChange,
            className,
            placeholder: "Password",
          }),
          h(
            Button,
            {
              intent: Intent.PRIMARY,
              large: true,
              type: "submit",
              disabled: !isValid(state),
            },
            "Login"
          ),
        ]
      ),
    ]);
  }
}
function InnerPage() {
  return h("div", { className: "container" }, [
    h("div", { className: "login-wrapper" }, [h(LoginForm)]),
  ]);
}

export function Page() {
  return h(InnerPage);
}
