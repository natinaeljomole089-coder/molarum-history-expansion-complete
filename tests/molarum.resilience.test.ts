import { describe, expect, it } from "vitest";

import { filterQuizQuestions } from "../lib/molarum/filters";
import { summarizeImportReview } from "../lib/molarum/import-review";
import { isResumableQuiz } from "../lib/molarum/quiz-session";
import { buildScoreHistoryHtml } from "../lib/molarum/report-html";
import { validateQuestionBank } from "../lib/molarum/validator";
import type { InProgressQuiz, QuestionType, StudyQuestion } from "../lib/molarum/types";

const types: QuestionType[] = [
  ...Array<QuestionType>(20).fill("multiple_choice"),
  ...Array<QuestionType>(4).fill("true_false"),
  ...Array<QuestionType>(8).fill("short_answer"),
  ...Array<QuestionType>(8).fill("numerical"),
];
const difficulties = [...Array(14).fill("easy"), ...Array(18).fill("medium"), ...Array(8).fill("hard")] as StudyQuestion["difficulty"][];

function makeBank() {
  const questions: StudyQuestion[] = types.map((type, index) => {
    const id = `chemistry-u01-${String(index + 1).padStart(3, "0")}`;
    const base = { id, unitId: "Unit 1", unitTitle: "Unit 1: Resilience Fixture", topic: "Fixture", question: `Source-grounded fixture ${index + 1}`, explanation: "One-sentence fixture explanation.", difficulty: difficulties[index], sourceNote: "Fixture source note.", reviewStatus: "ai_draft" as const };
    if (type === "multiple_choice") return { ...base, type, options: ["A", "B", "C", "D"], answer: "A" };
    if (type === "true_false") return { ...base, type, options: ["True", "False"], answer: "True" };
    return { ...base, type, options: [], answer: type === "numerical" ? "1" : "Fixture answer" };
  });
  return { schemaVersion: 1 as const, generatedAt: "2026-08-22T00:00:00.000Z", sourceCatalogVersion: "test-import", questions };
}

describe("Molarum resilience helpers", () => {
  it("summarizes a valid import without changing its source object", () => {
    const bank = makeBank();
    const before = JSON.stringify(bank);
    const result = validateQuestionBank(bank);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const summary = summarizeImportReview(bank, result.value.report);
    expect(summary).toMatchObject({ totalRecords: 40, preliminarilyValidRecords: 40, rejectedRecords: 0, duplicateIds: 0, missingSourceNotes: 0, missingExplanations: 0, missingReviewStatuses: 0 });
    expect(JSON.stringify(bank)).toBe(before);
  });

  it("reports invalid import remediation without any partial activation behavior", () => {
    const bank = makeBank();
    bank.questions[1].id = bank.questions[0].id;
    bank.questions[2].id = "unsupported-u01-003";
    bank.questions[3].sourceNote = "";
    bank.questions[4].explanation = "";
    bank.questions[5].reviewStatus = "" as "ai_draft";
    const result = validateQuestionBank(bank);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const summary = summarizeImportReview(bank, result.report);
    expect(summary.duplicateIds).toBeGreaterThan(0);
    expect(summary.invalidSubjectPrefixes).toBeGreaterThan(0);
    expect(summary.missingSourceNotes).toBeGreaterThan(0);
    expect(summary.missingExplanations).toBeGreaterThan(0);
    expect(summary.missingReviewStatuses).toBeGreaterThan(0);
  });

  it("keeps a hidden-only unit out of a new quiz queue", () => {
    const questions = makeBank().questions;
    const hidden = Object.fromEntries(questions.map((question) => [question.id, "hidden" as const]));
    expect(filterQuizQuestions(questions, hidden, "mixed")).toEqual([]);
  });

  it("resumes only a coherent local quiz session whose queued IDs remain available", () => {
    const questions = makeBank().questions;
    const session: InProgressQuiz = { schemaVersion: 1, bankId: "molarum-packaged_validated-test", bankOrigin: "packaged_validated", bankSourceCatalogVersion: "test-import", unitKey: "chemistry::Unit 1", unitTitle: "Unit 1: Resilience Fixture", difficulty: "mixed", timed: false, queueQuestionIds: questions.slice(0, 3).map((question) => question.id), index: 1, response: "A", submitted: true, correctCount: 1, elapsedSeconds: 0, startedAt: "2026-08-22T00:00:00.000Z", updatedAt: "2026-08-22T00:01:00.000Z" };
    expect(isResumableQuiz(session, "chemistry::Unit 1", questions, session.bankId)).toBe(true);
    expect(isResumableQuiz({ ...session, queueQuestionIds: ["missing-question"] }, "chemistry::Unit 1", questions, session.bankId)).toBe(false);
    expect(isResumableQuiz({ ...session, index: 9 }, "chemistry::Unit 1", questions, session.bankId)).toBe(false);
    expect(isResumableQuiz(session, "chemistry::Unit 1", questions, "molarum-imported_draft-replaced")).toBe(false);
  });

  it("keeps local-save and source-grounded revision disclaimers in exported history", () => {
    const html = buildScoreHistoryHtml({ name: "Learner", className: "10-A", school: "School" }, [{ id: "attempt-1", bankId: "molarum-packaged_validated-test", bankOrigin: "packaged_validated", bankSourceCatalogVersion: "test-import", unitKey: "chemistry::Unit 1", unitTitle: "Unit 1", completedAt: "2026-08-22T00:00:00.000Z", correct: 8, total: 10, timed: false, elapsedSeconds: 0 }]);
    expect(html).toContain("Saved locally");
    expect(html).toContain("source-grounded revision record");
    expect(html).toContain("not a formal assessment");
    expect(html).toContain("test-import");
    expect(html).toContain("Packaged validated");
  });
});
