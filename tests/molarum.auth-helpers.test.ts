import { describe, expect, it } from "vitest";

import { isAuthCallback, loginFailureMessage, validateLoginCredentials } from "../lib/molarum/auth-helpers";

describe("Molarum optional login safeguards", () => {
  it("validates credentials before requesting Supabase", () => {
    expect(validateLoginCredentials("not-an-email", "password123")).toBe("Enter a valid email address.");
    expect(validateLoginCredentials("learner@example.com", "short")).toBe("Use a password with at least 8 characters.");
    expect(validateLoginCredentials("learner@example.com", "password123")).toBeNull();
  });

  it("maps raw Supabase failures to safe student-facing recovery messages", () => {
    expect(loginFailureMessage(new Error("Invalid login credentials"))).toContain("email or password");
    expect(loginFailureMessage(new Error("Email not confirmed"))).toContain("Confirm your email");
    expect(loginFailureMessage(new Error("network request failed"))).toContain("saved on this device");
    expect(loginFailureMessage(new Error("User already registered"), "signUp")).toContain("already uses that email");
  });

  it("recognizes only the internal confirmation callback route", () => {
    expect(isAuthCallback("molarum://auth/callback?code=one-time-code")).toBe(true);
    expect(isAuthCallback("molarum://profile")).toBe(false);
  });
});
