import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import bundledQuestionBank from "@/assets/question-banks/grade10-source-grounded-bank.json";
import { createBankDescriptor, PRIOR_BUNDLED_SOURCE_CATALOGS, readActiveBankRecord, shouldUpgradeStagedPackagedBank, stageAndActivateBank, type KeyValueStore } from "./bank-storage";
import { subjectIdForQuestion } from "./catalog";
import { validateQuestionBank } from "./validator";
import type {
  ActiveBankOrigin,
  BankDescriptor,
  InProgressQuiz,
  LearnerProfile,
  QuizAttempt,
  StudyQuestion,
  ValidatedQuestionBank,
  ValidationReport,
} from "./types";

const STORAGE_KEY = "molarum.local-study-library.v1";
const EMPTY_PROFILE: LearnerProfile = { name: "", className: "", school: "" };
const bundledBankValidation = validateQuestionBank(bundledQuestionBank);
const BUNDLED_BANK: ValidatedQuestionBank | null = bundledBankValidation.ok ? bundledBankValidation.value : null;
const BUNDLED_DESCRIPTOR = BUNDLED_BANK ? createBankDescriptor(BUNDLED_BANK, "packaged_validated") : null;
const KNOWN_BUNDLED_SOURCE_CATALOGS = new Set([...PRIOR_BUNDLED_SOURCE_CATALOGS, "owner-drive-grade10-textbooks-2026-08-22-full-expanded-continuation-1"]);

interface StoredState {
  activeBank: ValidatedQuestionBank | null;
  bankDescriptor: BankDescriptor | null;
  learnerProfile: LearnerProfile;
  attempts: QuizAttempt[];
  inProgressQuiz: InProgressQuiz | null;
}

const EMPTY_STATE: StoredState = {
  activeBank: BUNDLED_BANK,
  bankDescriptor: BUNDLED_DESCRIPTOR,
  learnerProfile: EMPTY_PROFILE,
  attempts: [],
  inProgressQuiz: null,
};

interface StudyLibraryContextValue {
  ready: boolean;
  activeBank: ValidatedQuestionBank | null;
  activeBankOrigin: ActiveBankOrigin;
  bankDescriptor: BankDescriptor | null;
  bundledQuestionCount: number;
  questions: StudyQuestion[];
  learnerProfile: LearnerProfile;
  attempts: QuizAttempt[];
  inProgressQuiz: InProgressQuiz | null;
  previewQuestionBank: (value: unknown) => ReturnType<typeof validateQuestionBank>;
  activateQuestionBank: (validated: ValidatedQuestionBank) => Promise<void>;
  importQuestionBank: (value: unknown) => Promise<{ accepted: boolean; report: ValidationReport }>;
  resetToBundledContent: () => Promise<void>;
  updateLearnerProfile: (profile: LearnerProfile) => void;
  saveAttempt: (attempt: Omit<QuizAttempt, "id" | "completedAt" | "bankId" | "bankOrigin" | "bankSourceCatalogVersion">) => string;
  clearAttempts: () => void;
  saveInProgressQuiz: (quiz: Omit<InProgressQuiz, "schemaVersion" | "bankId" | "bankOrigin" | "bankSourceCatalogVersion">) => void;
  discardInProgressQuiz: () => void;
}

const StudyLibraryContext = createContext<StudyLibraryContextValue | null>(null);

function legacyDescriptor(activeBank: ValidatedQuestionBank | null, legacyOrigin?: unknown) {
  if (!activeBank) return null;
  const sourceCatalogVersion = activeBank.bank.sourceCatalogVersion;
  const origin: Exclude<ActiveBankOrigin, "none"> = legacyOrigin === "imported" || legacyOrigin === "imported_draft"
    ? "imported_draft"
    : KNOWN_BUNDLED_SOURCE_CATALOGS.has(sourceCatalogVersion) ? "packaged_validated" : "imported_draft";
  return createBankDescriptor(activeBank, origin);
}

function normalizeAttempt(attempt: QuizAttempt, descriptor: BankDescriptor | null): QuizAttempt {
  if (attempt.bankId && attempt.bankOrigin && attempt.bankSourceCatalogVersion) return attempt;
  return { ...attempt, bankId: "legacy-unattributed", bankOrigin: "none", bankSourceCatalogVersion: descriptor?.sourceCatalogVersion ?? "legacy-unknown" };
}

function parseStoredState(value: string | null): StoredState {
  if (!value) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(value) as Partial<StoredState> & { activeBankOrigin?: unknown };
    const savedBank = parsed.activeBank?.bank && parsed.activeBank?.report ? parsed.activeBank : null;
    const shouldUpgradePriorBundle = Boolean(savedBank && PRIOR_BUNDLED_SOURCE_CATALOGS.has(savedBank.bank.sourceCatalogVersion));
    const activeBank = shouldUpgradePriorBundle ? BUNDLED_BANK : savedBank ?? BUNDLED_BANK;
    const bankDescriptor = shouldUpgradePriorBundle ? BUNDLED_DESCRIPTOR : parsed.bankDescriptor ?? legacyDescriptor(activeBank, parsed.activeBankOrigin);
    return {
      activeBank,
      bankDescriptor,
      learnerProfile: { ...EMPTY_PROFILE, ...(parsed.learnerProfile ?? {}) },
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts.map((attempt) => normalizeAttempt(attempt, bankDescriptor)) : [],
      inProgressQuiz: parsed.inProgressQuiz && typeof parsed.inProgressQuiz.unitKey === "string" ? parsed.inProgressQuiz : null,
    };
  } catch {
    return EMPTY_STATE;
  }
}

function libraryStore(): KeyValueStore {
  return AsyncStorage as KeyValueStore;
}

export function StudyLibraryProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<StoredState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      const legacy = parseStoredState(await AsyncStorage.getItem(STORAGE_KEY));
      const staged = await readActiveBankRecord(libraryStore()).catch(() => null);
      const upgradeStagedBundle = shouldUpgradeStagedPackagedBank(staged);
      const next = staged && !upgradeStagedBundle ? { ...legacy, activeBank: staged.activeBank, bankDescriptor: staged.descriptor } : legacy;
      if ((!staged || upgradeStagedBundle) && next.activeBank && next.bankDescriptor) {
        try { await stageAndActivateBank(libraryStore(), next.activeBank, next.bankDescriptor.origin); } catch { /* last-known-good in-memory bank remains usable */ }
      }
      if (mounted) setState(next);
    };
    hydrate().finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const { activeBank: _activeBank, ...metadata } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(metadata)).catch(() => undefined);
  }, [ready, state]);

  const previewQuestionBank = useCallback((value: unknown) => validateQuestionBank(value), []);

  const activateQuestionBank = useCallback(async (validated: ValidatedQuestionBank) => {
    const descriptor = await stageAndActivateBank(libraryStore(), validated, "imported_draft");
    setState((previous) => ({ ...previous, activeBank: validated, bankDescriptor: descriptor }));
  }, []);

  const importQuestionBank = useCallback(async (value: unknown) => {
    const result = previewQuestionBank(value);
    if (!result.ok) return { accepted: false, report: result.report };
    await activateQuestionBank(result.value);
    return { accepted: true, report: result.value.report };
  }, [activateQuestionBank, previewQuestionBank]);

  const resetToBundledContent = useCallback(async () => {
    if (!BUNDLED_BANK) throw new Error("The packaged validated bank is unavailable.");
    const descriptor = await stageAndActivateBank(libraryStore(), BUNDLED_BANK, "packaged_validated");
    setState((previous) => ({ ...previous, activeBank: BUNDLED_BANK, bankDescriptor: descriptor }));
  }, []);

  const updateLearnerProfile = useCallback((learnerProfile: LearnerProfile) => setState((previous) => ({ ...previous, learnerProfile })), []);

  const saveAttempt = useCallback((attempt: Omit<QuizAttempt, "id" | "completedAt" | "bankId" | "bankOrigin" | "bankSourceCatalogVersion">) => {
    const id = `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const completedAt = new Date().toISOString();
    setState((previous) => {
      const descriptor = previous.bankDescriptor;
      const storedAttempt: QuizAttempt = { ...attempt, id, completedAt, bankId: descriptor?.bankId ?? "no-active-bank", bankOrigin: descriptor?.origin ?? "none", bankSourceCatalogVersion: descriptor?.sourceCatalogVersion ?? "no-active-bank" };
      return { ...previous, attempts: [storedAttempt, ...previous.attempts].slice(0, 200), inProgressQuiz: previous.inProgressQuiz?.unitKey === attempt.unitKey ? null : previous.inProgressQuiz };
    });
    return id;
  }, []);

  const clearAttempts = useCallback(() => setState((previous) => ({ ...previous, attempts: [] })), []);

  const saveInProgressQuiz = useCallback((quiz: Omit<InProgressQuiz, "schemaVersion" | "bankId" | "bankOrigin" | "bankSourceCatalogVersion">) => {
    setState((previous) => {
      const descriptor = previous.bankDescriptor;
      if (!descriptor) return previous;
      return { ...previous, inProgressQuiz: { ...quiz, schemaVersion: 1, bankId: descriptor.bankId, bankOrigin: descriptor.origin, bankSourceCatalogVersion: descriptor.sourceCatalogVersion } };
    });
  }, []);

  const discardInProgressQuiz = useCallback(() => setState((previous) => ({ ...previous, inProgressQuiz: null })), []);

  const questions = useMemo(() => (state.activeBank?.bank.questions ?? []).filter((question) => subjectIdForQuestion(question) !== null), [state.activeBank]);
  const value = useMemo<StudyLibraryContextValue>(() => ({
    ready,
    activeBank: state.activeBank,
    activeBankOrigin: state.bankDescriptor?.origin ?? "none",
    bankDescriptor: state.bankDescriptor,
    bundledQuestionCount: BUNDLED_BANK?.bank.questions.length ?? 0,
    questions,
    learnerProfile: state.learnerProfile,
    attempts: state.attempts,
    inProgressQuiz: state.inProgressQuiz,
    previewQuestionBank,
    activateQuestionBank,
    importQuestionBank,
    resetToBundledContent,
    updateLearnerProfile,
    saveAttempt,
    clearAttempts,
    saveInProgressQuiz,
    discardInProgressQuiz,
  }), [ready, state, questions, previewQuestionBank, activateQuestionBank, importQuestionBank, resetToBundledContent, updateLearnerProfile, saveAttempt, clearAttempts, saveInProgressQuiz, discardInProgressQuiz]);

  return <StudyLibraryContext.Provider value={value}>{children}</StudyLibraryContext.Provider>;
}

export function useStudyLibrary() {
  const context = useContext(StudyLibraryContext);
  if (!context) throw new Error("useStudyLibrary must be used within StudyLibraryProvider.");
  return context;
}
