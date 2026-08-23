import type { Difficulty, StudyQuestion } from "./types";

export function filterQuizQuestions(questions: StudyQuestion[], difficulty: Difficulty | "mixed") {
  return questions.filter((question) => difficulty === "mixed" || question.difficulty === difficulty);
}
