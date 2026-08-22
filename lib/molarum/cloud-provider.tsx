import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { validateQuestionBank } from "./validator";
import { useStudyLibrary } from "./provider";
import { isSupabaseConfigured, supabase } from "./supabase-client";

type CloudResult = { ok: true; message: string } | { ok: false; message: string };
type CloudRole = "learner" | "teacher" | null;

interface CloudContextValue {
  configured: boolean;
  ready: boolean;
  session: Session | null;
  role: CloudRole;
  isTeacher: boolean;
  signIn: (email: string, password: string) => Promise<CloudResult>;
  signUp: (email: string, password: string) => Promise<CloudResult>;
  signOut: () => Promise<void>;
  syncMyRecords: () => Promise<CloudResult>;
  pullActiveTeacherContent: () => Promise<CloudResult>;
  publishActiveQuestionBank: () => Promise<CloudResult>;
  publishReviewStates: () => Promise<CloudResult>;
  pickAndUploadSourceMaterial: () => Promise<CloudResult>;
  uploadLearnerReport: (uri: string) => Promise<CloudResult>;
}

const CloudContext = createContext<CloudContextValue | null>(null);

function failure(error: unknown): CloudResult {
  return { ok: false, message: error instanceof Error ? error.message : "Cloud operation could not be completed." };
}

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured for this build.");
  return supabase;
}

export function CloudProvider({ children }: PropsWithChildren) {
  const { activeBank, attempts, learnerProfile, importQuestionBank, reviewStates, setReviewState } = useStudyLibrary();
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<CloudRole>(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);

  const loadRole = useCallback(async (userId: string) => {
    const client = requireClient();
    const { data, error } = await client.from("molarum_roles").select("role").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    setRole(data?.role === "teacher" ? "teacher" : "learner");
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      if (initialSession) await loadRole(initialSession.user.id).catch(() => setRole(null));
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) loadRole(nextSession.user.id).catch(() => setRole(null));
      else setRole(null);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [loadRole]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const completeRedirect = async (url: string) => {
      const parsed = Linking.parse(url);
      const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;
      if (code) await client.auth.exchangeCodeForSession(url);
    };
    Linking.getInitialURL().then((url) => { if (url) completeRedirect(url).catch(() => undefined); });
    const subscription = Linking.addEventListener("url", ({ url }) => { completeRedirect(url).catch(() => undefined); });
    return () => subscription.remove();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<CloudResult> => {
    try {
      const client = requireClient();
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      return { ok: true, message: "Signed in. Your local records remain on this device until you choose Sync." };
    } catch (error) { return failure(error); }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<CloudResult> => {
    try {
      const client = requireClient();
      const { data, error } = await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: Linking.createURL("cloud") } });
      if (error) throw error;
      return { ok: true, message: data.session ? "Account created and signed in." : "Account created. Confirm the email, then sign in to sync." };
    } catch (error) { return failure(error); }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
  }, []);

  const syncMyRecords = useCallback(async (): Promise<CloudResult> => {
    try {
      const client = requireClient();
      if (!session) throw new Error("Sign in before syncing records.");
      const { error: profileError } = await client.from("molarum_profiles").update({ display_name: learnerProfile.name, class_name: learnerProfile.className, school: learnerProfile.school }).eq("id", session.user.id);
      if (profileError) throw profileError;
      if (attempts.length) {
        const rows = attempts.map((attempt) => ({ user_id: session.user.id, local_attempt_id: attempt.id, unit_key: attempt.unitKey, unit_title: attempt.unitTitle, completed_at: attempt.completedAt, correct: attempt.correct, total: attempt.total, timed: attempt.timed, elapsed_seconds: attempt.elapsedSeconds }));
        const { error } = await client.from("molarum_attempts").upsert(rows, { onConflict: "user_id,local_attempt_id" });
        if (error) throw error;
      }
      return { ok: true, message: `${attempts.length} local attempt${attempts.length === 1 ? "" : "s"} synced to your private cloud record.` };
    } catch (error) { return failure(error); }
  }, [attempts, learnerProfile, session]);

  const pullActiveTeacherContent = useCallback(async (): Promise<CloudResult> => {
    try {
      const client = requireClient();
      if (!session) throw new Error("Sign in before downloading managed content.");
      const { data: bankRow, error: bankError } = await client.from("molarum_question_banks").select("id,bank").eq("is_active", true).maybeSingle();
      if (bankError) throw bankError;
      if (!bankRow) return { ok: true, message: "No teacher-published cloud bank is active. Your local or bundled bank was not changed." };
      const accepted = await importQuestionBank(bankRow.bank);
      if (!accepted.accepted) throw new Error("The cloud bank failed local structural validation and was not activated.");
      const { data: reviews, error: reviewError } = await client.from("molarum_review_states").select("question_id,state").eq("bank_id", bankRow.id);
      if (reviewError) throw reviewError;
      reviews?.forEach((item) => setReviewState(item.question_id, item.state));
      return { ok: true, message: "Teacher-managed question bank and review states downloaded to this device." };
    } catch (error) { return failure(error); }
  }, [importQuestionBank, session, setReviewState]);

  const publishActiveQuestionBank = useCallback(async (): Promise<CloudResult> => {
    try {
      const client = requireClient();
      if (!session || role !== "teacher") throw new Error("A teacher account is required to publish a question bank.");
      if (!activeBank) throw new Error("There is no local validated question bank to publish.");
      const validation = validateQuestionBank(activeBank.bank);
      if (!validation.ok) throw new Error("The local bank no longer passes structural validation.");
      const version = `molarum-${new Date().toISOString()}`;
      const { data: inserted, error: insertError } = await client.from("molarum_question_banks").insert({ version, source_catalog_version: activeBank.bank.sourceCatalogVersion, bank: activeBank.bank, validation_report: activeBank.report, is_active: false, created_by: session.user.id }).select("id").single();
      if (insertError) throw insertError;
      const { error: retireError } = await client.from("molarum_question_banks").update({ is_active: false }).eq("is_active", true);
      if (retireError) throw retireError;
      const { error: activateError } = await client.from("molarum_question_banks").update({ is_active: true }).eq("id", inserted.id);
      if (activateError) throw activateError;
      return { ok: true, message: "The validated local bank is now the active teacher-managed cloud bank." };
    } catch (error) { return failure(error); }
  }, [activeBank, role, session]);

  const publishReviewStates = useCallback(async (): Promise<CloudResult> => {
    try {
      const client = requireClient();
      if (!session || role !== "teacher") throw new Error("A teacher account is required to publish review states.");
      const { data: active, error } = await client.from("molarum_question_banks").select("id").eq("is_active", true).single();
      if (error) throw error;
      const rows = Object.entries(reviewStates).map(([question_id, state]) => ({ bank_id: active.id, question_id, state, updated_by: session.user.id }));
      if (!rows.length) return { ok: true, message: "There are no local review states to publish." };
      const { error: upsertError } = await client.from("molarum_review_states").upsert(rows, { onConflict: "bank_id,question_id" });
      if (upsertError) throw upsertError;
      return { ok: true, message: `${rows.length} teacher review state${rows.length === 1 ? "" : "s"} published.` };
    } catch (error) { return failure(error); }
  }, [reviewStates, role, session]);

  const pickAndUploadSourceMaterial = useCallback(async (): Promise<CloudResult> => {
    try {
      const client = requireClient();
      if (!session || role !== "teacher") throw new Error("A teacher account is required to upload source material.");
      const selection = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "text/plain"], copyToCacheDirectory: true, multiple: false });
      if (selection.canceled) return { ok: true, message: "Source upload cancelled." };
      const asset = selection.assets[0];
      if ((asset.size ?? 0) > 25 * 1024 * 1024) throw new Error("Source files must be 25 MB or smaller.");
      const body = await fetch(asset.uri).then((response) => response.arrayBuffer());
      const objectName = `${session.user.id}/${Date.now()}-${asset.name.replace(/[^a-z0-9._-]+/gi, "-")}`;
      const { error } = await client.storage.from("molarum-source-materials").upload(objectName, body, { contentType: asset.mimeType ?? "application/octet-stream", upsert: false });
      if (error) throw error;
      return { ok: true, message: "Source material uploaded to the private teacher library." };
    } catch (error) { return failure(error); }
  }, [role, session]);

  const uploadLearnerReport = useCallback(async (uri: string): Promise<CloudResult> => {
    try {
      const client = requireClient();
      if (!session) throw new Error("Sign in before uploading a private learner report.");
      const body = await fetch(uri).then((response) => response.arrayBuffer());
      const objectName = `${session.user.id}/molarum-score-history-${Date.now()}.pdf`;
      const { error } = await client.storage.from("molarum-learner-reports").upload(objectName, body, { contentType: "application/pdf", upsert: false });
      if (error) throw error;
      return { ok: true, message: "The PDF report was uploaded to your private cloud folder." };
    } catch (error) { return failure(error); }
  }, [session]);

  const value = useMemo<CloudContextValue>(() => ({ configured: isSupabaseConfigured, ready, session, role, isTeacher: role === "teacher", signIn, signUp, signOut, syncMyRecords, pullActiveTeacherContent, publishActiveQuestionBank, publishReviewStates, pickAndUploadSourceMaterial, uploadLearnerReport }), [ready, session, role, signIn, signUp, signOut, syncMyRecords, pullActiveTeacherContent, publishActiveQuestionBank, publishReviewStates, pickAndUploadSourceMaterial, uploadLearnerReport]);
  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

export function useCloud() {
  const context = useContext(CloudContext);
  if (!context) throw new Error("useCloud must be used within CloudProvider.");
  return context;
}
