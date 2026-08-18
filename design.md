# Molarum Mobile Interface Design

## Product Frame

Molarum is a **portrait-first Grade 10 revision library** for Android phones. The interface translates the existing “Laboratory Notebook / Quiet Study Desk” direction into a native one-handed experience: warm paper surfaces, deep navy editorial type, copper primary actions, muted sage for confirmed states, and ochre for source-review cautions. The application contains no account, cloud synchronization, analytics, payment, or formal assessment features.

## Screen List

| Screen | Primary content and functionality |
|---|---|
| Library | Searchable subject list with locally validated unit and question counts, active-bank state, content warning, and access to learner records and content tools. |
| Subject Units | A subject’s available and unresolved units. Only units with a validated local bank can begin a quiz. |
| Unit Detail | Unit title, concept list from validated content, question count, difficulty filter, timed-mode switch, “Teacher review recommended” notice, and Start Quiz action. |
| Quiz | One question at a time with type-specific controls, clear progress, immediate source-grounded explanation, and Exit Unit action. |
| Results | Local score, answer summary, replay action, and return to library. |
| Teacher Review | Local-only Draft, Approved, and Hidden state controls, review-status import, and content-summary export. |
| Question Bank | Safe JSON import, validation report, unchanged-bank guarantee after a failed import, active-bank reset, and bundled-bank status. |
| Learner Records | Optional learner name, class, and school plus device-only score history and PDF export. |
| Blueprint | On-device project blueprint viewer with Download blueprint and Copy master prompt controls. |

## Layout and Interaction Plan

Every primary screen is designed for **360 × 800 and 412 × 915 Android Chrome / native Android portrait**. Primary actions sit within the lower thumb zone; secondary actions remain in overflow areas or lower page sections. The navigation uses a restrained three-item tab bar: **Library**, **Records**, and **Tools**. Contextual screens use an explicit back affordance and no modal-only route that leaves the user without an exit.

The Library screen begins with a compact notebook masthead, then a single search field and a full-width, sectioned subject list rather than generic dashboard cards. Subject rows resemble indexed notebook dividers: a left color mark, name and content state in the center, and a unit/question count on the right. A non-dismissible content note makes it clear that all question items require teacher review and are for revision only.

Quiz answers use large, separated press targets. Multiple choice and true/false use a four- or two-choice vertical list; short-answer and numerical use a single accessible text input. Once submitted, the answer area becomes read-only while a grounded explanation panel appears, followed by a single “Next question” action. Both correct and incorrect states use text labels and icons in addition to color.

## Key User Flows

| User objective | Flow |
|---|---|
| Start a validated revision unit | Library → Subject → Unit detail → optionally set difficulty/timer → Start Quiz → answer and read explanation → Results. |
| Import approved content | Tools → Question Bank → Import JSON → validate entirely in memory → validation succeeds → explicit local activation → Library reflects the new bank. |
| Handle a bad import | Tools → Question Bank → Import JSON → validation fails → report is shown → existing active bank remains unchanged. |
| Hide a question locally | Tools → Teacher Review → filter question → set Hidden → the question does not appear in future quizzes on this device. |
| Export study history | Records → set optional learner profile → Score history → Export PDF → Android share/save sheet. |
| Access curriculum documentation | Tools → Blueprint → Download blueprint or Copy master prompt. |

## Color Choices

| Role | Token | Color | Rationale |
|---|---|---|---|
| Paper background | `background` | `#F7F1E4` | A warm, low-glare notebook surface. |
| Ink | `foreground` | `#13243A` | Deep navy for high readability and editorial character. |
| Copper action | `primary` | `#A7582B` | Clearly distinguishes the main learning action. |
| Sage confirmation | `success` | `#557A65` | Calm feedback for approved and correct states. |
| Ochre review note | `warning` | `#A87916` | Signals teacher-review and content-governance cautions. |
| Divider | `border` | `#D9CDB8` | Soft notebook-rule separation without dashboard-box styling. |

## Accessibility and Privacy Decisions

The application uses readable text sizing, semantic labels, keyboard-safe input controls, visible focus/pressed states, color-independent result feedback, and short animations only for press and screen-transition confirmation. Learner profile fields, attempts, imported content, and review state remain in local device storage. The app does not claim a completed offline download until a valid bank is locally installed and persisted.

## Content Constraint

No curriculum questions are bundled until owner-approved Grade 10 source material is supplied, extracted by unit, and validated. The initial library therefore communicates **“No validated question bank installed”** rather than displaying invented educational facts or fabricated question counts.
