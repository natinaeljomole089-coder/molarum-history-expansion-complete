"""Retry only the approved-source units that returned empty structured output in bulk mode."""

import concurrent.futures
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from openai import OpenAI

from generate_all_remaining_units import OUTPUT_DIR, QUESTION_SCHEMA, REPORT_PATH, prompt, source_for, specs


def retry(spec):
    source = source_for(spec)
    client = OpenAI()
    for attempt in range(4):
        response = client.chat.completions.create(
            model="gpt-5-mini",
            messages=[
                {"role": "system", "content": "Return one complete strict JSON object only. Do not return null. Every field must be supported by the supplied source."},
                {"role": "user", "content": prompt(spec, source)},
            ],
            response_format={"type": "json_schema", "json_schema": {"name": "molarum_retry_unit", "strict": True, "schema": QUESTION_SCHEMA}},
            max_completion_tokens=18000,
        )
        content = response.choices[0].message.content
        if content:
            payload = json.loads(content)
            if isinstance(payload, dict) and isinstance(payload.get("questions"), list) and len(payload["questions"]) == 40:
                return {"schemaVersion": 1, "generatedAt": datetime.now(timezone.utc).isoformat(), "sourceCatalogVersion": "owner-drive-grade10-expanded-units-2026-08-22", "questions": payload["questions"]}
        time.sleep(3 * (attempt + 1))
    raise RuntimeError("Model returned empty or incomplete structured output after four retries")


def main():
    report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    by_file = {f"{spec['subject_id']}-unit-{spec['unit_number']}.json": spec for spec in specs()}
    failed = [by_file[item["file"]] for item in report["failed"] if item["file"] in by_file]
    if not failed:
        print("No failed units to retry.")
        return
    completed = []
    remaining_failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(retry, spec): spec for spec in failed}
        for future in concurrent.futures.as_completed(futures):
            spec = futures[future]
            filename = f"{spec['subject_id']}-unit-{spec['unit_number']}.json"
            try:
                bank = future.result()
                (OUTPUT_DIR / filename).write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                completed.append({"file": filename, "subject": spec["subject"], "unit": spec["unit_title"], "questions": len(bank["questions"])})
                print(f"Wrote {filename}", flush=True)
            except Exception as error:
                remaining_failures.append({"file": filename, "subject": spec["subject"], "unit": spec["unit_title"], "error": str(error)})
                print(f"Failed {filename}: {error}", flush=True)
    report["completed"].extend(completed)
    report["failed"] = remaining_failures
    report["retriedAt"] = datetime.now(timezone.utc).isoformat()
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Retry completed {len(completed)}/{len(failed)} units.")


if __name__ == "__main__":
    main()
