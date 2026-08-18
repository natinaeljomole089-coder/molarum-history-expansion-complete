# Source Governance

Molarum’s app code contains no textbook-derived questions because no owner-approved Grade 10 source material has been supplied. The interface displays an intentional unresolved state until a locally validated bank is imported.

The standalone validator rejects missing required fields, duplicate IDs and wording, missing answer keys, invalid answer-option relationships, incorrect type or difficulty distributions, empty source notes, and review statuses other than `ai_draft`. For the command-line validation flow, run:

```bash
pnpm validate:bank /path/to/complete_question_bank.json
```

The same rules execute before an Android user can activate an imported JSON bank. On failure, the current bank is kept intact and the app displays the rejection report. Local teachers may overlay Draft, Approved, or Hidden review states, but those do not transform the original provenance or remove the “Teacher review recommended” label.
