import React, { useState } from "react";
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

  const submitForm = async () => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });

      if (!res.ok) {
        if (res.status === 502) {
          setError("The Sparrow server is not available");
        } else {
          setError("Invalid credentials");
        }
        return;
      }

      // success
      setLoggedIn(true);
      setError(null);
    } catch (err) {
      setError("Something went wrong");
    }
  };

  const onChange = (e) => {
    if (!e.target) return;
    setState({ ...state, [e.target.name]: e.target.value });
  };

  const className = classNames(Classes.INPUT, "bp4-large");

  if (loggedIn) {
    return h("div", { className: "login-page" }, [
      h("h3", "You're already logged in."),
      h(
        Button,
        { intent: Intent.DANGER, onClick: () => setLoggedIn(false) },
        "Logout"
      ),
    ]);
  }

  return h("div", { className: "login-page" }, [
    h("h2", "Login"),
    error &&
      h(Callout, {
        className: "login-info",
        title: "Login Error",
        intent: Intent.DANGER,
        children: error,
      }),
    h("form.login-form", [
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
        onKeyUp(e) {
          if (e.key === "Enter") submitForm();
        },
      }),
      h(
        Button,
        {
          intent: Intent.PRIMARY,
          large: true,
          onClick: submitForm,
          disabled: !isValid(state),
        },
        "Login"
      ),
    ]),
  ]);
}
function InnerPage() {
  return h("div", { className: "container" }, [
    h("div", { className: "login-wrapper" }, [h(LoginForm)]),
  ]);
}

export function Page() {
  return h(InnerPage);
}
