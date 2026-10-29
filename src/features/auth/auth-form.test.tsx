import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthForm } from "./auth-form";

vi.mock("./actions", () => ({
  signInAction: vi.fn(),
  signUpAction: vi.fn(),
}));

const copy = {
  fullName: "Full name",
  fullNamePlaceholder: "Your name",
  email: "University email",
  emailPlaceholder: "you@university.edu",
  password: "Password",
  passwordPlaceholder: "Enter your password",
  passwordHint: "At least 10 characters.",
  signIn: "Sign in",
  signUp: "Create account",
  signingIn: "Signing in…",
  signingUp: "Creating account…",
};

describe("AuthForm", () => {
  it("renders the minimum sign-in fields with the active locale", () => {
    render(<AuthForm copy={copy} locale="en" mode="sign-in" />);

    expect(screen.getByLabelText(copy.email)).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(screen.getByLabelText(copy.password)).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.queryByLabelText(copy.fullName)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.signIn })).toBeEnabled();
    expect(document.querySelector('input[name="locale"]')).toHaveValue("en");
  });

  it("adds name and password guidance for sign-up", () => {
    render(<AuthForm copy={copy} locale="ar" mode="sign-up" />);

    expect(screen.getByLabelText(copy.fullName)).toBeRequired();
    expect(screen.getByLabelText(copy.password)).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByText(copy.passwordHint)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.signUp })).toBeEnabled();
    expect(document.querySelector('input[name="locale"]')).toHaveValue("ar");
  });
});
