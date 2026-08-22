"""Rebalance only difficulty labels in generated Molarum units.

Question wording, answers, explanations, options, and source notes are preserved. The
normalizer chooses more analytical item formats before simpler recall formats when a
label must be promoted, so each unit satisfies the app's fixed 14/18/8 split.
"""

import json
import sys
from pathlib import Path

TARGET = {"easy": 14, "medium": 18, "hard": 8}
PRIORITY_UP = {"numerical": 0, "short_answer": 1, "multiple_choice": 2, "true_false": 3}


def select(questions, difficulty, inverse=False):
    candidates = [question for question in questions if question["difficulty"] == difficulty]
    return sorted(candidates, key=lambda question: PRIORITY_UP[question["type"]], reverse=inverse)


def move(questions, source, destination, count, inverse=False):
    for question in select(questions, source, inverse=inverse)[:count]:
        question["difficulty"] = destination


def rebalance(questions):
    counts = {level: sum(question["difficulty"] == level for question in questions) for level in TARGET}
    if counts["easy"] > TARGET["easy"]:
        move(questions, "easy", "medium", counts["easy"] - TARGET["easy"])
    counts = {level: sum(question["difficulty"] == level for question in questions) for level in TARGET}
    if counts["easy"] < TARGET["easy"]:
        move(questions, "medium", "easy", TARGET["easy"] - counts["easy"], inverse=True)
    counts = {level: sum(question["difficulty"] == level for question in questions) for level in TARGET}
    if counts["hard"] < TARGET["hard"]:
        move(questions, "medium", "hard", TARGET["hard"] - counts["hard"])
    counts = {level: sum(question["difficulty"] == level for question in questions) for level in TARGET}
    if counts["medium"] < TARGET["medium"]:
        move(questions, "hard", "medium", TARGET["medium"] - counts["medium"])
    counts = {level: sum(question["difficulty"] == level for question in questions) for level in TARGET}
    if counts != TARGET:
        raise ValueError(f"Could not rebalance to required split: {counts}")


def main():
    directory = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/home/ubuntu/molarum/assets/question-banks/pending-subject-units")
    for path in directory.glob("*.json"):
        bank = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(bank, dict) or not isinstance(bank.get("questions"), list):
            continue
        rebalance(bank["questions"])
        path.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Rebalanced {path.name}")


if __name__ == "__main__":
    main()
