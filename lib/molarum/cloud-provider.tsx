import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";

import { isAuthCallback, loginFailureMessage, validateLoginCredentials, type AuthFeedback } from "./auth-helpers";
import { useStudyLibrary } from "./provider";
import { isSupabaseConfigured, LEARNER_BACKUP_BUCKET, supabase } from "./supabase-client";

type CloudResult = AuthFeedback;

interface CloudContextValue {
  configured: boolean;
  ready: boolean;
  session: Session | null;
  lastSyncedAt: string | null;
  signIn: (email: string, password: string) => Promise<CloudResult>;
  signUp: (email: string, password: string, displayName: string) => Promise<CloudResult>;
  signOut: () => Promise<CloudResult>;
  syncNow: () => Promise<CloudResult>;
  uploadPrivateBackup: () => Promise<CloudResult>;
}

const CloudContext = createContext<CloudContextValue | null>(null);

function unavailable(message = "Cloud backup is not available in this build. Your learning stays safely on this device."): CloudResult {
  return { ok: false, message };
}

function failure(error: unknown, operation: "signIn" | "signUp" | "session" = "signIn"): CloudResult {
  if (error instanceof Error) console.warn(`[Molarum cloud ${operation}]`, error.message);
  return { ok: false, message: loginFailureMessage(error, operation) };
}

export function CloudProvider({ children }: PropsWithChildren) {
  const { attempts, learnerProfile } = useStudyLibrary();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let mounted = true;
    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setReady(true);
    }).catch((error) => {
      if (mounted) {
        console.warn("[Molarum cloud session]", loginFailureMessage(error, "session"));
        setReady(true);
      }
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client || Platform.OS === "web") return;
    let mounted = true;
    const handleAuthUrl = async (url: string) => {
      if (!isAuthCallback(url)) return;
      const { queryParams } = Linking.parse(url);
      const code = typeof queryParams?.code === "string" ? queryParams.code : null;
      if (!code) return;
      const { data, error } = await client.auth.exchangeCodeForSession(url);
      if (error) {
        console.warn("[Molarum cloud confirmation]", loginFailureMessage(error, "session"));
        return;
      }
      if (mounted) setSession(data.session);
    };
    Linking.getInitialURL().then((url) => { if (url) handleAuthUrl(url).catch(() => undefined); });
    const subscription = Linking.addEventListener("url", ({ url }) => { handleAuthUrl(url).catch(() => undefined); });
    return () => { mounted = false; subscription.remove(); };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<CloudResult> => {
    const validation = validateLoginCredentials(email, password);
    if (validation) return { ok: false, message: validation };
    if (!supabase) return unavailable();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      return { ok: true, message: "Signed in. Choose Back up learning to save your local progress." };
    } catch (error) { return failure(error, "signIn"); }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<CloudResult> => {
    const validation = validateLoginCredentials(email, password);
    if (validation) return { ok: false, message: validation };
    if (!supabase) return unavailable();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: Linking.createURL("auth/callback"),
        },
      });
      if (error) throw error;
      return { ok: true, message: data.session ? "Account created and signed in." : "Account created. Open the confirmation email on this device to return to Molarum." };
    } catch (error) { return failure(error, "signUp"); }
  }, []);

  const signOut = useCallback(async (): Promise<CloudResult> => {
    if (!supabase) return unavailable();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setLastSyncedAt(null);
      return { ok: true, message: "Signed out. Your learning remains available on this device." };
    } catch (error) { return failure(error); }
  }, []);

  const syncNow = useCallback(async (): Promise<CloudResult> => {
    if (!supabase || !session) return unavailable("Sign in to back up your learning. Offline study remains available without an account.");
    try {
      const { error: profileError } = await supabase.from("molarum_profiles")
        .update({ display_name: learnerProfile.name, class_name: learnerProfile.className, school: learnerProfile.school })
        .eq("id", session.user.id);
      if (profileError) throw profileError;
      if (attempts.length) {
        const rows = attempts.map((attempt) => ({
          user_id: session.user.id,
          local_attempt_id: attempt.id,
          unit_key: attempt.unitKey,
          unit_title: attempt.unitTitle,
          completed_at: attempt.completedAt,
          correct: attempt.correct,
          total: attempt.total,
          timed: attempt.timed,
          elapsed_seconds: attempt.elapsedSeconds,
        }));
        const { error: attemptsError } = await supabase.from("molarum_attempts").upsert(rows, { onConflict: "user_id,local_attempt_id" });
        if (attemptsError) throw attemptsError;
      }
      const syncedAt = new Date().toISOString();
      setLastSyncedAt(syncedAt);
      return { ok: true, message: `${attempts.length} practice record${attempts.length === 1 ? "" : "s"} backed up privately.` };
    } catch (error) { return failure(error); }
  }, [attempts, learnerProfile, session]);

  const uploadPrivateBackup = useCallback(async (): Promise<CloudResult> => {
    if (!supabase || !session) return unavailable("Sign in to save a private learning backup. Offline study remains available without an account.");
    try {
      const backup = JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), learnerProfile, attempts }, null, 2);
      const path = `${session.user.id}/molarum-learning-backup-${Date.now()}.json`;
      const { error } = await supabase.storage.from(LEARNER_BACKUP_BUCKET).upload(path, backup, { contentType: "application/json", upsert: false });
      if (error) throw error;
      return { ok: true, message: "A private learning backup was saved to your cloud storage." };
    } catch (error) { return failure(error); }
  }, [attempts, learnerProfile, session]);

  const value = useMemo<CloudContextValue>(() => ({
    configured: isSupabaseConfigured,
    ready,
    session,
    lastSyncedAt,
    signIn,
    signUp,
    signOut,
    syncNow,
    uploadPrivateBackup,
  }), [lastSyncedAt, ready, session, signIn, signOut, signUp, syncNow, uploadPrivateBackup]);

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

export function useCloud() {
  const context = useContext(CloudContext);
  if (!context) throw new Error("useCloud must be used within CloudProvider.");
  return context;
}
