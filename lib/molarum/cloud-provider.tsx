import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { useStudyLibrary } from "./provider";
import { isSupabaseConfigured, LEARNER_BACKUP_BUCKET, supabase } from "./supabase-client";

type CloudResult = { ok: true; message: string } | { ok: false; message: string };

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

function failure(error: unknown): CloudResult {
  const detail = error instanceof Error ? error.message : "";
  if (/network|fetch|timeout|offline|internet/i.test(detail)) {
    return { ok: false, message: "Could not reach cloud backup. Your learning is still saved on this device." };
  }
  return { ok: false, message: detail || "Cloud backup could not be completed. Your learning is still saved on this device." };
}

function validateCredentials(email: string, password: string): string | null {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email address.";
  if (password.length < 8) return "Use a password with at least 8 characters.";
  return null;
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
    }).catch(() => {
      if (mounted) setReady(true);
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<CloudResult> => {
    const validation = validateCredentials(email, password);
    if (validation) return { ok: false, message: validation };
    if (!supabase) return unavailable();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      return { ok: true, message: "Signed in. Choose Back up learning to save your local progress." };
    } catch (error) { return failure(error); }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<CloudResult> => {
    const validation = validateCredentials(email, password);
    if (validation) return { ok: false, message: validation };
    if (!supabase) return unavailable();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: displayName.trim() } },
      });
      if (error) throw error;
      return { ok: true, message: data.session ? "Account created and signed in." : "Account created. Check your email, then sign in to use cloud backup." };
    } catch (error) { return failure(error); }
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
