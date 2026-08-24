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
const KNOWN_BUNDLED_SOURCE_CATALOGS = new Set([...PRIOR_BUNDLED_SOURCE_CATALOGS, "owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-4"]);

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSavedBank(value: unknown): ValidatedQuestionBank | null {
  if (!isRecord(value) || !isRecord(value.bank)) return null;
  const result = validateQuestionBank(value.bank);
  return result.ok ? result.value : null;
}

function isBankDescriptor(value: unknown): value is BankDescriptor {
  if (!isRecord(value)) return false;
  const questionCount = value.questionCount;
  return typeof value.bankId === "string"
    && value.bankId.length > 0
    && (value.origin === "packaged_validated" || value.origin === "imported_draft")
    && typeof value.sourceCatalogVersion === "string"
    && typeof questionCount === "number"
    && Number.isInteger(questionCount)
    && questionCount > 0;
}

function parseStoredAttempt(value: unknown, descriptor: BankDescriptor | null): QuizAttempt | null {
  if (!isRecord(value)) return null;
  const correct = value.correct;
  const total = value.total;
  const elapsedSeconds = value.elapsedSeconds;
  if (typeof value.id !== "string" || !value.id || typeof value.unitKey !== "string" || !value.unitKey || typeof value.unitTitle !== "string" || typeof value.completedAt !== "string") return null;
  if (typeof correct !== "number" || !Number.isInteger(correct) || typeof total !== "number" || !Number.isInteger(total) || total <= 0 || correct < 0 || correct > total) return null;
  if (typeof value.timed !== "boolean" || typeof elapsedSeconds !== "number" || !Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) return null;
  if (value.bankId !== undefined && typeof value.bankId !== "string") return null;
  if (value.bankOrigin !== undefined && value.bankOrigin !== "packaged_validated" && value.bankOrigin !== "imported_draft" && value.bankOrigin !== "none") return null;
  if (value.bankSourceCatalogVersion !== undefined && typeof value.bankSourceCatalogVersion !== "string") return null;
  return normalizeAttempt({
    id: value.id,
    unitKey: value.unitKey,
    unitTitle: value.unitTitle,
    completedAt: value.completedAt,
    correct,
    total,
    timed: value.timed,
    elapsedSeconds,
    bankId: typeof value.bankId === "string" ? value.bankId : "",
    bankOrigin: value.bankOrigin === "packaged_validated" || value.bankOrigin === "imported_draft" || value.bankOrigin === "none" ? value.bankOrigin : "none",
    bankSourceCatalogVersion: typeof value.bankSourceCatalogVersion === "string" ? value.bankSourceCatalogVersion : "",
  }, descriptor);
}

function parseStoredQuiz(value: unknown): InProgressQuiz | null {
  if (!isRecord(value)) return null;
  const difficulty = value.difficulty;
  const bankOrigin = value.bankOrigin;
  const index = value.index;
  const correctCount = value.correctCount;
  const elapsedSeconds = value.elapsedSeconds;
  if (value.schemaVersion !== 1 || typeof value.bankId !== "string" || !value.bankId || (bankOrigin !== "packaged_validated" && bankOrigin !== "imported_draft" && bankOrigin !== "none") || typeof value.bankSourceCatalogVersion !== "string" || typeof value.unitKey !== "string" || !value.unitKey || typeof value.unitTitle !== "string" || (difficulty !== "easy" && difficulty !== "medium" && difficulty !== "hard" && difficulty !== "mixed") || typeof value.timed !== "boolean" || !Array.isArray(value.queueQuestionIds) || !value.queueQuestionIds.every((id) => typeof id === "string" && id.length > 0) || typeof index !== "number" || !Number.isInteger(index) || typeof correctCount !== "number" || !Number.isInteger(correctCount) || typeof elapsedSeconds !== "number" || !Number.isFinite(elapsedSeconds) || elapsedSeconds < 0 || typeof value.response !== "string" || typeof value.submitted !== "boolean" || typeof value.startedAt !== "string" || typeof value.updatedAt !== "string") return null;
  return value as unknown as InProgressQuiz;
}

function parseStoredState(value: string | null): StoredState {
  if (!value) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed)) return EMPTY_STATE;
    const savedBank = parseSavedBank(parsed.activeBank);
    const shouldUpgradePriorBundle = Boolean(savedBank && PRIOR_BUNDLED_SOURCE_CATALOGS.has(savedBank.bank.sourceCatalogVersion));
    const activeBank = shouldUpgradePriorBundle ? BUNDLED_BANK : savedBank ?? BUNDLED_BANK;
    const bankDescriptor = shouldUpgradePriorBundle ? BUNDLED_DESCRIPTOR : isBankDescriptor(parsed.bankDescriptor) ? parsed.bankDescriptor : legacyDescriptor(activeBank, parsed.activeBankOrigin);
    const learnerProfile = isRecord(parsed.learnerProfile)
      ? {
          name: typeof parsed.learnerProfile.name === "string" ? parsed.learnerProfile.name : EMPTY_PROFILE.name,
          className: typeof parsed.learnerProfile.className === "string" ? parsed.learnerProfile.className : EMPTY_PROFILE.className,
          school: typeof parsed.learnerProfile.school === "string" ? parsed.learnerProfile.school : EMPTY_PROFILE.school,
        }
      : EMPTY_PROFILE;
    const attempts = Array.isArray(parsed.attempts)
      ? parsed.attempts.map((attempt) => parseStoredAttempt(attempt, bankDescriptor)).filter((attempt): attempt is QuizAttempt => Boolean(attempt))
      : [];
    return {
      activeBank,
      bankDescriptor,
      learnerProfile,
      attempts,
      inProgressQuiz: parseStoredQuiz(parsed.inProgressQuiz),
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
      const nextQuiz: InProgressQuiz = { ...quiz, schemaVersion: 1, bankId: descriptor.bankId, bankOrigin: descriptor.origin, bankSourceCatalogVersion: descriptor.sourceCatalogVersion };
      const currentQuiz = previous.inProgressQuiz;
      const unchanged = currentQuiz
        && currentQuiz.unitKey === nextQuiz.unitKey
        && currentQuiz.unitTitle === nextQuiz.unitTitle
        && currentQuiz.difficulty === nextQuiz.difficulty
        && currentQuiz.timed === nextQuiz.timed
        && currentQuiz.index === nextQuiz.index
        && currentQuiz.response === nextQuiz.response
        && currentQuiz.submitted === nextQuiz.submitted
        && currentQuiz.correctCount === nextQuiz.correctCount
        && currentQuiz.elapsedSeconds === nextQuiz.elapsedSeconds
        && currentQuiz.startedAt === nextQuiz.startedAt
        && currentQuiz.bankId === nextQuiz.bankId
        && currentQuiz.queueQuestionIds.join("|") === nextQuiz.queueQuestionIds.join("|");
      return unchanged ? previous : { ...previous, inProgressQuiz: nextQuiz };
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
