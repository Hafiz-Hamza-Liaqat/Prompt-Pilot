# Complexity and Execution-Risk Scoring

## Purpose

Phase 10 adds transparent, deterministic planning assessments to the hybrid result workspace:

- **Production complexity** — how many structural and production demands are present in the saved brief
- **Execution risk** — how strongly the saved requirements introduce fidelity, coordination, or continuity challenges

Both scores are calculated on each workspace request from the completed video brief, the Phase 9 scene decomposition, and the shared production-requirement contract. Every positive factor contribution is returned with a label, points, rationale, and approved source fields.

Algorithm version: `complexity-risk-v1`
Origin: `deterministic_rule_engine`
Not AI-generated. Not persisted.

## Complexity formula

The complexity score is the sum of five categories with a designed maximum of **100 points**.

| Category | Maximum |
|---|---|
| Duration | 20 |
| Scene structure | 10 |
| Source type | 8 |
| Production requirements | 56 |
| User constraints | 6 |
| **Total** | **100** |

### Duration brackets (complexity)

| Duration (seconds) | Points |
|---|---|
| 5–20 | 0 |
| 21–40 | 5 |
| 41–60 | 9 |
| 61–90 | 13 |
| 91–120 | 17 |
| 121–180 | 20 |

### Scene-count brackets (complexity)

Uses the validated Phase 9 scene count (not recalculated independently).

| Scenes | Points |
|---|---|
| 2–3 | 0 |
| 4–6 | 3 |
| 7–9 | 6 |
| 10–12 | 10 |

### Source-type weights (complexity)

| Source type | Points |
|---|---|
| idea | 0 |
| script | 4 |
| product_url | 6 |
| article_url | 8 |

Input-structure demand only. URLs are not fetched or inspected.

### User-constraint brackets (complexity)

Uses normalized saved `userConstraints` character count.

| Length | Points |
|---|---|
| null or empty | 0 |
| 1–250 | 2 |
| 251–750 | 4 |
| 751–2000 | 6 |

Semantic meaning is not interpreted.

### Production-requirement weights (complexity)

| Requirement | Points |
|---|---|
| characterConsistency | 6 |
| productConsistency | 5 |
| logoAccuracy | 4 |
| exactTextVisibility | 5 |
| nativeAudio | 4 |
| dialogue | 4 |
| voiceover | 2 |
| lipSync | 6 |
| multipleLocations | 5 |
| cameraControl | 4 |
| firstLastFrameControl | 4 |
| videoExtension | 4 |
| referenceImages | 2 |
| commercialUse | 1 |

Total possible requirement contribution: **56**.

## Execution-risk formula

```
rawExecutionRiskScore =
  baseRequirementRisk
  + durationRisk
  + sceneDensityRisk
  + interactionRisk

executionRiskScore = Math.min(100, rawExecutionRiskScore)
```

Both `rawScore` and capped `score` are returned. `wasCapped` is true only when `rawScore > 100`. Factor contributions sum to `rawScore`, not the capped score.

### Base requirement weights (execution risk)

| Requirement | Points |
|---|---|
| characterConsistency | 5 |
| productConsistency | 5 |
| logoAccuracy | 5 |
| exactTextVisibility | 8 |
| nativeAudio | 3 |
| dialogue | 4 |
| voiceover | 1 |
| lipSync | 8 |
| multipleLocations | 4 |
| cameraControl | 3 |
| firstLastFrameControl | 4 |
| videoExtension | 6 |
| referenceImages | 2 |
| commercialUse | 2 |

Maximum base contribution: **60**.

### Duration brackets (execution risk)

| Duration (seconds) | Points |
|---|---|
| 5–40 | 0 |
| 41–60 | 3 |
| 61–90 | 6 |
| 91–120 | 8 |
| 121–180 | 10 |

### Scene-density brackets (execution risk)

| Scenes | Points |
|---|---|
| 2–6 | 0 |
| 7–9 | 3 |
| 10–12 | 5 |

### Interaction rules (execution risk)

All stated conditions must be true.

| Conditions | Points | Key |
|---|---|---|
| exactTextVisibility + logoAccuracy | 8 | exact_text_and_logo_fidelity |
| dialogue + lipSync | 10 | dialogue_lip_sync_coordination |
| characterConsistency + multipleLocations | 8 | character_across_locations |
| productConsistency + multipleLocations | 6 | product_across_locations |
| videoExtension + firstLastFrameControl | 6 | extension_frame_boundary_control |
| nativeAudio + dialogue | 4 | native_audio_dialogue_coordination |
| durationSeconds > 90 + multipleLocations | 6 | long_form_multi_location |
| sceneCount >= 10 + cameraControl | 4 | dense_scene_camera_control |

## Level thresholds

Both assessments use the same thresholds:

| Score range | Machine value | User label |
|---|---|---|
| 0–24 | low | Low |
| 25–49 | moderate | Moderate |
| 50–74 | high | High |
| 75–100 | very_high | Very high |

## Interpretation limits

- Scores are **not** probabilities, quality scores, or success predictions
- Scores do **not** select or rank providers
- Scoring does **not** read provider catalogue tables or capability facts
- Free-text constraints are not semantically analyzed
- Source URLs are not fetched
- Scores are **not** persisted — they are recalculated from saved inputs on each workspace request

## Workspace origins

| Section | Origin |
|---|---|
| Project and brief | persisted input |
| Provider catalogue | source-backed snapshot |
| Scene roadmap | deterministic rule engine |
| Complexity and risk | deterministic rule engine |
| Prompt preview | static fixture |
| Continuity preview | static fixture |
| Audio/editing preview | static fixture |

Machine section key remains `quality` for route compatibility. User-facing label: **Complexity and risk**.

## Deferred work

- Provider recommendation (Phase 11)
- Provider-specific suitability
- Cost modelling
- Creative scene descriptions
- Prompt compilation
- Quality evaluation
- AI planning
- Score persistence
- Export
