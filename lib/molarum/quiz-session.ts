import type { InProgressQuiz, StudyQuestion } from "./types";

export function isResumableQuiz(quiz: InProgressQuiz | null, unitKey: string, questions: StudyQuestion[], expectedBankId: string | null) {
  if (!quiz || !expectedBankId || quiz.bankId !== expectedBankId || quiz.unitKey !== unitKey || quiz.queueQuestionIds.length === 0) return false;
  if (quiz.schemaVersion !== 1 || quiz.index < 0 || quiz.index >= quiz.queueQuestionIds.length || quiz.correctCount < 0 || quiz.elapsedSeconds < 0) return false;
  const availableIds = new Set(questions.map((question) => question.id));
  return quiz.queueQuestionIds.every((id) => availableIds.has(id));
}
