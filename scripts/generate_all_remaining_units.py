"""Author every remaining Molarum unit from approved local Drive textbook extracts.

Only local owner-approved excerpts are passed to the model. History is intentionally absent:
an approved History textbook was not found. Output stays separate until strict validation and
duplicate checks approve a merge into the bundled bank.
"""

import concurrent.futures
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

from openai import OpenAI

ROOT = Path("/home/ubuntu/molarum")
SOURCE_DIR = Path("/home/ubuntu/molarum-source-review/pending-subjects")
OUTPUT_DIR = ROOT / "assets" / "question-banks" / "additional-source-units"
REPORT_PATH = OUTPUT_DIR / "generation-expansion-report.json"

BOOKS = {
    "mathematics": {
        "subject": "Mathematics",
        "file": "grade10-mathematics.txt",
        "drive_file_id": "1MR1DGORWmpf10Z6KiVkMm04CxfgDQ0C8",
        "starts": [205, 2728, 4700, 7925, 10030, 11428, 13558, 15034],
        "titles": [
            "Relations and Functions",
            "Polynomial Functions",
            "Exponential and Logarithmic Functions",
            "Trigonometric Functions",
            "Circles",
            "Solid Figures",
            "Coordinate Geometry",
        ],
    },
    "geography": {
        "subject": "Geography",
        "file": "grade10-geography.txt",
        "drive_file_id": "1fzhjSsBXzQ_RfmAUm8TfViZfPKLCpWWa",
        "starts": [151, 975, 1946, 3326, 4596, 5634, 6276, 6826, 7837],
        "titles": [
            "Landforms of Africa",
            "Climate of Africa",
            "Natural Resource Base of Africa",
            "Population of Africa",
            "Major Economic and Cultural Activities of Africa",
            "Human–Natural Environment Interactions",
            "Geographic Issues and Public Concerns in Africa",
            "Geospatial Information and Data Processing",
        ],
    },
    "citizenship": {
        "subject": "Citizenship",
        "file": "grade10-citizenship.txt",
        "drive_file_id": "1iMqcGXQnPCcXrAJ_ToYM30HiQL3KY-yl",
        "starts": [249, 954, 2066, 2798, 3490, 4261, 4735, 5527, 6475],
        "titles": [
            "Democracy and Democratization",
            "Citizens in the Digital Technology Age",
            "Understanding Good Governance",
            "Peace and Indigenous Conflict Resolution",
            "Federalism in Ethiopia",
            "Human Rights",
            "Patriotism",
            "Globalization and Global Issues",
        ],
    },
    "economics": {
        "subject": "Economics",
        "file": "grade10-economics.txt",
        "drive_file_id": "1vUn9gPEhATRdeA_xwR0iW5vKnOjhhjiP",
        "starts": [396, 1396, 3187, 4372, 5477, 6938, 7918, 9509, 11033],
        "titles": [
            "Theory of Consumer Behaviour",
            "Theories of Demand and Supply",
            "Theory of Production and Cost",
            "Market Structures",
            "Banking and Finance",
            "Economic Growth",
            "An Overview of the Ethiopian Economy",
            "Business Startups and Innovation",
        ],
    },
    "health_pe": {
        "subject": "Health & PE",
        "file": "grade10-hpe.txt",
        "drive_file_id": "1iSNgiIExCCgSwrWgGROccSbpnovt-9dP",
        "starts": [249, 824, 1843, 2734, 3452, 3957, 4401, 4986, 5782],
        "titles": [
            "Sport and Society",
            "Health and Physical Fitness",
            "Athletics",
            "Football",
            "Volleyball",
            "Basketball",
            "Handball",
            "Self-Defence and Sport Ethics",
        ],
    },
}

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
                    "id": {"type": "string"}, "unitId": {"type": "string"}, "unitTitle": {"type": "string"},
                    "topic": {"type": "string"}, "type": {"type": "string", "enum": ["multiple_choice", "true_false", "short_answer", "numerical"]},
                    "question": {"type": "string"}, "options": {"type": "array", "items": {"type": "string"}}, "answer": {"type": "string"},
                    "explanation": {"type": "string"}, "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"]},
                    "sourceNote": {"type": "string"}, "reviewStatus": {"type": "string", "enum": ["ai_draft"]},
                },
                "required": ["id", "unitId", "unitTitle", "topic", "type", "question", "options", "answer", "explanation", "difficulty", "sourceNote", "reviewStatus"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["questions"],
    "additionalProperties": False,
}


def specs():
    for subject_id, book in BOOKS.items():
        for index, title in enumerate(book["titles"], start=1):
            if index == 1:
                continue  # Already bundled and validated in the prior release.
            start, end = book["starts"][index - 1], book["starts"][index] - 1
            unit_id = f"Unit {index}"
            yield {
                "subject_id": subject_id,
                "subject": book["subject"],
                "file": book["file"],
                "drive_file_id": book["drive_file_id"],
                "unit_number": index,
                "unit_id": unit_id,
                "unit_title": f"{unit_id}: {title}",
                "start": start,
                "end": end,
                "source_note": f"Grade 10 {book['subject']} Student Textbook, {unit_id}: {title} (owner-connected Google Drive file {book['drive_file_id']}).",
            }


def source_for(spec):
    lines = (SOURCE_DIR / spec["file"]).read_text(encoding="utf-8", errors="replace").splitlines()
    return "\n".join(lines[spec["start"] - 1 : spec["end"]])


def prompt(spec, source):
    unit_number = spec["unit_number"]
    prefix = f"{spec['subject_id']}-u{unit_number:02d}"
    return f"""Author exactly 40 Grade 10 revision questions using ONLY the owner-approved source excerpt below. You may not use web knowledge, general knowledge, invented examples, omitted diagrams, or facts not present in the excerpt. If the excerpt cannot support a question, choose another supported concept.

Subject: {spec['subject']}
Unit: {spec['unit_title']}

Required exact distribution: 20 multiple_choice, 4 true_false, 8 short_answer, 8 numerical; label exactly 14 easy, 18 medium, 8 hard. Multiple choice has exactly four plausible, false distractors and the answer text exactly matches an option. True/false uses exactly [\"True\", \"False\"]. Short-answer/numerical use an empty options array. Numerical questions must use only values, formulae, or worked methods explicitly in the excerpt and have one clear answer. Avoid repeated meaning, trick questions, and ungrounded assumptions.

IDs must run {prefix}-001 through {prefix}-040. Set unitId exactly \"{spec['unit_id']}\", unitTitle exactly \"{spec['unit_title']}\", sourceNote exactly \"{spec['source_note']}\", and reviewStatus exactly \"ai_draft\". Every explanation must be source-grounded and teach the answer in one or two sentences.

APPROVED SOURCE EXCERPT START
{source}
APPROVED SOURCE EXCERPT END"""


def generate(spec):
    source = source_for(spec)
    if len(source.strip()) < 1000:
        raise ValueError(f"Source slice too short for {spec['subject_id']} {spec['unit_id']}")
    client = OpenAI()
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model="gpt-5-mini",
                messages=[
                    {"role": "system", "content": "Return only strict JSON. You are a precise textbook-grounded educational author."},
                    {"role": "user", "content": prompt(spec, source)},
                ],
                response_format={"type": "json_schema", "json_schema": {"name": "molarum_additional_unit", "strict": True, "schema": QUESTION_SCHEMA}},
                max_completion_tokens=16000,
                extra_body={"reasoning": {"effort": "low"}},
            )
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Model returned no JSON content")
            payload = json.loads(content)
            return {"schemaVersion": 1, "generatedAt": datetime.now(timezone.utc).isoformat(), "sourceCatalogVersion": "owner-drive-grade10-expanded-units-2026-08-22", "questions": payload["questions"]}
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    all_specs = list(specs())
    report = {"generatedAt": datetime.now(timezone.utc).isoformat(), "requestedUnits": len(all_specs), "completed": [], "failed": []}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_map = {executor.submit(generate, spec): spec for spec in all_specs}
        for future in concurrent.futures.as_completed(future_map):
            spec = future_map[future]
            filename = f"{spec['subject_id']}-unit-{spec['unit_number']}.json"
            try:
                bank = future.result()
                (OUTPUT_DIR / filename).write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                report["completed"].append({"file": filename, "subject": spec["subject"], "unit": spec["unit_title"], "questions": len(bank["questions"])})
                print(f"Wrote {filename}", flush=True)
            except Exception as error:
                report["failed"].append({"file": filename, "subject": spec["subject"], "unit": spec["unit_title"], "error": str(error)})
                print(f"Failed {filename}: {error}", flush=True)
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Completed {len(report['completed'])}/{len(all_specs)} units.", flush=True)


if __name__ == "__main__":
    main()
