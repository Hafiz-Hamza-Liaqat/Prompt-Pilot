# Provider Recommendation Engine

## Purpose

Phase 11 adds a deterministic, evidence-backed provider recommendation engine to the hybrid result workspace. The engine evaluates individual catalogue offerings against the completed brief, deduplicates to one primary candidate per provider, ranks eligible providers, and identifies specialized supporting services.

Algorithm version: `provider-recommendation-v1`
Origin: `deterministic_evidence_engine`
Not AI-generated. Not persisted. No runtime provider research.

## Eligibility

A provider and offering are normally eligible when:

- `recommendationEligible === true` on both provider and offering
- Lifecycle is not `sunsetting`, `deprecated`, or `unavailable`
- API access is not `sunsetting` or `unavailable`

Preview, limited, and enterprise access may remain eligible with visible cautions. Sora exclusion is derived from stored catalogue lifecycle and eligibility fields, not hard-coded provider-name logic.

## Requirement mapping

Always-created needs:

| Need | Capability | Importance | Weight |
|---|---|---|---|
| Primary text-to-video | `text_to_video` | critical | 20 |
| Requested aspect ratio | `supported_aspect_ratios` | required | 10 |
| Maximum scene duration | `max_duration_seconds` | required | 10 |

Fourteen production-requirement keys map to catalogue capabilities when enabled in the brief. `firstLastFrameControl` splits into separate first-frame and last-frame needs.

## Scores

**Evidence-backed fit** = `floor(evidenceBackedPoints / totalRequestedWeight × 100)`

**Evidence coverage** = `floor(knownEvidenceWeight / totalRequestedWeight × 100)`

Support points:

| Support level | Points |
|---|---|
| supported | 100% of need weight |
| limited | floor(60% of need weight) |
| unsupported | 0 |
| unknown | 0 evidence-backed points (tracked separately) |

Scores display as `72 / 100`, not percentages. They are not probabilities or quality scores.

## Ranking order

1. Evidence-backed fit descending
2. Evidence coverage descending
3. Unsupported need count ascending
4. Limited need count ascending
5. Freshness: fresh → due soon → overdue
6. Provider display name ascending
7. Offering key ascending

## Decision logic

| Status | Condition |
|---|---|
| `recommended` | Top candidate meets fit ≥ 60, coverage ≥ 60, no unsupported needs, no critical blockers, and fit lead ≥ 5 over second (or no second) |
| `close_alternatives` | Top two within five fit points |
| `insufficient_evidence` | No candidate meets minimum thresholds |
| `no_eligible_candidate` | No eligible primary offerings |

No winner is forced.

## Supporting services

Specialized offerings may appear when enabled requirements include native audio, dialogue, voiceover, lip sync, video extension, first/last frame control, or reference images, and catalogue evidence is supported or limited. Supporting services do not affect primary ranking.

## Sources and freshness

Only saved Phase 7 official HTTPS sources are used. No runtime fetching. Unknown capability evidence is an evidence gap, not unsupported capability. Overdue catalogue review dates produce visible warnings without rewriting support levels.

## Limitations

- Prompt Pilot has not tested providers
- Recommendations do not guarantee generation quality
- No live pricing or account-access verification
- No provider API calls
- Recommendations are not persisted
- Catalogue data can become stale

## Workspace integration

The `providers` workspace section (label: **Provider recommendations**) uses origin `deterministic_evidence_engine`.

## Deferred work

- Cost modelling
- Account-specific availability
- Provider credentials
- Prompt compilation
- Provider execution
- Recommendation persistence
- Automated catalogue refresh
- Admin editing
- Export
