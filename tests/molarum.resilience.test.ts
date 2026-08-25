import { describe, expect, it } from "vitest";

import { filterQuizQuestions } from "../lib/molarum/filters";
import { correctCountAfterSubmission } from "../lib/molarum/quiz";
import { isResumableQuiz } from "../lib/molarum/quiz-session";
import { createBankDescriptor, shouldUpgradeStagedPackagedBank } from "../lib/molarum/bank-storage";
import { validateQuestionBank } from "../lib/molarum/validator";
import { unitsForSubject } from "../lib/molarum/catalog";
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
  it("keeps a complete local unit ready for a new quiz queue", () => {
    const questions = makeBank().questions;
    expect(filterQuizQuestions(questions, "mixed")).toHaveLength(40);
    expect(filterQuizQuestions(questions, "hard")).toHaveLength(8);
  });

  it("counts a correct final answer before the result is saved", () => {
    const questions = makeBank().questions;
    expect(correctCountAfterSubmission(0, questions[0], "A")).toBe(1);
    expect(correctCountAfterSubmission(1, questions[0], "not A")).toBe(1);
  });

  it("resumes only a coherent local quiz session whose queued IDs remain available", () => {
    const questions = makeBank().questions;
    const session: InProgressQuiz = { schemaVersion: 1, bankId: "molarum-packaged_validated-test", bankOrigin: "packaged_validated", bankSourceCatalogVersion: "test-import", unitKey: "chemistry::Unit 1", unitTitle: "Unit 1: Resilience Fixture", difficulty: "mixed", timed: false, queueQuestionIds: questions.slice(0, 3).map((question) => question.id), index: 1, response: "A", submitted: true, correctCount: 1, elapsedSeconds: 0, startedAt: "2026-08-22T00:00:00.000Z", updatedAt: "2026-08-22T00:01:00.000Z" };
    expect(isResumableQuiz(session, "chemistry::Unit 1", questions, session.bankId)).toBe(true);
    expect(isResumableQuiz({ ...session, queueQuestionIds: ["missing-question"] }, "chemistry::Unit 1", questions, session.bankId)).toBe(false);
    expect(isResumableQuiz({ ...session, queueQuestionIds: [questions[0].id, questions[0].id] }, "chemistry::Unit 1", questions, session.bankId)).toBe(false);
    expect(isResumableQuiz({ ...session, queueQuestionIds: ["physics-u01-001"] }, "chemistry::Unit 1", questions, session.bankId)).toBe(false);
    expect(isResumableQuiz({ ...session, queueQuestionIds: undefined as unknown as string[] }, "chemistry::Unit 1", questions, session.bankId)).toBe(false);
    expect(isResumableQuiz({ ...session, index: 9 }, "chemistry::Unit 1", questions, session.bankId)).toBe(false);
    expect(isResumableQuiz(session, "chemistry::Unit 1", questions, "molarum-imported_draft-replaced")).toBe(false);
  });

  it("sorts multi-digit unit numbers numerically for learner navigation", () => {
    const fixture = makeBank().questions[0];
    const questions = ["Unit 10", "Unit 2", "Unit 1"].map((unitId, index) => ({
      ...fixture,
      id: `chemistry-u${String(index + 1).padStart(2, "0")}-001`,
      unitId,
      unitTitle: `${unitId}: Ordered fixture`,
    }));
    expect(unitsForSubject(questions, "chemistry").map((unit) => unit.unitId)).toEqual(["Unit 1", "Unit 2", "Unit 10"]);
  });

  it("upgrades every older staged packaged bank but leaves imports and the current bundle unchanged", () => {
    const validated = validateQuestionBank(makeBank());
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    validated.value.bank.sourceCatalogVersion = "owner-drive-grade10-textbooks-2026-08-22-full-expanded";
    const priorPackaged = { activeBank: validated.value, descriptor: createBankDescriptor(validated.value, "packaged_validated") };
    expect(shouldUpgradeStagedPackagedBank(priorPackaged)).toBe(true);
    expect(shouldUpgradeStagedPackagedBank({ ...priorPackaged, descriptor: createBankDescriptor(validated.value, "imported_draft") })).toBe(false);
    validated.value.bank.sourceCatalogVersion = "owner-drive-grade10-textbooks-2026-08-22-full-expanded-continuation-1";
    expect(shouldUpgradeStagedPackagedBank({ ...priorPackaged, descriptor: createBankDescriptor(validated.value, "packaged_validated") })).toBe(true);
    validated.value.bank.sourceCatalogVersion = "owner-drive-grade10-textbooks-2026-08-23-full-expanded-continuation-2";
    expect(shouldUpgradeStagedPackagedBank({ ...priorPackaged, descriptor: createBankDescriptor(validated.value, "packaged_validated") })).toBe(true);
    validated.value.bank.sourceCatalogVersion = "owner-drive-grade10-textbooks-2026-08-23-full-expanded-continuation-3";
    expect(shouldUpgradeStagedPackagedBank({ ...priorPackaged, descriptor: createBankDescriptor(validated.value, "packaged_validated") })).toBe(true);
    validated.value.bank.sourceCatalogVersion = "owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-1";
    expect(shouldUpgradeStagedPackagedBank({ ...priorPackaged, descriptor: createBankDescriptor(validated.value, "packaged_validated") })).toBe(true);
    validated.value.bank.sourceCatalogVersion = "owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-3";
    expect(shouldUpgradeStagedPackagedBank({ ...priorPackaged, descriptor: createBankDescriptor(validated.value, "packaged_validated") })).toBe(true);
    validated.value.bank.sourceCatalogVersion = "legacy-packaged-build-not-in-version-list";
    expect(shouldUpgradeStagedPackagedBank({ ...priorPackaged, descriptor: createBankDescriptor(validated.value, "packaged_validated") })).toBe(true);
    expect(shouldUpgradeStagedPackagedBank({ ...priorPackaged, descriptor: createBankDescriptor(validated.value, "imported_draft") })).toBe(false);
    validated.value.bank.sourceCatalogVersion = "owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-4";
    expect(shouldUpgradeStagedPackagedBank({ ...priorPackaged, descriptor: createBankDescriptor(validated.value, "packaged_validated") })).toBe(false);
  });

});
