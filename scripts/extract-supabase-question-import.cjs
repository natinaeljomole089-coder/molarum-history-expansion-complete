const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(projectRoot, "assets/question-banks/grade10-source-grounded-bank.json");
const outputPath = path.join(projectRoot, "content/imports/molarum-supabase-question-import.json");

const bank = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const subjectNames = {
  biology: "Biology",
  chemistry: "Chemistry",
  citizenship: "Citizenship",
  economics: "Economics",
  geography: "Geography",
  health_pe: "Health & PE",
  history: "History",
  mathematics: "Mathematics",
  physics: "Physics",
};

function subjectFromId(id) {
  const match = id.match(/^(.+?)-u\d{2}-\d+$/);
  if (!match || !subjectNames[match[1]]) throw new Error(`Unsupported Molarum question id: ${id}`);
  return subjectNames[match[1]];
}

function questionType(type) {
  if (type === "multiple_choice" || type === "true_false") return type;
  if (type === "short_answer" || type === "numerical") return "fill_blank";
  throw new Error(`Unsupported question type: ${type}`);
}

const records = bank.questions.map((question, order) => ({
  source_question_id: question.id,
  subject: subjectFromId(question.id),
  unit: question.unitId,
  unit_title: question.unitTitle,
  question_type: questionType(question.type),
  question_text: question.question,
  choices: question.type === "multiple_choice" || question.type === "true_false" ? question.options : [],
  correct_answer: question.answer,
  explanation: question.explanation,
  order_index: order,
}));

const units = [...new Map(records.map((record) => [`${record.subject}::${record.unit}`, {
  subject: record.subject,
  unit: record.unit,
  title: record.unit_title,
}])).values()].sort((a, b) => a.subject.localeCompare(b.subject) || a.unit.localeCompare(b.unit, undefined, { numeric: true }));

const payload = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  source: {
    format: "canonical Molarum JSON question bank (not HTML)",
    path: "assets/question-banks/grade10-source-grounded-bank.json",
    source_catalog_version: bank.sourceCatalogVersion,
    total_questions: records.length,
    total_units: units.length,
  },
  units,
  questions: records,
};

if (records.length !== 2000 || units.length !== 50) {
  throw new Error(`Unexpected catalog size: ${records.length} questions across ${units.length} units.`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Extracted ${records.length} questions across ${units.length} units to ${path.relative(projectRoot, outputPath)}.`);
