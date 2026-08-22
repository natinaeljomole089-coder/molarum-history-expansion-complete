"""Generate source-grounded Molarum question units from owner-approved Drive textbook extracts.

This script intentionally has no web-search capability. It only sends selected local textbook
extracts to the configured built-in model, then saves machine-readable draft units for the
project validator and teacher review.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from openai import OpenAI

ROOT = Path("/home/ubuntu/molarum")
SOURCE_DIR = Path("/home/ubuntu/molarum-source-review/pending-subjects")
OUTPUT_DIR = ROOT / "assets" / "question-banks" / "pending-subject-units"

SUBJECTS = [
    {
        "id": "mathematics",
        "title": "Mathematics",
        "unit_id": "Unit 1",
        "unit_title": "Unit 1: Relations and Functions",
        "file": "grade10-mathematics.txt",
        "start": 204,
        "end": 2727,
        "source_note": "Grade 10 Mathematics Student Textbook, Unit 1: Relations and Functions (owner-connected Google Drive file 1MR1DGORWmpf10Z6KiVkMm04CxfgDQ0C8).",
    },
    {
        "id": "geography",
        "title": "Geography",
        "unit_id": "Unit 1",
        "unit_title": "Unit 1: Landforms of Africa",
        "file": "grade10-geography.txt",
        "start": 150,
        "end": 974,
        "source_note": "Grade 10 Geography Student Textbook, Unit One: Landforms of Africa (owner-connected Google Drive file 1fzhjSsBXzQ_RfmAUm8TfViZfPKLCpWWa).",
    },
    {
        "id": "citizenship",
        "title": "Citizenship",
        "unit_id": "Unit 1",
        "unit_title": "Unit 1: Democracy and Democratization",
        "file": "grade10-citizenship.txt",
        "start": 238,
        "end": 2090,
        "source_note": "Grade 10 Citizenship Education Student Textbook, Unit 1: Democracy and Democratization (owner-connected Google Drive file 1iMqcGXQnPCcXrAJ_ToYM30HiQL3KY-yl).",
    },
    {
        "id": "health_pe",
        "title": "Health & PE",
        "unit_id": "Unit 1",
        "unit_title": "Unit 1: Health and Physical Education",
        "file": "grade10-hpe.txt",
        "start": 248,
        "end": 823,
        "source_note": "Grade 10 Health and Physical Education Student Textbook, Unit One (owner-connected Google Drive file 1iSNgiIExCCgSwrWgGROccSbpnovt-9dP).",
    },
    {
        "id": "economics",
        "title": "Economics",
        "unit_id": "Unit 1",
        "unit_title": "Unit 1: Theory of Consumer Behaviour",
        "file": "grade10-economics.txt",
        "start": 330,
        "end": 1395,
        "source_note": "Grade 10 Economics Student Textbook, Unit 1: Theory of Consumer Behaviour (owner-connected Google Drive file 1vUn9gPEhATRdeA_xwR0iW5vKnOjhhjiP).",
    },
]

QUESTION_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "minItems": 40,
            "maxItems": 40,
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "unitId": {"type": "string"},
                    "unitTitle": {"type": "string"},
                    "topic": {"type": "string"},
                    "type": {"type": "string", "enum": ["multiple_choice", "true_false", "short_answer", "numerical"]},
                    "question": {"type": "string"},
                    "options": {"type": "array", "items": {"type": "string"}},
                    "answer": {"type": "string"},
                    "explanation": {"type": "string"},
                    "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"]},
                    "sourceNote": {"type": "string"},
                    "reviewStatus": {"type": "string", "enum": ["ai_draft"]},
                },
                "required": ["id", "unitId", "unitTitle", "topic", "type", "question", "options", "answer", "explanation", "difficulty", "sourceNote", "reviewStatus"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["questions"],
    "additionalProperties": False,
}


def read_source(spec: dict) -> str:
    lines = (SOURCE_DIR / spec["file"]).read_text(encoding="utf-8", errors="replace").splitlines()
    return "\n".join(lines[spec["start"] - 1 : spec["end"]])


def prompt_for(spec: dict, source: str) -> str:
    return f"""You are authoring an offline Grade 10 revision bank from the owner-approved source excerpt below. You must use ONLY the excerpt. Do not use web knowledge, implied facts, or unstated formulas. If the excerpt does not support a candidate, do not write that question.

Write exactly 40 unique questions for {spec['title']} — {spec['unit_title']}.

Required distribution: exactly 20 multiple_choice, 4 true_false, 8 short_answer, and 8 numerical; exactly 14 easy, 18 medium, and 8 hard. Multiple-choice questions must have exactly four plausible, clearly incorrect distractors and the answer must exactly match one option. True/false questions must use exactly [\"True\", \"False\"]. Short-answer and numerical questions must use an empty options array; numerical answers must be source-supported calculations or values and include units only where the source establishes them. Every explanation must teach the answer in one or two sentences and must be grounded in the excerpt.

Use question IDs {spec['id']}-u01-001 through {spec['id']}-u01-040. Set unitId to \"{spec['unit_id']}\", unitTitle to \"{spec['unit_title']}\", reviewStatus to \"ai_draft\", and sourceNote exactly to \"{spec['source_note']}\". Avoid copied wording, trick questions, vague prompts, and questions that need an image not contained in the text.

SOURCE EXCERPT START
{source}
SOURCE EXCERPT END"""


def generate_one(client: OpenAI, spec: dict) -> dict:
    source = read_source(spec)
    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": "Return only the requested JSON. You are a rigorous educational author who refuses to add knowledge absent from the supplied source."},
            {"role": "user", "content": prompt_for(spec, source)},
        ],
        response_format={"type": "json_schema", "json_schema": {"name": "molarum_unit", "strict": True, "schema": QUESTION_SCHEMA}},
        max_completion_tokens=18000,
        extra_body={"reasoning": {"effort": "medium"}},
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError(f"No generated content for {spec['id']}")
    unit = json.loads(content)
    return {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceCatalogVersion": "owner-drive-grade10-pending-subjects-2026-08-22",
        "questions": unit["questions"],
    }


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    client = OpenAI()
    for spec in SUBJECTS:
        output_path = OUTPUT_DIR / f"{spec['id']}-unit-1.json"
        unit = generate_one(client, spec)
        output_path.write_text(json.dumps(unit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
