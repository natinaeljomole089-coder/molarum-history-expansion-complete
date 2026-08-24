import type { StudyQuestion, UnitGroup } from "./types";

export const SUBJECT_CATALOG = [
  { id: "chemistry", title: "Chemistry", accent: "#A7582B" },
  { id: "physics", title: "Physics", accent: "#557A65" },
  { id: "biology", title: "Biology", accent: "#6C7B4D" },
  { id: "mathematics", title: "Mathematics", accent: "#446B8F" },
  { id: "geography", title: "Geography", accent: "#A87916" },
  { id: "history", title: "History", accent: "#925C45" },
  { id: "citizenship", title: "Citizenship", accent: "#7C5A73" },
  { id: "economics", title: "Economics", accent: "#8B6245" },
  { id: "health_pe", title: "Health & PE", accent: "#4F7B77" },
] as const;

export type SubjectId = (typeof SUBJECT_CATALOG)[number]["id"];

export const SUBJECT_ICONS = {
  chemistry: "science",
  physics: "bolt",
  biology: "eco",
  mathematics: "calculate",
  geography: "public",
  history: "hourglass-empty",
  citizenship: "groups",
  economics: "show-chart",
  health_pe: "favorite",
} as const;

export const SUBJECT_IDS = SUBJECT_CATALOG.map((subject) => subject.id) as SubjectId[];

export function subjectIdForQuestion(question: Pick<StudyQuestion, "id">): SubjectId | null {
  const prefix = question.id.toLowerCase().split("-u")[0];
  return SUBJECT_IDS.includes(prefix as SubjectId) ? (prefix as SubjectId) : null;
}

export function buildUnitKey(subjectId: SubjectId, unitId: string) {
  return `${subjectId}::${unitId}`;
}

export function decodeUnitKey(unitKey: string): { subjectId: SubjectId; unitId: string } | null {
  const separator = unitKey.indexOf("::");
  if (separator < 1) return null;
  const subjectId = unitKey.slice(0, separator) as SubjectId;
  const unitId = unitKey.slice(separator + 2);
  if (!SUBJECT_IDS.includes(subjectId) || !unitId) return null;
  return { subjectId, unitId };
}

export function unitsForSubject(questions: StudyQuestion[], subjectId: SubjectId): UnitGroup[] {
  const grouped = new Map<string, StudyQuestion[]>();
  for (const question of questions) {
    if (subjectIdForQuestion(question) !== subjectId) continue;
    const unitKey = buildUnitKey(subjectId, question.unitId);
    grouped.set(unitKey, [...(grouped.get(unitKey) ?? []), question]);
  }
  return Array.from(grouped.entries())
    .map(([unitKey, unitQuestions]) => ({
      unitKey,
      subjectId,
      unitId: unitQuestions[0].unitId,
      unitTitle: unitQuestions[0].unitTitle,
      questions: [...unitQuestions].sort((a, b) => a.id.localeCompare(b.id)),
    }))
    .sort((left, right) => {
      const leftNumber = Number.parseInt(left.unitId.match(/\d+/)?.[0] ?? "", 10);
      const rightNumber = Number.parseInt(right.unitId.match(/\d+/)?.[0] ?? "", 10);
      if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) return leftNumber - rightNumber;
      return left.unitTitle.localeCompare(right.unitTitle);
    });
}

export function unitByKey(questions: StudyQuestion[], unitKey: string): UnitGroup | null {
  const decoded = decodeUnitKey(unitKey);
  if (!decoded) return null;
  return unitsForSubject(questions, decoded.subjectId).find((unit) => unit.unitKey === unitKey) ?? null;
}

export function topicsForUnit(questions: StudyQuestion[]): string[] {
  return [...new Set(questions.map((question) => question.topic.trim()).filter(Boolean))];
}
