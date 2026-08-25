const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const summary = JSON.parse(fs.readFileSync(path.join(projectRoot, "supabase/imports/molarum-units/import-summary.json"), "utf8"));
const ids = summary.units.map((unit) => `'${unit.quiz_id}'::uuid`).join(", ");
const query = `
WITH imported_quizzes AS (
  SELECT id, subject, unit FROM public.quizzes WHERE id IN (${ids})
),
per_unit AS (
  SELECT q.subject,
         q.unit,
         count(DISTINCT question.id)::integer AS question_count,
         count(choice.id)::integer AS choice_count,
         count(choice.id) FILTER (WHERE choice.is_correct)::integer AS correct_choice_count,
         count(question.id) FILTER (WHERE question.question_type = 'fill_blank')::integer AS fill_blank_count
  FROM imported_quizzes q
  LEFT JOIN public.questions question ON question.quiz_id = q.id
  LEFT JOIN public.choices choice ON choice.question_id = question.id
  GROUP BY q.subject, q.unit
),
integrity AS (
  SELECT
    (SELECT count(*)::integer FROM public.questions question LEFT JOIN imported_quizzes q ON q.id = question.quiz_id WHERE q.id IS NULL AND question.id IN (SELECT question.id FROM public.questions question JOIN imported_quizzes q2 ON q2.id = question.quiz_id)) AS orphan_questions,
    (SELECT count(*)::integer FROM public.choices choice LEFT JOIN public.questions question ON question.id = choice.question_id WHERE question.id IS NULL) AS global_orphan_choices,
    (SELECT count(*)::integer FROM public.questions question JOIN imported_quizzes q ON q.id = question.quiz_id WHERE question.question_type IN ('multiple_choice', 'true_false') AND (SELECT count(*) FROM public.choices choice WHERE choice.question_id = question.id AND choice.is_correct) <> 1) AS choice_questions_without_one_correct_choice,
    (SELECT count(*)::integer FROM public.questions question JOIN imported_quizzes q ON q.id = question.quiz_id WHERE question.question_type = 'fill_blank' AND EXISTS (SELECT 1 FROM public.choices choice WHERE choice.question_id = question.id)) AS fill_blank_questions_with_choices
)
SELECT json_build_object(
  'total_units', (SELECT count(*) FROM per_unit),
  'total_questions', (SELECT coalesce(sum(question_count), 0) FROM per_unit),
  'total_choices', (SELECT coalesce(sum(choice_count), 0) FROM per_unit),
  'integrity', (SELECT row_to_json(integrity) FROM integrity),
  'units', (SELECT json_agg(per_unit ORDER BY subject, unit) FROM per_unit)
) AS import_report
LIMIT 1;`;

const output = { project_id: "jxdfukggxxlemsoumtal", query };
const outputPath = path.join(projectRoot, "supabase/imports/verify-molarum-question-import.json");
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote verification request for ${summary.units.length} units.`);
