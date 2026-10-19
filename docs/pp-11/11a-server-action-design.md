# PP-11A — Server Action Design

**Status:** Supporting document for [11-workspace-ui-design-audit.md](11-workspace-ui-design-audit.md)  
**Scope:** Server action and trigger boundary specification — no runtime implementation

Actions follow the **`brief/actions.ts`** pattern: `'use server'`, `requireUserResult`, Zod validation, `revalidatePath`, typed form state.

**Planned location:** `src/app/projects/[projectId]/reference/actions.ts`  
**Form state:** `src/app/projects/[projectId]/reference/form-state.ts`

---

## Shared infrastructure

```typescript
async function getAuthenticatedPivotRegistry() {
  const auth = await requireUserResult();
  if (!auth.ok) return null;
  const supabase = await createSupabaseServerClient();
  const registry = createSupabasePivotRepositoryRegistry(supabase);
  return { user: auth.user, registry, supabase };
}
```

**Owner scope:** `{ ownerId: user.id, projectId }` for all pivot repository calls.

---

## 1. `recordAttestationAction`

### Purpose

Persist user rights attestation before reference submission.

### Repositories used

| Repository | Operation |
|------------|-----------|
| **`AttestationRepository`** (new) | `insert(scope, { attestationVersion })` |

**Planned interface:**

```typescript
interface AttestationRepository {
  insert(
    scope: OwnerScope,
    input: { attestationVersion: string },
    attestationId: EntityId,
  ): Promise<PersistenceResult<RightsAttestationRecord>>;
}
```

Maps to `rights_attestations` table (existing migration).

### Validation

```typescript
const attestationSchema = z.object({
  projectId: projectIdSchema,
  accepted: z.literal(true, { message: 'Attestation is required' }),
  attestationVersion: z.string().trim().min(1).max(32).default('1'),
});
```

### Orchestration trigger

**None.**

### Returned payload

```typescript
type AttestationActionState = {
  status: 'idle' | 'success' | 'error';
  attestationId?: EntityId;
  fieldErrors?: Record<string, string>;
  message?: string;
};
```

### Revalidation

`revalidatePath(/projects/${projectId})`

---

## 2. `createReferenceAction`

### Purpose

Create pivot `Reference` row after attestation exists.

### Repositories used

| Repository | Operation |
|------------|-----------|
| `ReferenceRepository` | `insert(scope, CreateReferenceInput, referenceId)` |

### Validation (by kind)

**Base schema:**

```typescript
const baseReferenceSchema = z.object({
  projectId: projectIdSchema,
  referenceKind: z.enum(REFERENCE_KINDS),
  rightsAttestationId: z.string().uuid(),
  accessStatus: z.enum(ACCESS_STATUSES).default('public'),
});
```

**Kind extensions:**

| Kind | Additional fields |
|------|-------------------|
| `youtube_url` | `canonicalUrl` (HTTPS, normalized) |
| `video_upload` / `audio_upload` | `uploadSessionId` (completed session) |
| `transcript` | `transcriptText` (held for trigger — **not** in `CreateReferenceInput`) |
| `script` | `scriptText` (held for trigger — **not** in `CreateReferenceInput`) |

Text fields validated in action but passed to trigger via session/cache or combined `startAnalysisJobAction` payload — **not** persisted on Reference.

### `CreateReferenceInput` mapping

| Field | Source |
|-------|--------|
| `referenceKind` | Form |
| `canonicalUrl`, `platform`, `platformContentId`, `title` | URL normalization / link prep |
| `accessStatus` | Form or default |
| `rightsAttestationId` | Prior attestation action |

### Orchestration trigger

**None** — reference create is separate from job start (allows review step) OR combined in single UX with two-phase action — **implementation choice:** default **separate** actions for clearer error handling.

### Returned payload

```typescript
type ReferenceActionState = {
  status: 'idle' | 'success' | 'error';
  referenceId?: EntityId;
  fieldErrors?: Record<string, string>;
  message?: string;
  // Ephemeral handoff for trigger (transcript/script/youtube prep)
  intakeHandoff?: Partial<ReferenceIntakeView>;
};
```

---

## 3. `startAnalysisJobAction`

### Purpose

Create job and run mock pipeline synchronously for E2E acceptance.

### Repositories used

| Repository | Operation |
|------------|-----------|
| `JobRepository` | `create(scope, { referenceId }, jobId)` |
| `ReferenceRepository` | `getById` (verify ownership) |
| `AnalysisRepository` | Read after run (verify outcome) — via trigger service |

### Validation

```typescript
const startJobSchema = z.object({
  projectId: projectIdSchema,
  referenceId: z.string().uuid(),
  referenceKind: z.enum(REFERENCE_KINDS),
  intakeOverride: z.custom<Partial<ReferenceIntakeView>>().optional(),
});
```

**Preconditions:**

- Reference exists and belongs to scope
- `rightsAttestationId` present on reference
- No conflicting active job (optional guard — return conflict error)

### Orchestration trigger

**Yes — core of this action.**

```typescript
const trigger = createPipelineTriggerService({
  orchestrator: createDefaultJobOrchestrator({ lifecycle, … }),
  linkStack: createLinkIntelligenceStack(…),
  cacheStack: createCacheStack(…),
  analysisStack: createAnalysisStack({ analysisRepository, cacheRepository, resolvePortInput }),
  // fingerprint test double injection for mock E2E
});

const outcome = await trigger.runReferenceAnalysis({
  scope,
  referenceId,
  referenceKind,
  intakeOverride,
  occurredAt: new Date().toISOString(),
});
```

**Trigger executes stage runners** — does not modify PP-10 modules.

### Returned payload

```typescript
type StartJobActionState = {
  status: 'idle' | 'success' | 'error';
  jobId?: EntityId;
  analysisId?: EntityId;
  terminalState?: JobState;
  failure?: JobFailure;
  message?: string;
};
```

### Revalidation

```typescript
revalidatePath(`/projects/${projectId}`);
revalidatePath(`/projects/${projectId}/workspace`);
```

---

## 4. `getJobStatusAction`

### Purpose

Poll active job for project page status panel.

### Repositories used

| Repository | Operation |
|------------|-----------|
| `JobRepository` | `getActiveByProject(scope)` |

Optional: `getById` if `jobId` provided.

### Validation

```typescript
const jobStatusSchema = z.object({
  projectId: projectIdSchema,
});
```

### Orchestration trigger

**None** — read only.

### Returned payload

```typescript
type JobStatusPayload = {
  ok: true;
  job: JobRecord | null;
  reference: Reference | null; // optional via bundle
} | {
  ok: false;
  code: 'not_authenticated' | 'not_found' | 'persistence_error';
};
```

Safe for client polling — no internal storage locators or provider details.

---

## Pipeline trigger service (server module — not a server action)

**Location:** `src/server/workspace/pipeline-trigger-service.ts`

| Method | Responsibility |
|--------|----------------|
| `runReferenceAnalysis(input)` | Full mock pipeline for one reference |
| `runStage(context, stageId, …)` | Delegate to existing stage runners |

**Ownership boundaries:**

| Module | Writes analysis? | Starts orchestrator? |
|--------|------------------|----------------------|
| Server actions | No direct analysis write | `startAnalysisJobAction` only |
| Trigger service | No — delegates to PP-10 coordinator | Yes |
| PP-10 coordinator | Yes | No |

---

## Security

- All actions call `requireUserResult`
- Repository layer enforces owner scope (RLS + adapter checks)
- No analysis or provider endpoints exposed to client
- Upload routes use existing `resolveUploadScope` pattern

---

## Error mapping

| Layer | Action behavior |
|-------|-----------------|
| Zod validation | `fieldErrors` on form state |
| Persistence `scope_violation` | User-safe generic error |
| Job `failure` on trigger | Return `failure` object — do not remap codes |
| Orchestration validation | Map to form/action message |

---

## Consistency affirmation

- [x] Analysis persistence only via PP-10 coordinator inside trigger
- [x] Composer not invoked from actions
- [x] Attestation write isolated to new repository
- [x] `intakeOverride` handoff documented for text kinds
