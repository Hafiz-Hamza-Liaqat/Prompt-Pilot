# PP-05A-5 — Security & RLS Strategy

**Related:** [Database and Auth Foundation](../database-auth-foundation.md) · [05a-4-ownership-model.md](05a-4-ownership-model.md)

Security architecture for pivot persistence. **No SQL policies.**

---

## 1. Security goals

| Goal | Mechanism |
|---|---|
| User data isolation | RLS on all pivot tables |
| No cross-tenant reads | `owner_id` / `project_id` predicates |
| No client secrets | Service role only for workers |
| Temp media protected | Storage RLS + opaque locators |
| Audit trail | Append-only jobs, usage, exports |

---

## 2. Workspace isolation

| Layer | Strategy |
|---|---|
| UI | Server components + server actions only for pivot writes |
| API | Auth session required; `requireUser()` before any repo call |
| DB | RLS: user can only SELECT/INSERT/UPDATE rows for owned projects |
| Workspace read | Composite query scoped by `projectId` + ownership check |

**No multi-tenant workspace sharing in MVP.**

---

## 3. User ownership (RLS pattern)

Conceptual policy template for pivot tables:

```text
USING ( project_id IN (
  SELECT id FROM projects
  WHERE owner_id = auth.uid()
    AND deleted_at IS NULL  -- if soft delete active
))
```

| Operation | MVP rule |
|---|---|
| SELECT | Owner only |
| INSERT | Owner only; must match owned project_id |
| UPDATE | Owner only; limited columns per entity lifecycle |
| DELETE | **Generally forbidden** — soft flags preferred |

Existing `projects` and `video_briefs` RLS patterns extend to new tables.

---

## 4. Shared resources

| Resource | Shared? | Rule |
|---|---|---|
| Provider catalogue | Yes (public read) | Existing catalogue RLS |
| ContentFingerprint (global) | **No** in MVP | Per-user scope |
| CacheEntry (global) | **No** in MVP | Per-user scope |
| Analysis snapshot (cross-project) | **No** | Via cache only within scope |
| Storage objects | No | Project-scoped paths |

Global cache requires: legal review + ADR + explicit RLS exception design.

---

## 5. Cache isolation

| Dimension | MVP |
|---|---|
| Key scope | `user_id` + `fingerprintId` + algorithm version |
| Read | Only scope owner |
| Write | System/worker on behalf of user after job |
| Invalidation | Owner-triggered re-analysis; admin bulk |

Prevents User A reading User B's cached analysis.

---

## 6. Service-role boundaries

| Actor | May access |
|---|---|
| **Authenticated user** | Own projects + pivot entities via RLS |
| **Server action (user JWT)** | Same as user |
| **Worker (service role)** | Insert/update jobs, analysis, packages for **claimed** job only; must validate job ownership before write |
| **Service role** | **Never** exposed to client |
| **Admin** | Separate audited support path — future |

Worker writes **must** include application-level ownership check even with service role — defense in depth.

---

## 7. Storage security (WorkspaceAsset)

| Rule | Detail |
|---|---|
| Bucket | Private; no public ACL |
| Path | `{projectId}/{referenceId}/{uuid}` |
| Client upload | Signed upload URL scoped to project + TTL |
| Read | Server-side only for Core Analysis |
| `storageLocator` | Internal string — never in API response (G-29) |

---

## 8. Admin boundaries

| Capability | MVP |
|---|---|
| View user analysis | **Denied** — support requires future admin ADR |
| Bulk cache invalidation | System job with service role + audit log |
| Credit adjustment | PP-18 |

---

## 9. Threat considerations

| Threat | Mitigation |
|---|---|
| IDOR on jobId/analysisId | RLS + server ownership check |
| SSRF via reference URL | Link Intelligence (PP-05) — not persistence |
| Prompt injection in transcript | Stored as untrusted; compilation guards (PP-12+) |
| Leak via export | Export scoped to owned packages only |

---

## Step 05A-5 acceptance

- [x] RLS strategy documented without SQL
- [x] Cache and service-role boundaries defined
- [x] Aligns with PP-04 governance G-24–G-29
