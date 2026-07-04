# User Journey

**Project:** Prompt Pilot

Related documents: [Product Contract](product-contract.md) · [MVP Scope](mvp-scope.md) · [Domain Glossary](domain-glossary.md)

---

## Primary workflow

The main user path from sign-in to export:

| Step | Action | Actor |
|---|---|---|
| 1 | User signs in | User |
| 2 | User creates a project | User |
| 3 | User chooses an input source | User |
| 4 | User provides an idea, script, article URL, or product URL | User |
| 5 | User selects a video objective | User |
| 6 | User selects a publishing destination | User |
| 7 | User selects a video category | User |
| 8 | User chooses duration | User |
| 9 | User chooses visual style | User |
| 10 | User selects production requirements | User |
| 11 | User selects budget and quality priorities | User |
| 12 | User reviews the brief | User |
| 13 | System validates the brief | System |
| 14 | System calculates complexity and risk | System |
| 15 | System recommends providers | System |
| 16 | System creates a scene roadmap | System |
| 17 | System compiles provider-specific prompts | System |
| 18 | User reviews and edits scenes | User |
| 19 | User copies or exports the plan | User |

After step 19, the user takes the exported prompts and instructions to the recommended external AI video provider. Prompt Pilot does not generate media.

---

## Creation wizard steps

The guided creation wizard contains nine steps:

| Step | Name | Collects |
|---|---|---|
| 1 | Source | Idea, script, URL, or template |
| 2 | Objective | Video goal and call to action |
| 3 | Publishing destination | Target platform (YouTube, TikTok, etc.) |
| 4 | Video category | One of 12 supported categories |
| 5 | Duration | Preset or custom duration |
| 6 | Visual style | Aesthetic direction |
| 7 | Production requirements | Characters, products, locations, constraints |
| 8 | Budget and priorities | Cost/quality trade-offs |
| 9 | Review | Final brief confirmation before generation |

Users may navigate back to earlier steps. Brief changes after plan generation may trigger controlled regeneration (post-MVP editing flows in Phase 14).

---

## Result workspace sections

After plan generation, the result workspace displays:

| Section | Content |
|---|---|
| Project diagnosis | Summary of source analysis and brief normalization |
| Complexity and risk | **Complexity Score** and **Production Risk Score** with factors |
| Provider recommendation | Primary provider with **Provider Fit Score** and explanation |
| Provider alternatives | Secondary options with comparative rationale |
| Story structure | Narrative arc and beat outline |
| Scene timeline | Ordered **Scenes** with durations |
| Prompt package | **Compiled Prompts** per scene |
| Continuity Bible | Character, product, world, and style locks |
| Voiceover and audio | Dialogue, VO script, music, and SFX guidance |
| Editing roadmap | **Generation Order** and assembly steps |
| Quality warnings | **Prompt Quality Audit** findings |
| Export controls | Copy and structured export actions |

---

## Interaction-state requirement

Every major action in the application must implement the following states:

```text
idle
validating
submitting
success
recoverable_error
blocked
```

| State | Meaning |
|---|---|
| `idle` | Ready for user input |
| `validating` | Client or server validation in progress |
| `submitting` | Request in flight |
| `success` | Action completed; result available |
| `recoverable_error` | Failure with retry or correction path |
| `blocked` | Action unavailable due to permissions, limits, or prerequisites |

### Rules

- No button may exist without an implemented action behind it.
- No action may show fake progress (e.g., simulated video rendering).
- Loading states must reflect real backend or computation work.
- Error states must provide a recoverable path where possible.

See [Product Contract](product-contract.md) for the principle of stable and testable interactions.
