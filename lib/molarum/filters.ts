import type { Difficulty, LocalReviewState, StudyQuestion } from "./types";

export function filterQuizQuestions(questions: StudyQuestion[], reviewStates: Record<string, LocalReviewState>, difficulty: Difficulty | "mixed") {
  return questions.filter((question) => reviewStates[question.id] !== "hidden" && (difficulty === "mixed" || question.difficulty === difficulty));
}
