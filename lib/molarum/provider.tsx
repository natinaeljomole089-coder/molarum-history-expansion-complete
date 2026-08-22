import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import bundledQuestionBank from "@/assets/question-banks/grade10-source-grounded-bank.json";
import { subjectIdForQuestion } from "./catalog";
import { validateQuestionBank } from "./validator";
import type {
  LearnerProfile,
  LocalReviewState,
  ActiveBankOrigin,
  InProgressQuiz,
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
const PRIOR_BUNDLED_SOURCE_CATALOGS = new Set([
  "owner-drive-grade10-textbooks-2026-08-22",
  "owner-drive-grade10-textbooks-2026-08-22-expanded",
]);
const KNOWN_BUNDLED_SOURCE_CATALOGS = new Set([
  ...PRIOR_BUNDLED_SOURCE_CATALOGS,
  "owner-drive-grade10-textbooks-2026-08-22-full-expanded",
]);

interface StoredState {
  activeBank: ValidatedQuestionBank | null;
  activeBankOrigin: Exclude<ActiveBankOrigin, "none">;
  reviewStates: Record<string, LocalReviewState>;
  learnerProfile: LearnerProfile;
  attempts: QuizAttempt[];
  inProgressQuiz: InProgressQuiz | null;
}

const EMPTY_STATE: StoredState = {
  activeBank: BUNDLED_BANK,
  activeBankOrigin: "packaged",
  reviewStates: {},
  learnerProfile: EMPTY_PROFILE,
  attempts: [],
  inProgressQuiz: null,
};

interface StudyLibraryContextValue {
  ready: boolean;
  activeBank: ValidatedQuestionBank | null;
  activeBankOrigin: ActiveBankOrigin;
  bundledQuestionCount: number;
  questions: StudyQuestion[];
  reviewStates: Record<string, LocalReviewState>;
  learnerProfile: LearnerProfile;
  attempts: QuizAttempt[];
  inProgressQuiz: InProgressQuiz | null;
  previewQuestionBank: (value: unknown) => ReturnType<typeof validateQuestionBank>;
  activateQuestionBank: (validated: ValidatedQuestionBank) => void;
  importQuestionBank: (value: unknown) => { accepted: boolean; report: ValidationReport };
  resetToBundledContent: () => void;
  setReviewState: (questionId: string, state: LocalReviewState) => void;
  importReviewStates: (value: unknown) => { accepted: boolean; message: string };
  updateLearnerProfile: (profile: LearnerProfile) => void;
  saveAttempt: (attempt: Omit<QuizAttempt, "id" | "completedAt">) => string;
  clearAttempts: () => void;
  saveInProgressQuiz: (quiz: InProgressQuiz) => void;
  discardInProgressQuiz: () => void;
}

const StudyLibraryContext = createContext<StudyLibraryContextValue | null>(null);

function parseStoredState(value: string | null): StoredState {
  if (!value) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(value) as Partial<StoredState>;
    const savedBank = parsed.activeBank?.bank && parsed.activeBank?.report ? parsed.activeBank : null;
    const shouldUpgradePriorBundle = Boolean(savedBank && PRIOR_BUNDLED_SOURCE_CATALOGS.has(savedBank.bank.sourceCatalogVersion));
    const inferredOrigin: Exclude<ActiveBankOrigin, "none"> =
      parsed.activeBankOrigin === "packaged" || parsed.activeBankOrigin === "imported"
        ? parsed.activeBankOrigin
        : savedBank && KNOWN_BUNDLED_SOURCE_CATALOGS.has(savedBank.bank.sourceCatalogVersion)
          ? "packaged"
          : "imported";
    return {
      activeBank: shouldUpgradePriorBundle ? BUNDLED_BANK : savedBank ?? BUNDLED_BANK,
      activeBankOrigin: shouldUpgradePriorBundle || !savedBank ? "packaged" : inferredOrigin,
      reviewStates: parsed.reviewStates ?? {},
      learnerProfile: { ...EMPTY_PROFILE, ...(parsed.learnerProfile ?? {}) },
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      inProgressQuiz: parsed.inProgressQuiz && typeof parsed.inProgressQuiz.unitKey === "string" ? parsed.inProgressQuiz : null,
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

  const previewQuestionBank = useCallback((value: unknown) => validateQuestionBank(value), []);

  const activateQuestionBank = useCallback((validated: ValidatedQuestionBank) => {
    const validIds = new Set(validated.bank.questions.map((question) => question.id));
    setState((previous) => ({
      ...previous,
      activeBank: validated,
      activeBankOrigin: "imported",
      inProgressQuiz: null,
      reviewStates: Object.fromEntries(Object.entries(previous.reviewStates).filter(([id]) => validIds.has(id))),
    }));
  }, []);

  const importQuestionBank = useCallback((value: unknown) => {
    const result = previewQuestionBank(value);
    if (!result.ok) return { accepted: false, report: result.report };
    activateQuestionBank(result.value);
    return { accepted: true, report: result.value.report };
  }, [activateQuestionBank, previewQuestionBank]);

  const resetToBundledContent = useCallback(() => {
    setState((previous) => ({ ...previous, activeBank: BUNDLED_BANK, activeBankOrigin: "packaged", reviewStates: {}, inProgressQuiz: null }));
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
    setState((previous) => ({
      ...previous,
      attempts: [{ ...attempt, id, completedAt }, ...previous.attempts].slice(0, 200),
      inProgressQuiz: previous.inProgressQuiz?.unitKey === attempt.unitKey ? null : previous.inProgressQuiz,
    }));
    return id;
  }, []);

  const clearAttempts = useCallback(() => {
    setState((previous) => ({ ...previous, attempts: [] }));
  }, []);

  const saveInProgressQuiz = useCallback((inProgressQuiz: InProgressQuiz) => {
    setState((previous) => ({ ...previous, inProgressQuiz }));
  }, []);

  const discardInProgressQuiz = useCallback(() => {
    setState((previous) => ({ ...previous, inProgressQuiz: null }));
  }, []);

  const questions = useMemo(() => {
    const activeQuestions = state.activeBank?.bank.questions ?? [];
    return activeQuestions.filter((question) => subjectIdForQuestion(question) !== null);
  }, [state.activeBank]);

  const value = useMemo<StudyLibraryContextValue>(
    () => ({
      ready,
      activeBank: state.activeBank,
      activeBankOrigin: state.activeBank ? state.activeBankOrigin : "none",
      bundledQuestionCount: BUNDLED_BANK?.bank.questions.length ?? 0,
      questions,
      reviewStates: state.reviewStates,
      learnerProfile: state.learnerProfile,
      attempts: state.attempts,
      inProgressQuiz: state.inProgressQuiz,
      previewQuestionBank,
      activateQuestionBank,
      importQuestionBank,
      resetToBundledContent,
      setReviewState,
      importReviewStates,
      updateLearnerProfile,
      saveAttempt,
      clearAttempts,
      saveInProgressQuiz,
      discardInProgressQuiz,
    }),
    [ready, state, questions, previewQuestionBank, activateQuestionBank, importQuestionBank, resetToBundledContent, setReviewState, importReviewStates, updateLearnerProfile, saveAttempt, clearAttempts, saveInProgressQuiz, discardInProgressQuiz],
  );

  return <StudyLibraryContext.Provider value={value}>{children}</StudyLibraryContext.Provider>;
}

export function useStudyLibrary() {
  const context = useContext(StudyLibraryContext);
  if (!context) throw new Error("useStudyLibrary must be used within StudyLibraryProvider.");
  return context;
}
