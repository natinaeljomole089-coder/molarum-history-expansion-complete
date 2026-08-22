"""Correct only canonical IDs on a previously source-generated Citizenship Unit 6 draft."""

import json
from pathlib import Path


PATH = Path("/home/ubuntu/grade10_question_bank_delivery/units/citizenship_unit_6_questions.json")


def main() -> None:
    bank = json.loads(PATH.read_text(encoding="utf-8"))
    questions = bank.get("questions")
    if not isinstance(questions, list) or len(questions) != 40:
        raise ValueError("Expected an existing 40-question Unit 6 draft.")
    for index, question in enumerate(questions, start=1):
        if question.get("unitId") != "Unit 6" or question.get("unitTitle") != "Citizenship Unit 6: Human Rights":
            raise ValueError("Draft unit identity is not the expected Citizenship Unit 6 source batch.")
        if question.get("id") != f"geography-u03-{index:03d}":
            raise ValueError("Draft IDs do not match the known pre-repair generator metadata error.")
        question["id"] = f"citizenship-u06-{index:03d}"
    PATH.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Corrected {len(questions)} canonical IDs in {PATH}")


if __name__ == "__main__":
    main()
