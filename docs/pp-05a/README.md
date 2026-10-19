# PP-05A — Persistence Domain Design Index

**Phase:** PP-05A — Persistence Domain Design  
**Type:** Audit & design only — no implementation  
**Status:** Architecture foundation extension (PP-01–PP-04 **LOCKED**)  
**Prerequisites:** PP-01 · PP-02 · PP-03 · PP-04 (approved)

---

## Objective

Design how the approved runtime architecture maps to persistence — without SQL, migrations, repositories, or runtime code.

---

## Deliverables

| ID | Document | Topic |
|---|---|---|
| 05A-1 | [05a-1-domain-to-persistence-mapping.md](05a-1-domain-to-persistence-mapping.md) | Domain → persistence responsibilities |
| 05A-2 | [05a-2-entity-relationship-design.md](05a-2-entity-relationship-design.md) | Conceptual ERM (no tables) |
| 05A-3 | [05a-3-repository-design.md](05a-3-repository-design.md) | Repository responsibilities |
| 05A-4 | [05a-4-ownership-model.md](05a-4-ownership-model.md) | Ownership boundaries |
| 05A-5 | [05a-5-security-rls-strategy.md](05a-5-security-rls-strategy.md) | RLS & security architecture |
| 05A-6 | [05a-6-lifecycle-strategy.md](05a-6-lifecycle-strategy.md) | Entity lifecycles |
| 05A-7 | [05a-7-migration-strategy.md](05a-7-migration-strategy.md) | Migration sequence |
| 05A-8 | [05a-8-persistence-governance.md](05a-8-persistence-governance.md) | Persistence rules |
| 05A-9 | [05a-9-risks-technical-debt.md](05a-9-risks-technical-debt.md) | Risks & recommendations |
| 05A-10 | [05a-10-pp05b-readiness-review.md](05a-10-pp05b-readiness-review.md) | PP-05B gate verdict |

---

## Locked baseline rules

1. Do not silently redefine PP-02/PP-03 terminology.
2. Canonical contract changes require documented reason + ADR.
3. Runtime architecture changes require ADR (PP-04).
4. PP-05A adds **persistence design** only — extends PP-04D repository boundaries.

---

## Next phase

**PP-05B — Persistence Implementation** (schema inventory, DDL, RLS policies, repository interfaces) — requires PP-05A approval.

**PP-05 — Link Intelligence** may proceed in parallel after PP-05A approval (no DB dependency for URL validation).

---

## Acceptance

- [x] All deliverables 05A-1–05A-10 complete
- [x] No code, SQL, migrations, or runtime changes
- [ ] Human approval recorded
