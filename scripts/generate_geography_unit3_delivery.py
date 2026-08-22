"""Generate one unmerged, source-bounded Geography Unit 3 draft for the external delivery package.

The work is split by question type so the model cannot return an invalid 40-item type mix.
Only deterministic IDs and difficulty labels are applied after generation; question content stays
fully source-bounded. The active bundled bank is never modified by this script.
"""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path

from openai import OpenAI


SOURCE_TEXT = Path("/home/ubuntu/molarum-source-review/pending-subjects/grade10-geography.txt")
DELIVERY_ROOT = Path("/home/ubuntu/grade10_question_bank_delivery")
OUTPUT_PATH = DELIVERY_ROOT / "units" / "geography_unit_3_questions.json"
RAW_RESPONSE_PATH = DELIVERY_ROOT / "reports" / "geography_unit_3_raw_response.json"

UNIT_ID = "Unit 3"
UNIT_TITLE = "Unit 3: Natural Resource Base of Africa"
SUBJECT_ID = "geography"
UNIT_NUMBER = 3
SOURCE_CATALOG_VERSION = "owner-drive-grade10-textbooks-2026-08-22-geography-unit3-delivery"
SOURCE_NOTES = [
    "Grade 10 Geography Student Textbook, Unit 3, §3.1 Overview of Major Natural Resources of the World, printed pp. 52–57 (owner-approved local source).",
    "Grade 10 Geography Student Textbook, Unit 3, §3.2 Major Drainage and Water Resources in Africa, printed pp. 58–65 (owner-approved local source).",
    "Grade 10 Geography Student Textbook, Unit 3, §3.3 Main Types of Soils and Mineral Resources in Africa, printed pp. 66–72 (owner-approved local source).",
    "Grade 10 Geography Student Textbook, Unit 3, §3.4 Major Vegetation and Wildlife of Africa, printed pp. 73–82 (owner-approved local source).",
]

TYPE_COUNTS = [("multiple_choice", 20), ("true_false", 4), ("short_answer", 8), ("numerical", 8)]
DIFFICULTIES = (["easy"] * 14) + (["medium"] * 18) + (["hard"] * 8)
MODEL = "gpt-5"


def unit_source() -> str:
    lines = SOURCE_TEXT.read_text(encoding="utf-8", errors="replace").splitlines()
    return "\n".join(lines[1945:3325])


def options_schema(question_type: str) -> dict:
    if question_type == "multiple_choice":
        return {"type": "array", "minItems": 4, "maxItems": 4, "items": {"type": "string"}}
    if question_type == "true_false":
        return {"type": "array", "minItems": 2, "maxItems": 2, "items": {"type": "string"}}
    return {"type": "array", "maxItems": 0, "items": {"type": "string"}}


def response_schema(question_type: str, count: int) -> dict:
    item = {
        "type": "object",
        "properties": {
            "topic": {"type": "string"},
            "question": {"type": "string"},
            "options": options_schema(question_type),
            "answer": {"type": "string"},
            "explanation": {"type": "string"},
            "sourceNote": {"type": "string", "enum": SOURCE_NOTES},
        },
        "required": ["topic", "question", "options", "answer", "explanation", "sourceNote"],
        "additionalProperties": False,
    }
    return {
        "type": "object",
        "properties": {"questions": {"type": "array", "minItems": count, "maxItems": count, "items": item}},
        "required": ["questions"],
        "additionalProperties": False,
    }


def prompt(question_type: str, count: int, source: str) -> str:
    type_rules = {
        "multiple_choice": "Provide exactly four distinct plausible options. The answer must exactly match one option.",
        "true_false": "Use options exactly [\"True\", \"False\"] and answer exactly True or False.",
        "short_answer": "Use an empty options array and a brief unambiguous expected answer.",
        "numerical": "Use an empty options array. Use only textual quantities or methods explicitly present in the excerpt. The explanation must show a checkable calculation and final unit; skip figures, maps, and tables unless their fact is repeated in narrative text.",
    }[question_type]
    notes = "\n".join(f"- {note}" for note in SOURCE_NOTES)
    return f"""Create exactly {count} distinct Grade 10 {UNIT_TITLE} {question_type} questions from the approved source excerpt only.

Never use outside knowledge, invented values, omitted visual/map/table facts, or uncertain OCR. Each question must be independently answerable from the excerpt. Avoid duplicates or near-duplicates. {type_rules}

Each item needs a topic, question, options, answer, concise source-grounded explanation, and one exact sourceNote from this list:
{notes}

Approved source excerpt begins:
{source}
Approved source excerpt ends."""


def extract_content(response: object) -> str:
    choices = getattr(response, "choices", None)
    if not choices:
        raise ValueError("Model response contained no choices.")
    choice = choices[0]
    message = getattr(choice, "message", None)
    content = getattr(message, "content", None) if message else None
    if not isinstance(content, str) or not content.strip():
        raise ValueError(f"Model response contained no JSON content (finish_reason={getattr(choice, 'finish_reason', 'unknown')}).")
    return content


def generate_type(client: OpenAI, question_type: str, count: int, source: str) -> tuple[list[dict], str]:
    last_error: Exception | None = None
    for attempt in range(1, 4):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": "Return only strict JSON. You are a precise textbook-grounded educational author."},
                    {"role": "user", "content": prompt(question_type, count, source)},
                ],
                response_format={"type": "json_schema", "json_schema": {"name": f"molarum_geography_unit_3_{question_type}", "strict": True, "schema": response_schema(question_type, count)}},
                max_completion_tokens=12000,
                extra_body={"reasoning": {"effort": "low"}},
            )
            content = extract_content(response)
            payload = json.loads(content)
            if len(payload.get("questions", [])) != count:
                raise ValueError(f"Expected {count} {question_type} items.")
            return payload["questions"], content
        except Exception as error:
            last_error = error
            print(f"{question_type} attempt {attempt} failed: {error}")
            time.sleep(2**(attempt - 1))
    raise RuntimeError(f"Unable to generate {question_type}: {last_error}")


def main() -> None:
    source = unit_source()
    if len(source.strip()) < 4000:
        raise ValueError("Approved Unit 3 excerpt is unexpectedly short; generation stopped.")
    client = OpenAI()
    questions: list[dict] = []
    raw: dict[str, str] = {}
    for question_type, count in TYPE_COUNTS:
        batch, response = generate_type(client, question_type, count, source)
        questions.extend(batch)
        raw[question_type] = response

    for index, question in enumerate(questions, start=1):
        question["id"] = f"{SUBJECT_ID}-u{UNIT_NUMBER:02d}-{index:03d}"
        question["unitId"] = UNIT_ID
        question["unitTitle"] = UNIT_TITLE
        question["difficulty"] = DIFFICULTIES[index - 1]
        question["reviewStatus"] = "ai_draft"

    cursor = 0
    for question_type, count in TYPE_COUNTS:
        for question in questions[cursor : cursor + count]:
            question["type"] = question_type
        cursor += count

    bank = {"schemaVersion": 1, "generatedAt": datetime.now(timezone.utc).isoformat(), "sourceCatalogVersion": SOURCE_CATALOG_VERSION, "questions": questions}
    RAW_RESPONSE_PATH.write_text(json.dumps(raw, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUTPUT_PATH.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
