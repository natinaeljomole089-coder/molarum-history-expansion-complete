from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ACTIVE = ROOT / "assets/question-banks/grade10-source-grounded-bank.json"
DRAFT = ROOT / "content/drafts/history_unit_1_manual_draft.json"
ARCHIVE = ROOT / "content/archives/grade10-source-grounded-bank-1800-before-history-unit-1.json"

active = json.loads(ACTIVE.read_text(encoding="utf-8"))
draft = json.loads(DRAFT.read_text(encoding="utf-8"))
if len(active["questions"]) != 1800 or len(draft["questions"]) != 40:
    raise ValueError("Expected a 1,800-question active bank and a 40-question History Unit 1 draft.")
if {item["unitId"] for item in draft["questions"]} != {"Unit 1"} or not all(item["id"].startswith("history-u01-") for item in draft["questions"]):
    raise ValueError("Draft does not contain only History Unit 1 questions.")
old_ids = {item["id"] for item in active["questions"]}
new_ids = [item["id"] for item in draft["questions"]]
if old_ids.intersection(new_ids) or len(new_ids) != len(set(new_ids)):
    raise ValueError("Duplicate question IDs prevent the History merge.")
ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
if not ARCHIVE.exists():
    shutil.copy2(ACTIVE, ARCHIVE)
active["questions"].extend(draft["questions"])
active["generatedAt"] = datetime.now(timezone.utc).isoformat()
active["sourceCatalogVersion"] = "owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-1"
ACTIVE.write_text(json.dumps(active, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Merged History Unit 1; active bank has {len(active['questions'])} questions.")
