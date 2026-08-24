const fs = require('fs');

const bankPath = 'assets/question-banks/grade10-source-grounded-bank.json';
const draftPath = 'content/drafts/history_unit_4_manual_draft.json';
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
const knownIds = new Set(bank.questions.map((question) => question.id));

for (const question of draft.questions) {
  if (knownIds.has(question.id)) throw new Error(`Refusing duplicate question id: ${question.id}`);
  knownIds.add(question.id);
}

bank.generatedAt = '2026-08-24T18:10:00.000Z';
bank.sourceCatalogVersion = 'owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-4';
bank.questions.push(...draft.questions);
fs.writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`);
console.log(`Merged ${draft.questions.length} questions. New total: ${bank.questions.length}.`);
