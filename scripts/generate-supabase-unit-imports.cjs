const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const importPath = path.join(projectRoot, "content/imports/molarum-supabase-question-import.json");
const outputDir = path.join(projectRoot, "supabase/imports/molarum-units");
const summaryPath = path.join(outputDir, "import-summary.json");
const projectId = "jxdfukggxxlemsoumtal";

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function stableUuid(value) {
  const crypto = require("crypto");
  const hash = crypto.createHash("md5").update(`molarum-supabase-import:${value}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function slug(value) {
  return value.toLowerCase().replaceAll("&", "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const payload = JSON.parse(fs.readFileSync(importPath, "utf8"));
const byUnit = new Map();
for (const question of payload.questions) {
  const key = `${question.subject}::${question.unit}`;
  if (!byUnit.has(key)) byUnit.set(key, []);
  byUnit.get(key).push(question);
}

if (payload.questions.length !== 2000 || byUnit.size !== 50) throw new Error("Unexpected source catalog size.");
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const summary = [];
for (const unit of payload.units) {
  const key = `${unit.subject}::${unit.unit}`;
  const questions = byUnit.get(key) ?? [];
  if (questions.length !== 40) throw new Error(`${key} has ${questions.length} questions instead of 40.`);
  const quizId = stableUuid(`quiz:${key}`);
  const quizTitle = `Molarum Grade 10 — ${unit.subject} ${unit.title}`;
  const description = `Source-grounded Molarum Grade 10 ${unit.subject} questions for ${unit.title}.`;
  const statements = ["BEGIN;"];
  statements.push(`INSERT INTO public.quizzes (id, subject, unit, title, description) VALUES (${sql(quizId)}::uuid, ${sql(unit.subject)}, ${sql(unit.unit)}, ${sql(quizTitle)}, ${sql(description)}) ON CONFLICT (id) DO UPDATE SET subject = EXCLUDED.subject, unit = EXCLUDED.unit, title = EXCLUDED.title, description = EXCLUDED.description;`);

  const questionValues = questions.map((question, position) => {
    const questionId = stableUuid(`question:${question.source_question_id}`);
    question._dbQuestionId = questionId;
    return `(${sql(questionId)}::uuid, ${sql(quizId)}::uuid, ${sql(question.question_type)}, ${sql(question.question_text)}, ${sql(question.correct_answer)}, ${sql(question.explanation)}, ${position})`;
  });
  statements.push(`INSERT INTO public.questions (id, quiz_id, question_type, question_text, correct_answer, explanation, order_index) VALUES ${questionValues.join(",")} ON CONFLICT (id) DO UPDATE SET quiz_id = EXCLUDED.quiz_id, question_type = EXCLUDED.question_type, question_text = EXCLUDED.question_text, correct_answer = EXCLUDED.correct_answer, explanation = EXCLUDED.explanation, order_index = EXCLUDED.order_index;`);

  const choiceValues = [];
  for (const question of questions) {
    for (const [position, choice] of question.choices.entries()) {
      choiceValues.push(`(${sql(stableUuid(`choice:${question.source_question_id}:${position}`))}::uuid, ${sql(question._dbQuestionId)}::uuid, ${sql(choice)}, ${sql(choice === question.correct_answer)}, ${position})`);
    }
  }
  if (choiceValues.length) statements.push(`INSERT INTO public.choices (id, question_id, choice_text, is_correct, order_index) VALUES ${choiceValues.join(",")} ON CONFLICT (id) DO UPDATE SET question_id = EXCLUDED.question_id, choice_text = EXCLUDED.choice_text, is_correct = EXCLUDED.is_correct, order_index = EXCLUDED.order_index;`);
  statements.push("COMMIT;");
  statements.push(`SELECT q.subject, q.unit, count(DISTINCT question.id)::integer AS question_count, count(choice.id)::integer AS choice_count FROM public.quizzes q LEFT JOIN public.questions question ON question.quiz_id = q.id LEFT JOIN public.choices choice ON choice.question_id = question.id WHERE q.id = ${sql(quizId)}::uuid GROUP BY q.subject, q.unit LIMIT 1;`);

  const filename = `${slug(unit.subject)}-${slug(unit.unit)}.json`;
  fs.writeFileSync(path.join(outputDir, filename), `${JSON.stringify({ project_id: projectId, query: statements.join("\n") }, null, 2)}\n`);
  summary.push({ subject: unit.subject, unit: unit.unit, quiz_id: quizId, question_count: questions.length, choice_count: choiceValues.length, request_file: filename });
}

fs.writeFileSync(summaryPath, `${JSON.stringify({ source: payload.source, units: summary }, null, 2)}\n`);
console.log(`Generated ${summary.length} idempotent unit imports for ${payload.questions.length} questions and ${summary.reduce((sum, unit) => sum + unit.choice_count, 0)} choices.`);
