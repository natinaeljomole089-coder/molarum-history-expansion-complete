import { SUBJECT_IDS, subjectIdForQuestion, buildUnitKey } from "./catalog";
import {
  DIFFICULTIES,
  QUESTION_TYPES,
  REVIEW_STATUSES,
  type Difficulty,
  type QuestionBank,
  type QuestionType,
  type StudyQuestion,
  type ValidatedQuestionBank,
  type ValidationIssue,
  type ValidationReport,
} from "./types";

const TYPE_TARGETS: Record<QuestionType, number> = {
  multiple_choice: 20,
  true_false: 4,
  short_answer: 8,
  numerical: 8,
};

const DIFFICULTY_TARGETS: Record<Difficulty, number> = {
  easy: 14,
  medium: 18,
  hard: 8,
};

const questionTypes = new Set<string>(QUESTION_TYPES);
const difficulties = new Set<string>(DIFFICULTIES);
const reviewStatuses = new Set<string>(REVIEW_STATUSES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseWording(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function zeroTypeCounts(): Record<QuestionType, number> {
  return { multiple_choice: 0, true_false: 0, short_answer: 0, numerical: 0 };
}

function zeroDifficultyCounts(): Record<Difficulty, number> {
  return { easy: 0, medium: 0, hard: 0 };
}

function addIssue(issues: ValidationIssue[], issue: ValidationIssue) {
  issues.push(issue);
}

function canonicalBank(input: unknown): QuestionBank | null {
  if (Array.isArray(input)) {
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      sourceCatalogVersion: "owner-imported",
      questions: input as StudyQuestion[],
    };
  }
  if (!isRecord(input) || !Array.isArray(input.questions)) return null;
  return {
    schemaVersion: 1,
    generatedAt: text(input.generatedAt) || new Date().toISOString(),
    sourceCatalogVersion: text(input.sourceCatalogVersion) || "owner-imported",
    questions: input.questions as StudyQuestion[],
  };
}

export function validateQuestionBank(input: unknown): { ok: true; value: ValidatedQuestionBank } | { ok: false; report: ValidationReport } {
  const issues: ValidationIssue[] = [];
  const bank = canonicalBank(input);
  const validatedAt = new Date().toISOString();

  if (!bank) {
    return {
      ok: false,
      report: { ok: false, issues: [{ code: "BANK_SHAPE", message: "Expected a JSON object with a questions array, or an array of questions." }], validatedAt, unitSummary: [] },
    };
  }

  if (bank.questions.length === 0) {
    addIssue(issues, { code: "BANK_EMPTY", message: "A question bank must contain at least one complete 40-question unit." });
  }

  const seenIds = new Set<string>();
  const seenWording = new Set<string>();
  const byUnit = new Map<string, StudyQuestion[]>();

  bank.questions.forEach((rawQuestion, index) => {
    const q = rawQuestion as unknown as Record<string, unknown>;
    const fallbackId = `row-${index + 1}`;
    if (!isRecord(q)) {
      addIssue(issues, { code: "QUESTION_SHAPE", message: "Every question must be an object.", questionId: fallbackId });
      return;
    }

    const id = text(q.id) || fallbackId;
    const requiredTextFields = ["id", "unitId", "unitTitle", "topic", "question", "answer", "explanation", "difficulty", "sourceNote", "reviewStatus"];
    for (const field of requiredTextFields) {
      if (!text(q[field])) addIssue(issues, { code: "REQUIRED_FIELD", message: `${field} is required and cannot be blank.`, questionId: id, field });
    }

    if (seenIds.has(id)) addIssue(issues, { code: "DUPLICATE_ID", message: "Question IDs must be unique.", questionId: id, field: "id" });
    seenIds.add(id);

    const wording = normaliseWording(text(q.question));
    if (wording && seenWording.has(wording)) addIssue(issues, { code: "DUPLICATE_WORDING", message: "Duplicate question wording is not allowed.", questionId: id, field: "question" });
    if (wording) seenWording.add(wording);

    if (!questionTypes.has(text(q.type))) addIssue(issues, { code: "QUESTION_TYPE", message: "type must be multiple_choice, true_false, short_answer, or numerical.", questionId: id, field: "type" });
    if (!difficulties.has(text(q.difficulty))) addIssue(issues, { code: "DIFFICULTY", message: "difficulty must be easy, medium, or hard.", questionId: id, field: "difficulty" });
    if (!reviewStatuses.has(text(q.reviewStatus))) addIssue(issues, { code: "REVIEW_STATUS", message: "reviewStatus must be ai_draft for imported source-grounded content.", questionId: id, field: "reviewStatus" });

    const options = q.options;
    if (!Array.isArray(options) || !options.every((option) => typeof option === "string")) {
      addIssue(issues, { code: "OPTIONS_SHAPE", message: "options must be an array of strings.", questionId: id, field: "options" });
    } else {
      const type = text(q.type);
      const answer = text(q.answer);
      if (type === "multiple_choice") {
        if (options.length !== 4 || new Set(options.map((option) => option.trim())).size !== 4) addIssue(issues, { code: "MC_OPTIONS", message: "Multiple-choice questions require exactly four distinct options.", questionId: id, field: "options" });
        if (!options.some((option) => option.trim() === answer)) addIssue(issues, { code: "MC_ANSWER", message: "A multiple-choice answer must exactly match one option.", questionId: id, field: "answer" });
      }
      if (type === "true_false") {
        if (options.length !== 2 || options[0] !== "True" || options[1] !== "False") addIssue(issues, { code: "TF_OPTIONS", message: "True/false questions require options exactly [\"True\", \"False\"].", questionId: id, field: "options" });
        if (answer !== "True" && answer !== "False") addIssue(issues, { code: "TF_ANSWER", message: "A true/false answer must be True or False.", questionId: id, field: "answer" });
      }
      if ((type === "short_answer" || type === "numerical") && options.length !== 0) addIssue(issues, { code: "FREE_RESPONSE_OPTIONS", message: "Short-answer and numerical questions require an empty options array.", questionId: id, field: "options" });
    }

    if (!/^[a-z_]+-u\d{2,}-\d{3,}$/i.test(id)) addIssue(issues, { code: "ID_FORMAT", message: "Question IDs must follow subject-uNN-### format, for example chemistry-u01-001.", questionId: id, field: "id" });
    const subjectId = subjectIdForQuestion({ id });
    if (!subjectId || !SUBJECT_IDS.includes(subjectId)) addIssue(issues, { code: "SUBJECT_ID", message: "Question ID prefix must identify an approved Grade 10 subject.", questionId: id, field: "id" });

    if (text(q.unitId) && subjectId) {
      const key = buildUnitKey(subjectId, text(q.unitId));
      byUnit.set(key, [...(byUnit.get(key) ?? []), rawQuestion]);
    }
  });

  const unitSummary = Array.from(byUnit.entries()).map(([unitKey, questions]) => {
    const typeCounts = zeroTypeCounts();
    const difficultyCounts = zeroDifficultyCounts();
    for (const question of questions) {
      if (questionTypes.has(question.type)) typeCounts[question.type] += 1;
      if (difficulties.has(question.difficulty)) difficultyCounts[question.difficulty] += 1;
    }
    if (questions.length !== 40) addIssue(issues, { code: "UNIT_TOTAL", message: `${unitKey} contains ${questions.length} questions; each completed unit requires exactly 40.`, field: "unitId" });
    for (const [type, expected] of Object.entries(TYPE_TARGETS) as Array<[QuestionType, number]>) {
      if (typeCounts[type] !== expected) addIssue(issues, { code: "TYPE_DISTRIBUTION", message: `${unitKey} requires ${expected} ${type} questions, found ${typeCounts[type]}.`, field: "type" });
    }
    for (const [difficulty, expected] of Object.entries(DIFFICULTY_TARGETS) as Array<[Difficulty, number]>) {
      if (difficultyCounts[difficulty] !== expected) addIssue(issues, { code: "DIFFICULTY_DISTRIBUTION", message: `${unitKey} requires ${expected} ${difficulty} questions, found ${difficultyCounts[difficulty]}.`, field: "difficulty" });
    }
    return { unitKey, total: questions.length, typeCounts, difficultyCounts };
  });

  const report: ValidationReport = { ok: issues.length === 0, issues, validatedAt, unitSummary };
  if (issues.length > 0) return { ok: false, report };
  return { ok: true, value: { bank, report } };
}

export function formatValidationReport(report: ValidationReport): string {
  const rows = report.unitSummary.map((unit) => `${unit.unitKey}: ${unit.total} questions; MC ${unit.typeCounts.multiple_choice}, TF ${unit.typeCounts.true_false}, short ${unit.typeCounts.short_answer}, numerical ${unit.typeCounts.numerical}; easy ${unit.difficultyCounts.easy}, medium ${unit.difficultyCounts.medium}, hard ${unit.difficultyCounts.hard}`);
  const issues = report.issues.length ? report.issues.map((issue) => `- [${issue.code}] ${issue.questionId ? `${issue.questionId}: ` : ""}${issue.message}`) : ["- No validation errors."];
  return [`# Molarum Question-Bank Validation Report`, "", `Validated: ${report.validatedAt}`, `Status: ${report.ok ? "ACCEPTED" : "REJECTED"}`, "", "## Unit summary", ...(rows.length ? rows.map((row) => `- ${row}`) : ["- No completed units detected."]), "", "## Issues", ...issues].join("\n");
}
