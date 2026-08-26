const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const active = JSON.parse(fs.readFileSync(path.join(root, "assets/question-banks/grade10-source-grounded-bank.json"), "utf8")).questions;
const candidate = JSON.parse(fs.readFileSync(path.join(root, "content/drafts/history_unit_5_manual_draft.json"), "utf8")).questions;
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const tokens = (value) => new Set(normalize(value).split(" ").filter((token) => token.length > 2));
const overlap = (left, right) => {
  const a = tokens(left);
  const b = tokens(right);
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / Math.max(1, Math.min(a.size, b.size));
};
const issues = [];
for (const question of candidate) {
  for (const existing of active) {
    if (existing.id === question.id) issues.push({ kind: "id", candidate: question.id, existing: existing.id });
    if (normalize(existing.question) === normalize(question.question)) issues.push({ kind: "wording", candidate: question.id, existing: existing.id });
    if (normalize(existing.question) === normalize(question.question) && normalize(existing.answer) === normalize(question.answer)) issues.push({ kind: "answer", candidate: question.id, existing: existing.id });
    if (overlap(existing.question, question.question) >= 0.88 && normalize(existing.answer) === normalize(question.answer)) issues.push({ kind: "high_overlap", candidate: question.id, existing: existing.id });
  }
}
console.log(JSON.stringify({ candidateQuestions: candidate.length, activeQuestions: active.length, issues }, null, 2));
if (issues.length) process.exit(1);
