import { describe, expect, it } from "vitest";

import { isAnswerCorrect } from "../lib/molarum/quiz";
import { filterQuizQuestions } from "../lib/molarum/filters";
import { validateQuestionBank } from "../lib/molarum/validator";
import type { QuestionType, StudyQuestion } from "../lib/molarum/types";
import bundledQuestionBank from "../assets/question-banks/grade10-source-grounded-bank.json";
import contentSummary from "../content/content-summary.json";

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

  it("accepts the bundled owner-Drive bank with its declared 50-unit continuation coverage", () => {
    const result = validateQuestionBank(bundledQuestionBank);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.bank.questions).toHaveLength(2000);
      expect(result.value.report.unitSummary).toHaveLength(50);
      expect(result.value.bank.sourceCatalogVersion).toBe("owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-5");
      const unitKeys = result.value.report.unitSummary.map((unit) => unit.unitKey);
      expect(unitKeys).toEqual(expect.arrayContaining(["mathematics::Unit 7", "geography::Unit 3", "geography::Unit 8", "citizenship::Unit 6", "citizenship::Unit 8", "economics::Unit 2", "economics::Unit 3", "history::Unit 1", "history::Unit 2", "history::Unit 3", "history::Unit 4", "history::Unit 5"]));
    }
  });

  it("keeps the committed machine-readable content summary aligned with the bundled bank", () => {
    const bankUnitKeys = [...new Set(bundledQuestionBank.questions.map((question) => `${question.id.split("-")[0]}::${question.unitId}`))].sort();
    const summaryUnitKeys = contentSummary.units.map((unit) => `${unit.subject}::${unit.unitId}`).sort();
    expect(contentSummary.questionCount).toBe(bundledQuestionBank.questions.length);
    expect(contentSummary.unitCount).toBe(bankUnitKeys.length);
    expect(contentSummary.sourceCatalogVersion).toBe(bundledQuestionBank.sourceCatalogVersion);
    expect(summaryUnitKeys).toEqual(bankUnitKeys);
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

  it("filters a practice queue by the selected difficulty", () => {
    const questions = makeFixtureBank().questions;
    expect(filterQuizQuestions(questions, "mixed")).toHaveLength(40);
    expect(filterQuizQuestions(questions, "easy")).toHaveLength(14);
    expect(filterQuizQuestions(questions, "easy").every((question) => question.difficulty === "easy")).toBe(true);
  });

});
