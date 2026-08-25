const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const unitDir = path.join(projectRoot, "supabase/imports/molarum-units");
const outputDir = path.join(projectRoot, "supabase/imports/molarum-batches");
const summary = JSON.parse(fs.readFileSync(path.join(unitDir, "import-summary.json"), "utf8"));

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const batchSize = 7;
for (let start = 0; start < summary.units.length; start += batchSize) {
  const units = summary.units.slice(start, start + batchSize);
  const bodies = units.map((unit) => {
    const request = JSON.parse(fs.readFileSync(path.join(unitDir, unit.request_file), "utf8"));
    return request.query.replace(/^BEGIN;\n/, "").replace(/\nCOMMIT;\nSELECT[\s\S]*$/, "");
  });
  const ids = units.map((unit) => `'${unit.quiz_id}'::uuid`).join(", ");
  const query = [
    "BEGIN;",
    ...bodies,
    "COMMIT;",
    `SELECT q.subject, q.unit, count(DISTINCT question.id)::integer AS question_count, count(choice.id)::integer AS choice_count FROM public.quizzes q LEFT JOIN public.questions question ON question.quiz_id = q.id LEFT JOIN public.choices choice ON choice.question_id = question.id WHERE q.id IN (${ids}) GROUP BY q.subject, q.unit ORDER BY q.subject, q.unit LIMIT ${units.length};`,
  ].join("\n");
  const batch = {
    project_id: "jxdfukggxxlemsoumtal",
    query,
  };
  const filename = `batch-${String(start / batchSize + 1).padStart(2, "0")}.json`;
  fs.writeFileSync(path.join(outputDir, filename), `${JSON.stringify(batch, null, 2)}\n`);
}

console.log(`Generated ${Math.ceil(summary.units.length / batchSize)} transactional batches for ${summary.units.length} units.`);
