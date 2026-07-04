# Duration and Scene Decomposition

Phase 9 adds deterministic, duration-aware scene timing to the Prompt Pilot workspace. The feature calculates structural scene roles and whole-second boundaries from a completed brief's saved duration. It does not generate creative scene content, recommend providers, or persist output.

## Purpose

- Deterministic duration-based scene timing
- Exact whole-second allocation across scenes
- Structural scene roles and pacing emphasis labels
- Workspace integration as mixed-origin preview data
- No database persistence

## Algorithm

Scene count:

```text
sceneCount = clamp(round(duration / 10), 2, 12)
```

Valid brief durations remain **5 through 180 whole seconds**.

### Role sequence

| Scene count | Sequence |
|-------------|----------|
| 2 | opening_hook → closing_direction |
| 3 | opening_hook → core_message → closing_direction |
| 4 | opening_hook → context_setup → core_message → closing_direction |
| 5 | opening_hook → context_setup → core_message → proof_or_demonstration → closing_direction |
| 6+ | opening_hook → context_setup → development (repeated) → core_message → proof_or_demonstration → closing_direction |

Repeated `development` scenes receive deterministic ordinal labels such as **Message development 1**.

### Duration allocation

1. Allocate **1 second minimum** to every scene.
2. Distribute remaining seconds proportionally by fixed role weights.
3. Use **largest-remainder** rounding.
4. Resolve equal remainders by **scene order**.
5. Build contiguous boundaries starting at **0** with no gaps or overlaps.

Role weights:

| Role | Weight |
|------|--------|
| opening_hook | 1.00 |
| context_setup | 1.10 |
| core_message | 1.50 |
| development | 1.20 |
| proof_or_demonstration | 1.30 |
| closing_direction | 1.00 |

Invariants:

```text
sum(scene.durationSeconds) === totalDurationSeconds
sceneCount <= totalDurationSeconds
every scene.durationSeconds >= 1
first scene.startSecond === 0
last scene.endSecond === totalDurationSeconds
```

Algorithm metadata:

```text
algorithmVersion: duration-v1
origin: deterministic_rule_engine
isAiGenerated: false
isPersisted: false
```

## Truthfulness

- **Not AI-generated**
- **Not provider-specific**
- **Not a recommendation**
- **Not a final creative scene plan**
- **No creative scene descriptions**
- **No database persistence**

The workspace notice distinguishes deterministic scene timing from remaining static preview sections.

## Workspace origins

| Section | Origin |
|---------|--------|
| Project and brief | persisted input |
| Provider catalogue | source-backed snapshot |
| Scene roadmap | deterministic rule engine |
| Prompt, continuity, audio/editing, quality | static preview fixtures |

Top-level workspace mode:

```text
mode: hybrid_preview
dataOrigin: mixed
isDecisionReady: false
```

## Deferred work

- Complexity and risk scoring (Phase 10)
- Provider recommendations
- Creative scene descriptions
- Prompt compilation
- Continuity generation
- Audio/editing guidance
- Quality scoring
- Plan persistence
- Export

## Related docs

- [Mock / hybrid result workspace](./mock-result-workspace.md)
- [Guided creation wizard](./guided-creation-wizard.md)
- [Implementation checklist](./implementation-checklist.md)
