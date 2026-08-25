import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Supabase mobile configuration", () => {
  it("initializes safely without browser storage during server rendering", () => {
    const source = readFileSync(resolve(process.cwd(), "lib/molarum/supabase-client.ts"), "utf8");
    expect(source).toContain('const isServerRender = typeof window === "undefined"');
    expect(source).toContain("persistSession: false");
  });

  it("accepts the configured publishable key at the Auth settings endpoint", async () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(url).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i);
    expect(publishableKey).toBeTruthy();

    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: publishableKey! },
    });

    expect(response.ok).toBe(true);
  });
});
