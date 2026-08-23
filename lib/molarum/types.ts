export const QUESTION_TYPES = ["multiple_choice", "true_false", "short_answer", "numerical"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const REVIEW_STATUSES = ["ai_draft"] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type ActiveBankOrigin = "packaged_validated" | "imported_draft" | "none";

export interface StudyQuestion {
  id: string;
  unitId: string;
  unitTitle: string;
  topic: string;
  type: QuestionType;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: Difficulty;
  sourceNote: string;
  reviewStatus: ReviewStatus;
}

export interface QuestionBank {
  schemaVersion: 1;
  generatedAt: string;
  sourceCatalogVersion: string;
  questions: StudyQuestion[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  questionId?: string;
  field?: string;
}

export interface ValidationReport {
  ok: boolean;
  issues: ValidationIssue[];
  validatedAt: string;
  unitSummary: Array<{
    unitKey: string;
    total: number;
    typeCounts: Record<QuestionType, number>;
    difficultyCounts: Record<Difficulty, number>;
  }>;
}

export interface ValidatedQuestionBank {
  bank: QuestionBank;
  report: ValidationReport;
}

export interface BankDescriptor {
  bankId: string;
  origin: Exclude<ActiveBankOrigin, "none">;
  sourceCatalogVersion: string;
  questionCount: number;
}

export interface LearnerProfile {
  name: string;
  className: string;
  school: string;
}

export interface QuizAttempt {
  id: string;
  unitKey: string;
  unitTitle: string;
  completedAt: string;
  correct: number;
  total: number;
  timed: boolean;
  elapsedSeconds: number;
  bankId: string;
  bankOrigin: ActiveBankOrigin;
  bankSourceCatalogVersion: string;
}

export interface InProgressQuiz {
  schemaVersion: 1;
  bankId: string;
  bankOrigin: ActiveBankOrigin;
  bankSourceCatalogVersion: string;
  unitKey: string;
  unitTitle: string;
  difficulty: Difficulty | "mixed";
  timed: boolean;
  queueQuestionIds: string[];
  index: number;
  response: string;
  submitted: boolean;
  correctCount: number;
  elapsedSeconds: number;
  startedAt: string;
  updatedAt: string;
}

export interface UnitGroup {
  unitKey: string;
  subjectId: string;
  unitId: string;
  unitTitle: string;
  questions: StudyQuestion[];
}
