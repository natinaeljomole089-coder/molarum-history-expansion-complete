"""Merge only strictly accepted additional owner-source units into the bundled bank."""

import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path("/home/ubuntu/molarum")
BASE_PATH = ROOT / "assets" / "question-banks" / "grade10-source-grounded-bank.json"
UNIT_DIR = ROOT / "assets" / "question-banks" / "additional-source-units"
CATALOG_VERSION = "owner-drive-grade10-textbooks-2026-08-22-full-expanded"
ACCEPTED_FILES = (
    "mathematics-unit-2.json",
    "mathematics-unit-3.json",
    "mathematics-unit-4.json",
    "mathematics-unit-5.json",
    "mathematics-unit-6.json",
    "mathematics-unit-7.json",
    "geography-unit-2.json",
    "geography-unit-4.json",
    "geography-unit-5.json",
    "geography-unit-6.json",
    "geography-unit-7.json",
    "geography-unit-8.json",
    "citizenship-unit-2.json",
    "citizenship-unit-3.json",
    "citizenship-unit-4.json",
    "citizenship-unit-5.json",
    "citizenship-unit-7.json",
    "citizenship-unit-8.json",
)


def normalize_wording(value: str) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", value).strip()).casefold()


def main() -> None:
    bank = json.loads(BASE_PATH.read_text(encoding="utf-8"))
    existing_ids = {question["id"] for question in bank["questions"]}
    existing_wording = {normalize_wording(question["question"]) for question in bank["questions"]}
    additions = []

    for name in ACCEPTED_FILES:
        path = UNIT_DIR / name
        if not path.exists():
            raise FileNotFoundError(f"Required accepted unit is missing: {path}")
        unit = json.loads(path.read_text(encoding="utf-8"))
        questions = unit.get("questions")
        if not isinstance(questions, list) or len(questions) != 40:
            raise ValueError(f"{name} is not a complete 40-question unit")
        for question in questions:
            question_id = question["id"]
            wording = normalize_wording(question["question"])
            if question_id in existing_ids:
                raise ValueError(f"Duplicate ID: {question_id}")
            if wording in existing_wording:
                raise ValueError(f"Duplicate normalized wording: {question['question']}")
            existing_ids.add(question_id)
            existing_wording.add(wording)
            additions.append(question)

    expected_additions = len(ACCEPTED_FILES) * 40
    if len(additions) != expected_additions:
        raise ValueError(f"Expected {expected_additions} additions, found {len(additions)}")

    bank["questions"] = [*bank["questions"], *additions]
    bank["generatedAt"] = datetime.now(timezone.utc).isoformat()
    bank["sourceCatalogVersion"] = CATALOG_VERSION
    BASE_PATH.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Merged {len(additions)} questions from {len(ACCEPTED_FILES)} units; total {len(bank['questions'])}.")


if __name__ == "__main__":
    main()
