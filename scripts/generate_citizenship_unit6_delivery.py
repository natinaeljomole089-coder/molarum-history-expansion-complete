"""Generate an unmerged source-bounded Citizenship Unit 6 delivery draft.

This configuration reuses the hardened typed-batch generator. It reads only the approved
local textbook extraction and writes only to the external continuation package.
"""

import generate_geography_unit3_delivery as generator


generator.SOURCE_TEXT = generator.Path("/home/ubuntu/molarum-source-review/pending-subjects/grade10-citizenship.txt")
generator.OUTPUT_PATH = generator.Path("/home/ubuntu/grade10_question_bank_delivery/units/citizenship_unit_6_questions.json")
generator.RAW_RESPONSE_PATH = generator.Path("/home/ubuntu/grade10_question_bank_delivery/reports/citizenship_unit_6_raw_response.json")
generator.UNIT_ID = "Unit 6"
generator.UNIT_TITLE = "Citizenship Unit 6: Human Rights"
generator.SUBJECT_ID = "citizenship"
generator.UNIT_NUMBER = 6
generator.SOURCE_CATALOG_VERSION = "owner-drive-grade10-textbooks-2026-08-22-citizenship-unit6-delivery"
generator.SOURCE_NOTES = [
    "Citizenship Education Student Textbook, Grade 10, Unit 6, §6.1 The concept of human right, printed pp. 126–131 (owner-approved local source).",
    "Citizenship Education Student Textbook, Grade 10, Unit 6, §6.2 Citizens and state obligations in realizing human rights, printed pp. 132–135 (owner-approved local source).",
]


def unit_source() -> str:
    lines = generator.SOURCE_TEXT.read_text(encoding="utf-8", errors="replace").splitlines()
    return "\n".join(lines[4260:4734])


generator.unit_source = unit_source

if __name__ == "__main__":
    generator.main()
