import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import bundledQuestionBank from "@/assets/question-banks/grade10-source-grounded-bank.json";
import { subjectIdForQuestion } from "./catalog";
import { validateQuestionBank } from "./validator";
import type {
  LearnerProfile,
  LocalReviewState,
  QuestionBank,
  QuizAttempt,
  ReviewImportPayload,
  StudyQuestion,
  ValidatedQuestionBank,
  ValidationReport,
} from "./types";

const STORAGE_KEY = "molarum.local-study-library.v1";
const EMPTY_PROFILE: LearnerProfile = { name: "", className: "", school: "" };
const bundledBankValidation = validateQuestionBank(bundledQuestionBank);
const BUNDLED_BANK: ValidatedQuestionBank | null = bundledBankValidation.ok ? bundledBankValidation.value : null;
const PRIOR_BUNDLED_SOURCE_CATALOGS = new Set(["owner-drive-grade10-textbooks-2026-08-22"]);

interface StoredState {
  activeBank: ValidatedQuestionBank | null;
  reviewStates: Record<string, LocalReviewState>;
  learnerProfile: LearnerProfile;
  attempts: QuizAttempt[];
}

const EMPTY_STATE: StoredState = {
  activeBank: BUNDLED_BANK,
  reviewStates: {},
  learnerProfile: EMPTY_PROFILE,
  attempts: [],
};

interface StudyLibraryContextValue {
  ready: boolean;
  activeBank: ValidatedQuestionBank | null;
  questions: StudyQuestion[];
  reviewStates: Record<string, LocalReviewState>;
  learnerProfile: LearnerProfile;
  attempts: QuizAttempt[];
  importQuestionBank: (value: unknown) => { accepted: boolean; report: ValidationReport };
  resetToBundledContent: () => void;
  setReviewState: (questionId: string, state: LocalReviewState) => void;
  importReviewStates: (value: unknown) => { accepted: boolean; message: string };
  updateLearnerProfile: (profile: LearnerProfile) => void;
  saveAttempt: (attempt: Omit<QuizAttempt, "id" | "completedAt">) => string;
}

const StudyLibraryContext = createContext<StudyLibraryContextValue | null>(null);

function parseStoredState(value: string | null): StoredState {
  if (!value) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(value) as Partial<StoredState>;
    const savedBank = parsed.activeBank?.bank && parsed.activeBank?.report ? parsed.activeBank : null;
    const shouldUpgradePriorBundle = Boolean(savedBank && PRIOR_BUNDLED_SOURCE_CATALOGS.has(savedBank.bank.sourceCatalogVersion));
    return {
      activeBank: shouldUpgradePriorBundle ? BUNDLED_BANK : savedBank ?? BUNDLED_BANK,
      reviewStates: parsed.reviewStates ?? {},
      learnerProfile: { ...EMPTY_PROFILE, ...(parsed.learnerProfile ?? {}) },
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function StudyLibraryProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<StoredState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => setState(parseStoredState(value)))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [ready, state]);

  const importQuestionBank = useCallback((value: unknown) => {
    const result = validateQuestionBank(value);
    if (!result.ok) return { accepted: false, report: result.report };
    const validIds = new Set(result.value.bank.questions.map((question) => question.id));
    setState((previous) => ({
      ...previous,
      activeBank: result.value,
      reviewStates: Object.fromEntries(Object.entries(previous.reviewStates).filter(([id]) => validIds.has(id))),
    }));
    return { accepted: true, report: result.value.report };
  }, []);

  const resetToBundledContent = useCallback(() => {
    setState((previous) => ({ ...previous, activeBank: BUNDLED_BANK, reviewStates: {} }));
  }, []);

  const setReviewState = useCallback((questionId: string, reviewState: LocalReviewState) => {
    setState((previous) => ({ ...previous, reviewStates: { ...previous.reviewStates, [questionId]: reviewState } }));
  }, []);

  const importReviewStates = useCallback(
    (value: unknown) => {
      const input = Array.isArray(value) ? { reviews: value } : value;
      if (!input || typeof input !== "object" || !Array.isArray((input as ReviewImportPayload).reviews)) return { accepted: false, message: "Expected a JSON object with a reviews array." };
      const validIds = new Set((state.activeBank?.bank.questions ?? []).map((question) => question.id));
      const next: Record<string, LocalReviewState> = {};
      for (const item of (input as ReviewImportPayload).reviews) {
        if (!item || typeof item.questionId !== "string" || !["draft", "approved", "hidden"].includes(item.state) || !validIds.has(item.questionId)) return { accepted: false, message: "Every review item needs a known questionId and a state of draft, approved, or hidden. No changes were applied." };
        next[item.questionId] = item.state;
      }
      setState((previous) => ({ ...previous, reviewStates: { ...previous.reviewStates, ...next } }));
      return { accepted: true, message: `${Object.keys(next).length} review states imported locally.` };
    },
    [state.activeBank],
  );

  const updateLearnerProfile = useCallback((learnerProfile: LearnerProfile) => {
    setState((previous) => ({ ...previous, learnerProfile }));
  }, []);

  const saveAttempt = useCallback((attempt: Omit<QuizAttempt, "id" | "completedAt">) => {
    const id = `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const completedAt = new Date().toISOString();
    setState((previous) => ({ ...previous, attempts: [{ ...attempt, id, completedAt }, ...previous.attempts].slice(0, 200) }));
    return id;
  }, []);

  const questions = useMemo(() => {
    const activeQuestions = state.activeBank?.bank.questions ?? [];
    return activeQuestions.filter((question) => subjectIdForQuestion(question) !== null);
  }, [state.activeBank]);

  const value = useMemo<StudyLibraryContextValue>(
    () => ({
      ready,
      activeBank: state.activeBank,
      questions,
      reviewStates: state.reviewStates,
      learnerProfile: state.learnerProfile,
      attempts: state.attempts,
      importQuestionBank,
      resetToBundledContent,
      setReviewState,
      importReviewStates,
      updateLearnerProfile,
      saveAttempt,
    }),
    [ready, state, questions, importQuestionBank, resetToBundledContent, setReviewState, importReviewStates, updateLearnerProfile, saveAttempt],
  );

  return <StudyLibraryContext.Provider value={value}>{children}</StudyLibraryContext.Provider>;
}

export function useStudyLibrary() {
  const context = useContext(StudyLibraryContext);
  if (!context) throw new Error("useStudyLibrary must be used within StudyLibraryProvider.");
  return context;
}
