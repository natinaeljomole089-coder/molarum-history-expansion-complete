"""Merge explicitly accepted external delivery-package units into the bundled bank.

The script is intentionally narrow: it archives the current bank outside the deployed
project, accepts only Geography Unit 3 and Citizenship Unit 6, and fails before writing
if any ID or normalized wording would duplicate existing or staged content.
"""

from __future__ import annotations

import json
import re
import shutil
import unicodedata
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path("/home/ubuntu/molarum")
BASE = ROOT / "assets/question-banks/grade10-source-grounded-bank.json"
DELIVERY = Path("/home/ubuntu/grade10_question_bank_delivery")
ARCHIVE = DELIVERY / "reports/bundled-bank-before-continuation-1.json"
CATALOG_VERSION = "owner-drive-grade10-textbooks-2026-08-22-full-expanded-continuation-1"
ACCEPTED = [
    (DELIVERY / "units/geography_unit_3_questions.json", "geography", "Unit 3"),
    (DELIVERY / "units/citizenship_unit_6_questions.json", "citizenship", "Unit 6"),
]


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", value).strip()).casefold()


def main() -> None:
    bank = json.loads(BASE.read_text(encoding="utf-8"))
    questions = bank.get("questions")
    if not isinstance(questions, list) or len(questions) != 1640:
        raise ValueError("Expected the preserved 1,640-question bundled baseline.")
    existing_ids = {question["id"] for question in questions}
    existing_wording = {normalize(question["question"]) for question in questions}
    additions = []
    for path, subject, unit_id in ACCEPTED:
        unit = json.loads(path.read_text(encoding="utf-8"))
        candidates = unit.get("questions")
        if not isinstance(candidates, list) or len(candidates) != 40:
            raise ValueError(f"{path.name} is not a complete 40-question unit.")
        expected_prefix = f"{subject}-u{int(unit_id.split()[-1]):02d}-"
        for question in candidates:
            if question.get("unitId") != unit_id or not str(question.get("id", "")).startswith(expected_prefix):
                raise ValueError(f"{path.name} contains a noncanonical question identity.")
            wording = normalize(question["question"])
            if question["id"] in existing_ids:
                raise ValueError(f"Duplicate ID: {question['id']}")
            if wording in existing_wording:
                raise ValueError(f"Duplicate normalized wording: {question['question']}")
            existing_ids.add(question["id"])
            existing_wording.add(wording)
            additions.append(question)
    if len(additions) != 80:
        raise ValueError("Expected 80 accepted continuation questions.")
    ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(BASE, ARCHIVE)
    bank["questions"] = [*questions, *additions]
    bank["generatedAt"] = datetime.now(timezone.utc).isoformat()
    bank["sourceCatalogVersion"] = CATALOG_VERSION
    BASE.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Archived 1,640-question baseline to {ARCHIVE}")
    print(f"Merged {len(additions)} accepted questions; bundled total is {len(bank['questions'])}.")


if __name__ == "__main__":
    main()
