"""Merge separately validated Molarum units into the bundled source-grounded bank."""

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/home/ubuntu/molarum")
BASE_PATH = ROOT / "assets" / "question-banks" / "grade10-source-grounded-bank.json"
UNIT_DIR = ROOT / "assets" / "question-banks" / "pending-subject-units"


def main() -> None:
    bank = json.loads(BASE_PATH.read_text(encoding="utf-8"))
    existing_ids = {question["id"] for question in bank["questions"]}
    existing_wording = {question["question"].strip().casefold() for question in bank["questions"]}
    additions = []
    for path in sorted(UNIT_DIR.glob("*.json")):
        unit = json.loads(path.read_text(encoding="utf-8"))
        for question in unit["questions"]:
            if question["id"] in existing_ids:
                raise ValueError(f"Duplicate ID: {question['id']}")
            wording = question["question"].strip().casefold()
            if wording in existing_wording:
                raise ValueError(f"Duplicate wording: {question['question']}")
            existing_ids.add(question["id"])
            existing_wording.add(wording)
            additions.append(question)
    bank["questions"] = [*bank["questions"], *additions]
    bank["generatedAt"] = datetime.now(timezone.utc).isoformat()
    bank["sourceCatalogVersion"] = "owner-drive-grade10-textbooks-2026-08-22-expanded"
    BASE_PATH.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Merged {len(additions)} questions; total {len(bank['questions'])}.")


if __name__ == "__main__":
    main()
