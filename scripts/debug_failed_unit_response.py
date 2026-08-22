"""Inspect a single structured response without writing questions, for retry diagnostics only."""

from openai import OpenAI

from generate_all_remaining_units import QUESTION_SCHEMA, prompt, source_for, specs


def main():
    spec = next(item for item in specs() if item["subject_id"] == "economics" and item["unit_number"] == 2)
    response = OpenAI().chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": "Return one complete strict JSON object only."},
            {"role": "user", "content": prompt(spec, source_for(spec))},
        ],
        response_format={"type": "json_schema", "json_schema": {"name": "molarum_debug_unit", "strict": True, "schema": QUESTION_SCHEMA}},
        max_completion_tokens=18000,
    )
    print(response.model_dump_json(indent=2, exclude_none=False))


if __name__ == "__main__":
    main()
