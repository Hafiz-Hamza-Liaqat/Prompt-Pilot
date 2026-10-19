# PP-05A-4 — Ownership Model

**Related:** [PP-02 ERM](../pp-02/02-entity-relationship-model.md) · [05a-1-domain-to-persistence-mapping.md](05a-1-domain-to-persistence-mapping.md)

Ownership boundaries for persisted entities. Aligns with existing Supabase Auth + project owner RLS pattern.

---

## 1. Ownership chain

```text
auth.users (User)
    │
    └── profiles.id = auth.users.id
            │
            └── projects.owner_id → profiles.id
                    │
                    └── ALL pivot entities scoped by projectId (+ owner_id denormalized where needed for RLS)
```

**Rule:** Every pivot entity row must be reachable from `projects.owner_id = auth.uid()` for user-scoped RLS.

---

## 2. Entity ownership table

| Entity | Owner | Scope key | Inheritance |
|---|---|---|---|
| **Project** | User (`owner_id`) | `projectId` | Root container |
| **Video Brief** | Project owner | `project_id` | Deleted/archived with project policy |
| **Reference** | Project owner | `project_id` | Inherits project lifecycle |
| **ReferenceVideoAnalysis** | Project owner | `project_id` | Inherits project; immutable content |
| **Package** | Project owner | `project_id` | Inherits project |
| **PackageManifest** | Project owner | via package | Inherits package |
| **Job** | Project owner | `project_id` | Inherits project |
| **JobEvent** | Project owner | via job | Inherits job |
| **Export** | Project owner + actor | `project_id`, `created_by_user_id` | Inherits project |
| **RightsAttestation** | Project owner | via reference | Inherits reference |
| **WorkspaceAsset** | Project owner | `project_id` | TTL independent of project delete order |
| **ContentFingerprint** | **Scoped owner** | `scope_user_id` or `scope_project_id` | Per PP-02 per-user cache default |
| **CacheEntry** | Same as fingerprint scope | cache scope columns | Not global until policy change |
| **ProviderUsage** | User + project | `user_id`, `project_id` | User-level credit aggregation |
| **Workspace (UI)** | N/A | read via project | — |

---

## 3. Workspace ownership

| Aspect | Rule |
|---|---|
| Definition | UI presentation scope over a **Project** — not a separate owner |
| Access | Same as project access (owner only in MVP) |
| Shared workspace | **Out of scope** MVP — future team accounts need new ADR |
| Admin view | Service role bypass for support — audited |

---

## 4. Project ownership

| Rule | Detail |
|---|---|
| Creator | `owner_id` set at create — existing pattern |
| Transfer | **Deferred** — not in MVP |
| Archive | Existing soft archive — pivot entities remain readable |
| Delete | Soft delete project → pivot entities hidden; hard purge deferred job |

---

## 5. Reference ownership

| Rule | Detail |
|---|---|
| Belongs to exactly one Project | Required FK concept |
| Cross-project reuse | **Forbidden** — same URL in two projects = two Reference rows |
| Shared content | Via **CacheEntry** at fingerprint scope — not reference row sharing |

---

## 6. Package & export ownership

| Rule | Detail |
|---|---|
| Packages | Owned by project that owns source analysis |
| Export | Owned by project; records `createdByUserId` for audit |
| Cross-user export | **Forbidden** in MVP |
| Download URL | Short-lived signed URL — not ownership transfer |

---

## 7. Cache ownership

| Policy | PP-02 default |
|---|---|
| Scope | **Per-user** fingerprint + cache entries |
| Cross-user hit | **Disabled** until legal approval + ADR |
| Project delete | User-scoped cache survives project delete if other projects could reuse — **MVP: invalidate cache entries tied to deleted project references only** |
| Platform ownership | System stores rows; user retains access only within scope |

---

## 8. Analysis ownership

| Rule | Detail |
|---|---|
| Analysis rows | Owned by project |
| Cached analysis reuse | User may read analysis produced under their scope even if original project deleted — **product decision deferred**; MVP: deny read if project soft-deleted |
| Immutability | Ownership does not imply mutability |

---

## 9. Inheritance rules summary

| Parent event | Child behavior (MVP) |
|---|---|
| Project archived | Read-only all pivot entities |
| Project soft-deleted | Hide from UI; rows remain |
| Project hard-deleted (future) | Cascade purge pivot + assets per retention policy |
| Reference superseded | Old analysis versions remain addressable by ID |
| Job failed | Reference and partial artifacts remain |

---

## Step 05A-4 acceptance

- [x] Ownership documented per entity
- [x] Inheritance rules stated
- [x] Cache scope aligned with PP-02
