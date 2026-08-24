const fs = require('fs');

const bank = JSON.parse(fs.readFileSync('assets/question-banks/grade10-source-grounded-bank.json', 'utf8'));
const groups = new Map();
for (const question of bank.questions) {
  const subject = question.id.split('-')[0];
  const key = `${subject}::${question.unitId}`;
  if (!groups.has(key)) groups.set(key, { subject, unitId: question.unitId, questions: [] });
  groups.get(key).questions.push(question);
}
const countBy = (questions, key) => questions.reduce((counts, question) => {
  counts[question[key]] = (counts[question[key]] ?? 0) + 1;
  return counts;
}, {});
const units = [...groups.values()]
  .map(({ subject, unitId, questions }) => ({
    subject,
    unitId,
    questionCount: questions.length,
    types: countBy(questions, 'type'),
    difficulties: countBy(questions, 'difficulty'),
    reviewStatuses: countBy(questions, 'reviewStatus'),
  }))
  .sort((left, right) => `${left.subject}::${left.unitId}`.localeCompare(`${right.subject}::${right.unitId}`));
const summary = {
  generatedAt: '2026-08-24T18:12:00.000Z',
  sourceCatalogVersion: bank.sourceCatalogVersion,
  questionCount: bank.questions.length,
  unitCount: units.length,
  units,
  unresolvedCoverage: [
    { subject: 'history', unit: 'Units 5–6', reason: 'The owner-approved History textbook is available; each remaining unit requires its own source-bounded authoring and validation batch.' },
    { subject: 'economics', unit: 'Units 4–8', reason: 'Approved source exists, but no later unit has been prepared as a source-bounded continuation batch.' },
    { subject: 'health_pe', unit: 'Units 2–8', reason: 'No structurally usable source-only generation response was available during the documented retry; no questions were bundled.' },
  ],
};
fs.writeFileSync('content/content-summary.json', `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Regenerated summary for ${summary.questionCount} questions across ${summary.unitCount} units.`);
