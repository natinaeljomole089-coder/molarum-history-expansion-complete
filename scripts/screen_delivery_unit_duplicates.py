"""Read-only duplicate screening for an external continuation-package unit."""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path


BASE = Path("/home/ubuntu/molarum/assets/question-banks/grade10-source-grounded-bank.json")


def normalise(value: str) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", value).strip()).casefold()


def tokens(value: str) -> set[str]:
    return {token for token in re.findall(r"[a-z0-9]+", normalise(value)) if len(token) > 2}


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: screen_delivery_unit_duplicates.py /absolute/path/to/unit.json")
    candidate_path = Path(sys.argv[1])
    base = json.loads(BASE.read_text(encoding="utf-8"))["questions"]
    candidate = json.loads(candidate_path.read_text(encoding="utf-8"))["questions"]
    base_ids = {question["id"] for question in base}
    base_wording = {normalise(question["question"]): question["id"] for question in base}
    exact = []
    lexical = []
    for question in candidate:
        wording = normalise(question["question"])
        if question["id"] in base_ids:
            exact.append({"kind": "id", "candidate": question["id"]})
        if wording in base_wording:
            exact.append({"kind": "wording", "candidate": question["id"], "existing": base_wording[wording]})
        candidate_tokens = tokens(question["question"])
        if not candidate_tokens:
            continue
        for existing in base:
            existing_tokens = tokens(existing["question"])
            if not existing_tokens:
                continue
            score = len(candidate_tokens & existing_tokens) / len(candidate_tokens | existing_tokens)
            if score >= 0.62:
                lexical.append({"candidate": question["id"], "existing": existing["id"], "score": round(score, 3)})
    print(json.dumps({"candidate": str(candidate_path), "exactDuplicates": exact, "highLexicalSimilarity": lexical}, indent=2))
    if exact:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
