# Molarum Mobile Design Plan — Premium Learning Redesign

## Product Direction

Molarum is a focused Grade 10 learning companion for Android phones in portrait orientation. The experience should feel calm, capable, and personal rather than administrative. The visual language uses a near-black navy canvas, indigo and violet highlights for identity and navigation, and a bright orange accent for forward learning actions and quiz progress. Cards have a restrained glass-like depth, large rounded corners, generous breathing room, and one clear action per screen.

## Screen List and Layout

| Screen | Primary content | Primary action |
|---|---|---|
| Library | Greeting, total-question overview, subject grid, resume prompt | Continue a saved quiz or open a subject |
| Subject dashboard | Subject identity, overall progress, numbered unit cards | Start or continue practice |
| Unit start | Unit context, progress, difficulty and mode choices | Start practice |
| Quiz | Unit label, progress, question, answer choices, feedback, explanation | Answer, then continue |
| Result | Score, learning summary, retry or return to subject | Continue learning |
| Tools | Supported study preferences and concise offline-study guidance | Open a supported study setting |
| Profile | Learner name, streak, overall activity, averages, strongest subject, recent activity | Update profile details |

## Key User Flows

The main flow is Library → Subject → Unit → Start Practice → Quiz → Results → Subject. A saved quiz places **Continue learning** at the top of Library. Profile aggregates existing locally saved attempt data and does not add cloud dependence. Tools explain and link only to supported study controls rather than exposing content-management features.

## Mobile Interaction and Accessibility

The design targets 360–430 px wide Android screens. Every tap target is at least 48 px tall, cards have visible pressed feedback, primary actions use orange, and status is never conveyed through color alone. All long pages scroll above the persistent tab bar. Text uses a minimum 13 px support size and 16 px body size, with line heights that protect against clipping at larger system font scales.

## Color Choices

| Token | Value | Use |
|---|---|---|
| Midnight | `#070A16` | App background |
| Ink surface | `#101527` | Cards and navigation |
| Indigo | `#8B5CF6` | Brand, active tab, secondary emphasis |
| Violet glow | `#B66CFF` | Overview gradients and highlights |
| Momentum orange | `#FF8A1F` | Start, continue, and quiz progress |
| Mint | `#6EE7B7` | Positive availability and completed states |
| Cloud | `#F8FAFC` | Primary text |
| Steel | `#9AA5BE` | Supporting text |

The existing Molarum logo remains the product mark. No new decorative asset is required for the redesign.
