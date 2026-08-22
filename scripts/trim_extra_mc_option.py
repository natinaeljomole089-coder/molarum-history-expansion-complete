"""Conservatively normalize malformed five-option MC items to Molarum's four-option schema.

Only trims a trailing fifth option when the first four choices are distinct and include
the existing keyed answer. It does not create, rewrite, or infer any question content.
"""

import json
import sys
from pathlib import Path


def repair(path: Path) -> tuple[int, list[str]]:
    bank = json.loads(path.read_text(encoding="utf-8"))
    repaired = 0
    skipped: list[str] = []

    for question in bank.get("questions", []):
        if question.get("type") != "multiple_choice":
            continue
        options = question.get("options")
        if not isinstance(options, list) or len(options) != 5:
            continue
        retained = options[:4]
        if len(set(retained)) != 4 or question.get("answer") not in retained:
            skipped.append(question.get("id", "unknown"))
            continue
        question["options"] = retained
        repaired += 1

    if skipped:
        return repaired, skipped
    path.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return repaired, skipped


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: trim_extra_mc_option.py <bank.json> [<bank.json> ...]")

    unresolved = []
    for raw_path in sys.argv[1:]:
        path = Path(raw_path)
        repaired, skipped = repair(path)
        print(f"{path.name}: trimmed {repaired} extra option(s)")
        if skipped:
            unresolved.append(f"{path.name}: {', '.join(skipped)}")

    if unresolved:
        raise SystemExit("Unsafe to trim: " + "; ".join(unresolved))


if __name__ == "__main__":
    main()
