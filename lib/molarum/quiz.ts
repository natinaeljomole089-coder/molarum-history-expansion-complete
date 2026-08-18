import type { StudyQuestion } from "./types";

export function normaliseAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function isAnswerCorrect(question: StudyQuestion, response: string) {
  return normaliseAnswer(question.answer) === normaliseAnswer(response);
}

export function secondsToClock(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}
