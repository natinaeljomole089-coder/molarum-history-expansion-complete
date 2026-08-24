import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const bank = JSON.parse(readFileSync(resolve(root, "assets/question-banks/grade10-source-grounded-bank.json"), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(root, "content/manifest.json"), "utf8"));
const units = new Map();
for (const question of bank.questions) {
  const subject = question.id.split("-")[0];
  const key = `${subject}::${question.unitId}`;
  const entry = units.get(key) ?? { subject, unitId: question.unitId, questionCount: 0, types: {}, difficulties: {}, reviewStatuses: {} };
  entry.questionCount += 1;
  entry.types[question.type] = (entry.types[question.type] ?? 0) + 1;
  entry.difficulties[question.difficulty] = (entry.difficulties[question.difficulty] ?? 0) + 1;
  entry.reviewStatuses[question.reviewStatus] = (entry.reviewStatuses[question.reviewStatus] ?? 0) + 1;
  units.set(key, entry);
}
const summary = {
  generatedAt: new Date().toISOString(),
  sourceCatalogVersion: bank.sourceCatalogVersion,
  questionCount: bank.questions.length,
  unitCount: units.size,
  units: [...units.values()].sort((a, b) => `${a.subject}::${a.unitId}`.localeCompare(`${b.subject}::${b.unitId}`)),
  unresolvedCoverage: manifest.subjects.flatMap((subject) => (subject.unresolvedUnits ?? []).map((entry) => ({ subject: subject.id, ...entry }))),
};
writeFileSync(resolve(root, "content/content-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Wrote content summary for ${summary.questionCount} questions across ${summary.unitCount} units.`);
