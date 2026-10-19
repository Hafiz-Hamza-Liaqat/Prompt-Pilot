# PP-05A-10 — PP-05B Readiness Review

**Phase gate:** PP-05A completion before PP-05B (Persistence Implementation)  
**Related:** [PP-05A index](README.md)

---

## 1. Domain mapping completeness

| Criterion | Status |
|---|---|
| Reference | Mapped |
| ReferenceVideoAnalysis | Mapped |
| Package + PackageManifest | Mapped |
| Job + JobEvent | Mapped |
| Export | Mapped |
| ContentFingerprint + CacheEntry | Mapped |
| ProviderUsage | Mapped |
| WorkspaceAsset | Mapped |
| RightsAttestation | Mapped |
| Legacy entities unchanged | Documented |

**Complete.**

---

## 2. Repository responsibilities

| Criterion | Status |
|---|---|
| All PP-04 repos extended | Yes |
| New repos defined | JobEvent, WorkspaceAsset, ProviderUsage, PackageManifest |
| Transaction boundaries | Documented |
| Forbidden duties | Documented (P-01–P-07) |

**Complete.**

---

## 3. Ownership strategy

| Criterion | Status |
|---|---|
| Project-scoped pivot entities | Yes |
| Per-user cache/fingerprint scope | Yes (PP-02 default) |
| Inheritance rules | Yes |
| Export actor audit | Yes |

**Complete.**

---

## 4. Security strategy

| Criterion | Status |
|---|---|
| RLS pattern conceptualized | Yes |
| Service role boundaries | Yes |
| Storage isolation | Yes |
| Cache isolation | Yes |
| No SQL policies (deferred PP-05B) | Correct |

**Complete.**

---

## 5. Lifecycle strategy

| Criterion | Status |
|---|---|
| All entities covered | Yes |
| Immutability rules | Yes |
| TTL for assets and cache | Yes |
| Job retention | Documented |

**Complete.**

---

## 6. Migration readiness

| Criterion | Status |
|---|---|
| Phases A–E aligned with PP-02 | Yes |
| applicationSchemaInventory plan | Yes |
| Rollback matrix | Yes |
| Ordering vs PP-07/09/10 | Yes |

**Ready for PP-05B DDL planning.**

---

## 7. Remaining open questions

| # | Question | Owner | Blocking PP-05B? |
|---|---|---|---|
| Q1 | PackageManifest: separate table vs JSON column? | Engineering | No — either works MVP |
| Q2 | CacheEntry merged with analysis FK only? | Engineering | No |
| Q3 | Job retention hard delete window (90d?) | Product | No |
| Q4 | Global cache scope approval | Legal/Product | Yes for global only |
| Q5 | Max analysis JSON size before split | Engineering | No — monitor |

---

## 8. Deferred decisions

| Topic | Phase |
|---|---|
| Physical table/column names | PP-05B |
| Indexes and constraints | PP-05B |
| RLS policy SQL | PP-05B |
| Repository TypeScript interfaces | PP-05B |
| Supabase Storage bucket config | PP-06 |
| Credit enforcement on ProviderUsage | PP-18 |
| Partition strategy | Post-MVP |

---

## 9. PP-05 (Link Intelligence) parallel track

PP-05 URL validation **does not require** pivot tables. May start after PP-05A approval in parallel with PP-05B.

---

## 10. Gate verdict

### **GO WITH CONDITIONS**

**Rationale for GO:**

- Domain-to-persistence mapping covers all approved concepts plus audit entities (JobEvent, PackageManifest, ProviderUsage, WorkspaceAsset).
- Repository design extends PP-04 without contradiction.
- Ownership, security, lifecycle, and migration align with locked PP-01–PP-04 baseline.
- Risks documented with actionable PP-05B/07/08 recommendations.

**Conditions before PP-05B:**

1. Human sign-off on PP-05A deliverables (this review).
2. PP-05B first PR must update `applicationSchemaInventory.ts` with approved entity list **before** applying migrations.
3. PP-05B must produce ADR for physical schema choices (PackageManifest shape, cache table structure).
4. Commit PP-01–PP-05A documentation baseline when approved.

**Rationale not NO-GO:**

No architectural conflicts found; persistence design is implementation-ready at conceptual level.

**Rationale not unconditional GO:**

Physical DDL choices and Q4 global cache remain open; PP-05B must resolve Q1–Q3 in schema design doc.

---

## Acceptance checklist

- [x] No production code written
- [x] No SQL created
- [x] No migrations created
- [x] No repositories implemented
- [x] No runtime behavior added
- [x] No services / API / frontend changes
- [x] Consistent with PP-01–PP-04
- [x] Repository buildable (docs only)
- [ ] Human approval recorded
