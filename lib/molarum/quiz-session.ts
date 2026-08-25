import { decodeUnitKey, subjectIdForQuestion } from "./catalog";
import type { InProgressQuiz, StudyQuestion } from "./types";

export function isResumableQuiz(quiz: InProgressQuiz | null, unitKey: string, questions: StudyQuestion[], expectedBankId: string | null) {
  if (!quiz || !expectedBankId || typeof unitKey !== "string") return false;

  const decodedUnit = decodeUnitKey(unitKey);
  if (!decodedUnit || quiz.bankId !== expectedBankId || quiz.unitKey !== unitKey) return false;
  if (quiz.schemaVersion !== 1 || !Array.isArray(quiz.queueQuestionIds) || quiz.queueQuestionIds.length === 0) return false;
  if (!quiz.queueQuestionIds.every((id) => typeof id === "string" && id.length > 0)) return false;
  if (new Set(quiz.queueQuestionIds).size !== quiz.queueQuestionIds.length) return false;
  if (!Number.isInteger(quiz.index) || quiz.index < 0 || quiz.index >= quiz.queueQuestionIds.length) return false;
  if (!Number.isInteger(quiz.correctCount) || quiz.correctCount < 0 || quiz.correctCount > quiz.queueQuestionIds.length) return false;
  if (!Number.isFinite(quiz.elapsedSeconds) || quiz.elapsedSeconds < 0) return false;
  if (typeof quiz.response !== "string" || typeof quiz.submitted !== "boolean") return false;

  const availableQuestions = new Map(questions.map((question) => [question.id, question]));
  return quiz.queueQuestionIds.every((id) => {
    const question = availableQuestions.get(id);
    if (!question) return false;
    return subjectIdForQuestion(question) === decodedUnit.subjectId
      && question.unitId === decodedUnit.unitId;
  });
}
