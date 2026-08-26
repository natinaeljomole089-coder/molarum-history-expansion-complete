const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const bankPath = path.join(root, "assets/question-banks/grade10-source-grounded-bank.json");
const draftPath = path.join(root, "content/drafts/history_unit_5_manual_draft.json");
const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
const draft = JSON.parse(fs.readFileSync(draftPath, "utf8"));
if (draft.questions.length !== 40) throw new Error("History Unit 5 draft is incomplete.");
const ids = new Set(bank.questions.map((question) => question.id));
for (const question of draft.questions) {
  if (ids.has(question.id)) throw new Error(`Duplicate question identifier: ${question.id}`);
  ids.add(question.id);
}
bank.questions.push(...draft.questions);
bank.generatedAt = "2026-08-26T00:00:00.000Z";
bank.sourceCatalogVersion = "owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-5";
fs.writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`);
console.log(`Merged ${draft.questions.length} History Unit 5 questions; bank now has ${bank.questions.length} questions.`);
