export type AuthFeedback = { ok: true; message: string } | { ok: false; message: string };

export function validateLoginCredentials(email: string, password: string): string | null {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email address.";
  if (password.length < 8) return "Use a password with at least 8 characters.";
  return null;
}

export function loginFailureMessage(error: unknown, operation: "signIn" | "signUp" | "session" = "signIn"): string {
  const detail = error instanceof Error ? error.message.toLowerCase() : "";
  if (/network|fetch|timeout|offline|internet|failed to connect/.test(detail)) {
    return "Could not reach your backup account. Your learning is still saved on this device.";
  }
  if (/invalid login credentials|invalid credentials/.test(detail)) {
    return "That email or password did not work. Check it and try again.";
  }
  if (/email not confirmed|email.*confirm/.test(detail)) {
    return "Confirm your email first, then return here to sign in.";
  }
  if (/already registered|already exists|user already/.test(detail)) {
    return "An account already uses that email. Choose Sign in instead.";
  }
  if (/signup.*disabled|signups.*disabled/.test(detail)) {
    return "Account creation is unavailable right now. You can keep studying offline.";
  }
  if (/rate limit|too many requests/.test(detail)) {
    return "Please wait a moment before trying again.";
  }
  if (/password.*weak|password.*least|password.*short/.test(detail)) {
    return "Choose a stronger password with at least 8 characters.";
  }
  if (operation === "signUp") return "Could not create your account. Please try again later.";
  if (operation === "session") return "Could not restore your backup account. Your learning is still saved on this device.";
  return "Could not sign in right now. Your learning is still saved on this device.";
}

export function isAuthCallback(url: string): boolean {
  return /(?:^|[/])auth\/callback(?:[?#]|$)/.test(url);
}
