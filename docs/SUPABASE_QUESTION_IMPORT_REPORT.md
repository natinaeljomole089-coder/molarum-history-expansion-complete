# Supabase Question Import Report

## Result

The Molarum Grade 10 catalog was successfully imported into Supabase project `jxdfukggxxlemsoumtal`. The import created **50 quizzes**, **2000 questions**, and **4400 choices**. Every unit contains 40 questions.

## Actual source

> The question catalog was **not stored as HTML**. Its canonical source is the bundled JSON file `assets/question-banks/grade10-source-grounded-bank.json`, catalog version `owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-5`.

| Source property | Value |
|---|---|
| Source format | Canonical Molarum JSON |
| SHA-256 | `a79d1c2bbfde5eb29c05e7618b7de8175d830c3d027833e2c7dc2b35851c662f` |
| Extracted import dataset | `content/imports/molarum-supabase-question-import.json` |
| Questions | 2000 |
| Units | 50 |

## Field mapping

| Molarum JSON | Supabase destination |
|---|---|
| Question ID prefix and `unitId` | `quizzes.subject`, `quizzes.unit` |
| `unitTitle` | `quizzes.title` |
| `type` | `questions.question_type` |
| `question` | `questions.question_text` |
| `answer` | `questions.correct_answer` |
| `explanation` | `questions.explanation` |
| `options` | `choices.choice_text`, `choices.is_correct` |

The source types `short_answer` and `numerical` were normalized to the destination's supported `fill_blank` value. Original multiple-choice and true/false options were inserted as choices; each has exactly one correct choice.

## Security and execution

The import used the server-side Supabase management connection. No service-role or secret key was added to the Android source. Import statements use deterministic identifiers and idempotent upserts, so re-running the generated unit files will update the intended records rather than duplicate them.

## Verified counts by unit

| Subject | Unit | Questions | Choices |
|---|---|---:|---:|
| Biology | Unit 1 | 40 | 88 |
| Biology | Unit 2 | 40 | 88 |
| Biology | Unit 3 | 40 | 88 |
| Biology | Unit 4 | 40 | 88 |
| Biology | Unit 5 | 40 | 88 |
| Biology | Unit 6 | 40 | 88 |
| Chemistry | Unit 1 | 40 | 88 |
| Chemistry | Unit 2 | 40 | 88 |
| Chemistry | Unit 3 | 40 | 88 |
| Chemistry | Unit 4 | 40 | 88 |
| Chemistry | Unit 5 | 40 | 88 |
| Chemistry | Unit 6 | 40 | 88 |
| Citizenship | Unit 1 | 40 | 88 |
| Citizenship | Unit 2 | 40 | 88 |
| Citizenship | Unit 3 | 40 | 88 |
| Citizenship | Unit 4 | 40 | 88 |
| Citizenship | Unit 5 | 40 | 88 |
| Citizenship | Unit 6 | 40 | 88 |
| Citizenship | Unit 7 | 40 | 88 |
| Citizenship | Unit 8 | 40 | 88 |
| Economics | Unit 1 | 40 | 88 |
| Economics | Unit 2 | 40 | 88 |
| Economics | Unit 3 | 40 | 88 |
| Geography | Unit 1 | 40 | 88 |
| Geography | Unit 2 | 40 | 88 |
| Geography | Unit 3 | 40 | 88 |
| Geography | Unit 4 | 40 | 88 |
| Geography | Unit 5 | 40 | 88 |
| Geography | Unit 6 | 40 | 88 |
| Geography | Unit 7 | 40 | 88 |
| Geography | Unit 8 | 40 | 88 |
| Health & PE | Unit 1 | 40 | 88 |
| History | Unit 1 | 40 | 88 |
| History | Unit 2 | 40 | 88 |
| History | Unit 3 | 40 | 88 |
| History | Unit 4 | 40 | 88 |
| History | Unit 5 | 40 | 88 |
| Mathematics | Unit 1 | 40 | 88 |
| Mathematics | Unit 2 | 40 | 88 |
| Mathematics | Unit 3 | 40 | 88 |
| Mathematics | Unit 4 | 40 | 88 |
| Mathematics | Unit 5 | 40 | 88 |
| Mathematics | Unit 6 | 40 | 88 |
| Mathematics | Unit 7 | 40 | 88 |
| Physics | Unit 1 | 40 | 88 |
| Physics | Unit 2 | 40 | 88 |
| Physics | Unit 3 | 40 | 88 |
| Physics | Unit 4 | 40 | 88 |
| Physics | Unit 5 | 40 | 88 |
| Physics | Unit 6 | 40 | 88 |

## Integrity checks

| Check | Result |
|---|---:|
| Imported quizzes | 50 |
| Imported questions | 2,000 |
| Imported choices | 4,400 |
| Orphan imported questions | 0 |
| Orphan choices | 0 |
| Choice questions lacking exactly one correct choice | 0 |
| Fill-blank questions with choices | 0 |
