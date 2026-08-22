import { describe, expect, it } from "vitest";

import { isAnswerCorrect } from "../lib/molarum/quiz";
import { filterQuizQuestions } from "../lib/molarum/filters";
import { buildScoreHistoryHtml } from "../lib/molarum/report-html";
import { validateQuestionBank } from "../lib/molarum/validator";
import type { QuestionType, StudyQuestion } from "../lib/molarum/types";
import bundledQuestionBank from "../assets/question-banks/grade10-source-grounded-bank.json";

const types: QuestionType[] = [
  ...Array<QuestionType>(20).fill("multiple_choice"),
  ...Array<QuestionType>(4).fill("true_false"),
  ...Array<QuestionType>(8).fill("short_answer"),
  ...Array<QuestionType>(8).fill("numerical"),
];
const difficulties = [...Array(14).fill("easy"), ...Array(18).fill("medium"), ...Array(8).fill("hard")] as StudyQuestion["difficulty"][];

function makeFixtureBank() {
  const questions: StudyQuestion[] = types.map((type, index) => {
    const number = String(index + 1).padStart(3, "0");
    const base = {
      id: `chemistry-u01-${number}`,
      unitId: "Unit 1",
      unitTitle: "Unit 1: Validator Fixture",
      topic: "Validator-only fixture",
      question: `Validator fixture item ${number}`,
      explanation: "Structural fixture only; not learner-facing curriculum content.",
      difficulty: difficulties[index],
      sourceNote: "Test fixture only — not a textbook source and not learner content.",
      reviewStatus: "ai_draft" as const,
    };
    if (type === "multiple_choice") return { ...base, type, options: ["Option A", "Option B", "Option C", "Option D"], answer: "Option A" };
    if (type === "true_false") return { ...base, type, options: ["True", "False"], answer: "True" };
    return { ...base, type, options: [], answer: type === "numerical" ? `${index + 1}` : `Key ${index + 1}` };
  });
  return { schemaVersion: 1 as const, generatedAt: "2026-08-18T00:00:00.000Z", sourceCatalogVersion: "test-fixture", questions };
}

describe("Molarum question-bank validator", () => {
  it("accepts a structurally complete 40-question unit fixture", () => {
    const result = validateQuestionBank(makeFixtureBank());
    expect(result.ok).toBe(true);
  });

  it("accepts the bundled owner-Drive bank with its declared 43-unit continuation coverage", () => {
    const result = validateQuestionBank(bundledQuestionBank);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.bank.questions).toHaveLength(1720);
      expect(result.value.report.unitSummary).toHaveLength(43);
      expect(result.value.bank.sourceCatalogVersion).toBe("owner-drive-grade10-textbooks-2026-08-22-full-expanded-continuation-1");
      const unitKeys = result.value.report.unitSummary.map((unit) => unit.unitKey);
      expect(unitKeys).toEqual(expect.arrayContaining(["mathematics::Unit 7", "geography::Unit 3", "geography::Unit 8", "citizenship::Unit 6", "citizenship::Unit 8"]));
    }
  });

  it("rejects a duplicate question and preserves strict distribution rules", () => {
    const bank = makeFixtureBank();
    bank.questions[1].question = bank.questions[0].question;
    const result = validateQuestionBank(bank);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.report.issues.some((issue) => issue.code === "DUPLICATE_WORDING")).toBe(true);
  });

  it("normalizes free-response answers without accepting different content", () => {
    const question = makeFixtureBank().questions.find((item) => item.type === "short_answer")!;
    expect(isAnswerCorrect(question, `  ${question.answer.toUpperCase()}  `)).toBe(true);
    expect(isAnswerCorrect(question, "A different key")).toBe(false);
  });

  it("omits locally hidden questions from a mixed or selected-difficulty quiz", () => {
    const questions = makeFixtureBank().questions;
    const hiddenId = questions[0].id;
    expect(filterQuizQuestions(questions, { [hiddenId]: "hidden" }, "mixed")).toHaveLength(39);
    expect(filterQuizQuestions(questions, { [hiddenId]: "hidden" }, "easy").every((question) => question.difficulty === "easy" && question.id !== hiddenId)).toBe(true);
  });

  it("creates escaped local score-history PDF markup with the revision disclaimer", () => {
    const html = buildScoreHistoryHtml({ name: "A < B", className: "10-A", school: "Study & Learn" }, [{ id: "attempt-1", bankId: "molarum-packaged_validated-test", bankOrigin: "packaged_validated", bankSourceCatalogVersion: "test-fixture", unitKey: "chemistry::Unit 1", unitTitle: "Unit < One", completedAt: "2026-08-18T00:00:00.000Z", correct: 8, total: 10, timed: true, elapsedSeconds: 125 }]);
    expect(html).toContain("A &lt; B");
    expect(html).toContain("Unit &lt; One");
    expect(html).toContain("source-grounded revision record");
  });
});
