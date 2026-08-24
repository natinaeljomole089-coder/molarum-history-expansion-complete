const fs = require('fs');

const active = JSON.parse(fs.readFileSync('assets/question-banks/grade10-source-grounded-bank.json', 'utf8')).questions;
const candidate = JSON.parse(fs.readFileSync('content/drafts/history_unit_4_manual_draft.json', 'utf8')).questions;
const normalize = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tokenSet = (value) => new Set(normalize(value).split(' ').filter((token) => token.length > 2));
const similarity = (a, b) => {
  const left = tokenSet(a);
  const right = tokenSet(b);
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
};

const activeIds = new Set(active.map((question) => question.id));
const exactQuestionAnswer = new Set(active.map((question) => `${normalize(question.question)}|${normalize(question.answer)}`));
const findings = [];

for (const question of candidate) {
  if (activeIds.has(question.id)) findings.push({ id: question.id, kind: 'duplicate-id' });
  if (exactQuestionAnswer.has(`${normalize(question.question)}|${normalize(question.answer)}`)) {
    findings.push({ id: question.id, kind: 'exact-question-answer' });
  }
  const overlaps = active
    .map((existing) => ({ existing, score: similarity(question.question, existing.question) }))
    .filter(({ score, existing }) => score >= 0.78 && normalize(question.answer) === normalize(existing.answer));
  for (const { existing, score } of overlaps) {
    findings.push({ id: question.id, kind: 'high-overlap', existingId: existing.id, score: Number(score.toFixed(3)) });
  }
}

console.log(JSON.stringify({ candidateQuestions: candidate.length, findings }, null, 2));
process.exitCode = findings.length ? 1 : 0;
