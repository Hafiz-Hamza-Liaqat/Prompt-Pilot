# Entity Relationship Model — PP-02 Step 4

**Type:** Conceptual relationships only — not tables, not SQL  
**Related:** [ReferenceVideoAnalysis spec](01-reference-video-analysis-specification.md) · [Package Engine](04-package-engine.md)

---

## 1. Primary hierarchy

```text
User (auth identity)
    │
    └── Profile
            │
            └── Workspace (UI scope — not a persisted aggregate root)
                    │
                    └── Project (container)
                            │
                            ├── Video Brief (optional user intent — legacy wizard)
                            │
                            └── Reference (intake artifact)
                                    │
                                    ├── Rights Attestation
                                    │
                                    ├── Content Fingerprint
                                    │
                                    ├── Job (async pipeline run)
                                    │       │
                                    │       ├── Job Events / Progress
                                    │       │
                                    │       └── Export (delivery action)
                                    │
                                    └── ReferenceVideoAnalysis (versioned snapshot)
                                            │
                                            └── Package Engine (generator — not an entity)
                                                    │
                    ┌───────────────────────────────┼───────────────────────────────┐
                    ▼                               ▼                               ▼
            Blueprint Package              Prompt Package                   SEO Package
                    │                               │                               │
                    ▼                               ▼                               ▼
            (storyboard,                  (compiled prompts,              (titles, tags,
             shot list,                     negatives, variants)            keywords…)
             camera notes)
                    │
                    ├──────────────────┬──────────────────┐
                    ▼                  ▼                  ▼
            Marketing Package   Repurposing Package   (future packages)
```

---

## 2. Entity definitions (relationship view)

| Entity | Relationship role |
|---|---|
| **User** | Owns projects via auth identity |
| **Profile** | 1:1 with user; display metadata |
| **Workspace** | View context over one project’s current intelligence state |
| **Project** | Root container for references, briefs, analyses, packages, job history |
| **Video Brief** | 0..1 active brief per project (legacy); informs packages and engines |
| **Reference** | 0..N per project; one intake artifact |
| **Rights Attestation** | 1..N per reference submission; timestamped consent |
| **Content Fingerprint** | 1 per distinct content identity; shared across projects if policy allows |
| **Job** | 0..N per reference; drives pipeline |
| **ReferenceVideoAnalysis** | 1..N versions per reference; immutable snapshots |
| **Package** | 0..N per analysis version per package type; immutable once published |
| **Export** | 0..N; serializes selected packages |

---

## 3. Cardinality rules

| From | To | Cardinality | Rule |
|---|---|---|---|
| Project | Reference | 1:N | Multiple references allowed over project lifetime |
| Reference | ReferenceVideoAnalysis | 1:N | Re-analysis creates new version |
| Reference | Job | 1:N | Retries and re-runs create new jobs |
| ReferenceVideoAnalysis | Package | 1:N | Each package type + version per analysis |
| Analysis version | Package versions | 1:N | Packages pin to exact `analysisId` + `analysisVersion` |
| Fingerprint | ReferenceVideoAnalysis | 1:N | Cache hit may reuse analysis across references if policy permits |
| Project | Video Brief | 1:0..1 | Brief optional in pivot MVP paths |
| Job | Export | 1:0..N | Export may occur after job completion |

---

## 4. Deterministic engines (read-only consumers)

These **existing subsystems** consume **Video Brief** and/or **ReferenceVideoAnalysis** but do not replace it:

```text
ReferenceVideoAnalysis ──┐
                         ├──► Scene Decomposition (when brief duration present)
Video Brief ─────────────┘
                         ├──► Complexity / Risk Assessment
                         └──► Provider Recommendation (catalogue evidence)
```

Outputs of these engines are **Workspace evaluations**, not ReferenceVideoAnalysis sections. Adapters may copy summary fields into Packages when needed.

---

## 5. Cache relationship

```text
Reference
    │
    ▼
Fingerprint
    │
    ├──► Cache Entry (optional)
    │         │
    │         └──► ReferenceVideoAnalysis (reuse by reference)
    │
    └──► Miss → Job → new ReferenceVideoAnalysis
```

See [05-content-fingerprint.md](05-content-fingerprint.md) and [08-cache-architecture.md](08-cache-architecture.md).

---

## 6. History relationship

```text
Project
    │
    └── Job History (ordered jobs)
            │
            └── each Job → Analysis version produced → Packages produced → Exports
```

Workspace displays **latest** by default; history view navigates prior versions.

---

## 7. What is NOT an entity

| Concept | Treatment |
|---|---|
| Package Engine | **Service** — generates Package instances |
| Core Analysis | **Pipeline stage** — produces ReferenceVideoAnalysis |
| AI Provider | **Boundary adapter** — not stored as domain root |
| Workspace sections | **UI modules** — bind to entities above |
| Production Plan | **Optional aggregate export** — not required entity for PP-02 |

---

## Step 4 acceptance

- [x] Conceptual ERM documented without SQL
- [x] Reference → Analysis → Package flow explicit
- [x] Legacy brief and engines positioned as parallel consumers
- [ ] Human approval
