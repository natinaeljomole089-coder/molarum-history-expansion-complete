import { readFile } from "node:fs/promises";

import { formatValidationReport, validateQuestionBank } from "../lib/molarum/validator";

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: pnpm validate:bank <path-to-question-bank.json>");
    process.exit(2);
  }
  const raw = await readFile(inputPath, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("Rejected: the file is not valid JSON.");
    process.exit(1);
  }
  const result = validateQuestionBank(parsed);
  const report = result.ok ? result.value.report : result.report;
  console.log(formatValidationReport(report));
  if (!result.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unexpected validation failure.");
  process.exit(1);
});
