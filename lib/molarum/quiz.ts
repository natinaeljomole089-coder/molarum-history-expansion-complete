import type { StudyQuestion } from "./types";

export function normaliseAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function isAnswerCorrect(question: StudyQuestion, response: string) {
  return normaliseAnswer(question.answer) === normaliseAnswer(response);
}

export function correctCountAfterSubmission(currentCount: number, question: StudyQuestion, response: string) {
  return currentCount + (isAnswerCorrect(question, response) ? 1 : 0);
}

export function secondsToClock(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const remainder = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}
