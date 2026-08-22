import type { ValidationReport } from "./types";

export interface ImportReviewSummary {
  totalRecords: number;
  preliminarilyValidRecords: number;
  rejectedRecords: number;
  duplicateIds: number;
  unsupportedQuestionTypes: number;
  invalidSubjectPrefixes: number;
  missingSourceNotes: number;
  missingExplanations: number;
  missingReviewStatuses: number;
  unitOrDistributionViolations: number;
  remediationIssues: ValidationReport["issues"];
}

function questionRecords(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as { questions?: unknown[] }).questions)) return (value as { questions: unknown[] }).questions;
  return [];
}

export function summarizeImportReview(value: unknown, report: ValidationReport): ImportReviewSummary {
  const totalRecords = questionRecords(value).length;
  const invalidRecordIds = new Set(report.issues.flatMap((issue) => (issue.questionId ? [issue.questionId] : [])));
  const count = (code: string) => report.issues.filter((issue) => issue.code === code).length;
  const missing = (field: string) => report.issues.filter((issue) => issue.code === "REQUIRED_FIELD" && issue.field === field).length;
  return {
    totalRecords,
    preliminarilyValidRecords: report.ok ? totalRecords : Math.max(totalRecords - invalidRecordIds.size, 0),
    rejectedRecords: report.ok ? 0 : invalidRecordIds.size,
    duplicateIds: count("DUPLICATE_ID"),
    unsupportedQuestionTypes: count("QUESTION_TYPE"),
    invalidSubjectPrefixes: count("SUBJECT_ID"),
    missingSourceNotes: missing("sourceNote"),
    missingExplanations: missing("explanation"),
    missingReviewStatuses: missing("reviewStatus"),
    unitOrDistributionViolations: count("UNIT_TOTAL") + count("TYPE_DISTRIBUTION") + count("DIFFICULTY_DISTRIBUTION"),
    remediationIssues: report.issues,
  };
}
