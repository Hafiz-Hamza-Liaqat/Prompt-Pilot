# Roadmap Dependency Review — PP-02 Step 12

**Related:** [Master roadmap](../prompt-pilot-roadmap.md) · [PP-02 index](README.md)

PP-02 artifacts are **mandatory prerequisites** for all implementation phases PP-03 onward. Future phases must not redefine foundational concepts.

---

## 1. PP-02 artifact checklist

| Artifact | Document | Approval required |
|---|---|---|
| Canonical domain language | [01-reference-video-analysis-specification.md](01-reference-video-analysis-specification.md) Part A | Yes |
| ReferenceVideoAnalysis object | [01-reference-video-analysis-specification.md](01-reference-video-analysis-specification.md) Part B | Yes |
| Entity relationships | [02-entity-relationship-model.md](02-entity-relationship-model.md) | Yes |
| Package contract | [04-package-engine.md](04-package-engine.md) | Yes |
| Content Fingerprint | [05-content-fingerprint.md](05-content-fingerprint.md) | Yes |
| Job state machine | [06-job-state-machine.md](06-job-state-machine.md) | Yes |
| AI pipeline | [07-ai-pipeline.md](07-ai-pipeline.md) | Yes |
| Cache architecture | [08-cache-architecture.md](08-cache-architecture.md) | Yes |
| Adapter strategy | [09-adapter-strategy.md](09-adapter-strategy.md) | Yes |
| Migration strategy | [10-migration-strategy.md](10-migration-strategy.md) | Yes |

---

## 2. Forward phase dependencies (PP-03+)

Renumbering aligns master roadmap **Phase 2** with **PP-02** completion, **Phase 3** with first implementation tranche.

| Phase | Title (updated) | Requires PP-02 artifacts |
|---|---|---|
| **PP-01 / Phase 1** | Product Pivot Foundation | — |
| **PP-02 / Phase 2** | Domain Architecture | All PP-02 docs |
| **PP-03 / Phase 3** | Zod Contracts & Glossary Update | Canonical Analysis approved · Package contract approved · Job lifecycle approved |
| **PP-04 / Phase 4** | Persistence Design & Schema Inventory | ERM approved · Migration strategy approved |
| **PP-05 / Phase 5** | Link Intelligence & URL Safety | Pipeline Validation stage approved · Fingerprint inputs for URL |
| **PP-06 / Phase 6** | Upload Engine & Storage | Pipeline Media Intake approved |
| **PP-07 / Phase 7** | Job Orchestration | Job state machine approved · AI pipeline approved |
| **PP-08 / Phase 8** | Cache Layer | Cache architecture approved · Fingerprint approved |
| **PP-09 / Phase 9** | Core Analysis (Mock) | ReferenceVideoAnalysis spec approved |
| **PP-10 / Phase 10** | Analysis UI & Workspace | ERM · Adapter strategy approved |
| **PP-11 / Phase 11** | Real Analysis Provider | Pipeline Core Analysis boundary approved |
| **PP-12 / Phase 12** | Package Engine (Mock) | Package contract · Adapter strategy approved |
| **PP-13 / Phase 13** | Prompt Studio UI | Prompt Package type approved |
| **PP-14 / Phase 14** | Real Compilation Provider | Package Engine approved |
| **PP-15 / Phase 15** | Marketing Module | Marketing Package type approved |
| **PP-16 / Phase 16** | SEO Module | SEO Package type approved |
| **PP-17 / Phase 17** | Repurposing Module | Repurposing Package type approved |
| **PP-18 / Phase 18** | Credits & Cost | Pipeline history · job metrics |
| **PP-19 / Phase 19** | BYOK & Feature Flags | — |
| **PP-20 / Phase 20** | Acceptance & Deploy | All above per MVP scope |

---

## 3. Dependency graph (critical path)

```text
PP-02 (Domain Architecture) ── GATE ──► PP-03 (Contracts)
                                              │
                                              ▼
                                         PP-04 (Persistence design)
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
                    PP-05 (Links)       PP-06 (Upload)      PP-07 (Jobs)
                         │                    │                    │
                         └────────────────────┼────────────────────┘
                                              ▼
                                         PP-08 (Cache)
                                              │
                                              ▼
                                         PP-09 (Mock Analysis)
                                              │
                                              ▼
                                         PP-10 (Analysis UI)
                                              │
                         ┌────────────────────┴────────────────────┐
                         ▼                                         ▼
                    PP-11 (Real AI)                          PP-12 (Mock Packages)
                         │                                         │
                         └────────────────────┬────────────────────┘
                                              ▼
                                    PP-13+ (Features, credits, deploy)
```

---

## 4. Rules for future phase authors

1. **Do not** introduce new names for Reference, Analysis, Package, Job, Fingerprint without glossary amendment.
2. **Do not** implement Package generators that read raw media.
3. **Do not** skip Job state machine states in UI without documenting equivalent.
4. **Do not** persist analysis inside `video_briefs` without migration strategy exception approved.
5. **Do** reference PP-02 document section IDs in phase design docs.

---

## Step 12 acceptance

- [x] PP-03+ dependencies mapped to PP-02 artifacts
- [x] Critical path documented
- [x] Master roadmap updated (see `prompt-pilot-roadmap.md`)
- [ ] Human approval
