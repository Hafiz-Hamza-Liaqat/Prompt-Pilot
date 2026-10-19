import { describe, expect, it } from 'vitest';
import type { Reference } from '@/domain/canonical';
import type { JobRecord } from '@/domain/canonical/job';
import type { EntityId } from '@/domain/canonical/primitives';
import { createDefaultJobLifecycleService } from '@/server/job';
import { createDefaultJobOrchestrator } from '@/server/orchestration';
import type { JobOrchestrator } from '@/server/orchestration';
import { createAnalysisStack } from '@/server/analysis/analysis-factory';
import { createCacheStack } from '@/server/cache/cache-factory';
import { createLinkIntelligenceStack } from '@/server/link/link-intelligence-factory';
import type {
  CreateJobInput,
  CursorPage,
  CursorPageRequest,
  JobEventRecord,
  JobStateTransitionInput,
  OwnerScope,
  PersistenceResult,
} from '@/server/persistence/contracts';
import type { JobRepository } from '@/server/persistence/repositories/job-repository';
import type { ReferenceRepository } from '@/server/persistence/repositories/reference-repository';
import {
  InMemoryAnalysisRepository,
  InMemoryCacheRepository,
  TEST_FINGERPRINT,
  TEST_SCOPE,
  TEST_TIMESTAMP,
} from '../cache/test-doubles.js';
import { createPipelineTriggerService } from '@/server/workspace/pipeline-trigger-service';
import type { ReferenceIntakePayloadRecord } from '@/server/persistence/contracts';
import type { CreateReferenceIntakePayloadInput } from '@/server/persistence/contracts';
import type { ReferenceIntakePayloadRepository } from '@/server/persistence/repositories/reference-intake-payload-repository';

const REFERENCE_ID = '44444444-4444-4444-4444-444444444444' as EntityId;
const ATTESTATION_ID = '55555555-5555-5555-5555-555555555555' as EntityId;
const VALID_TRANSCRIPT =
  'This transcript is long enough for intake validation and mock analysis execution in tests.';

class InMemoryReferenceIntakePayloadRepository implements ReferenceIntakePayloadRepository {
  readonly rows = new Map<string, ReferenceIntakePayloadRecord>();

  async insert(
    scope: OwnerScope,
    input: CreateReferenceIntakePayloadInput,
  ): Promise<PersistenceResult<ReferenceIntakePayloadRecord>> {
    const record: ReferenceIntakePayloadRecord = {
      referenceId: input.referenceId,
      projectId: scope.projectId,
      ownerId: scope.ownerId,
      payloadKind: input.payloadKind,
      bodyText: input.bodyText,
      createdAt: TEST_TIMESTAMP,
    };
    this.rows.set(input.referenceId, record);
    return { ok: true, data: record };
  }

  async getByReferenceId(
    scope: OwnerScope,
    referenceId: EntityId,
  ): Promise<PersistenceResult<ReferenceIntakePayloadRecord | null>> {
    const record = this.rows.get(referenceId);
    if (!record) {
      return { ok: true, data: null };
    }
    if (record.projectId !== scope.projectId || record.ownerId !== scope.ownerId) {
      return { ok: true, data: null };
    }
    return { ok: true, data: record };
  }
}

class InMemoryReferenceRepository implements ReferenceRepository {
  constructor(private readonly records: Map<string, Reference>) {}

  async insert(): Promise<PersistenceResult<Reference>> {
    throw new Error('not implemented');
  }

  async getById(scope: OwnerScope, referenceId: EntityId): Promise<PersistenceResult<Reference>> {
    const record = this.records.get(referenceId);
    if (!record || record.projectId !== scope.projectId) {
      return { ok: false, code: 'not_found' };
    }
    return { ok: true, data: record };
  }

  async listByProject(): Promise<PersistenceResult<never>> {
    throw new Error('not implemented');
  }

  async getLatestByProject(): Promise<PersistenceResult<null>> {
    return { ok: true, data: null };
  }

  async updateMetadata(): Promise<PersistenceResult<never>> {
    throw new Error('not implemented');
  }
}

class InMemoryJobRepository implements JobRepository {
  readonly jobs = new Map<string, JobRecord>();

  async create(
    scope: OwnerScope,
    input: CreateJobInput,
    jobId: EntityId,
  ): Promise<PersistenceResult<JobRecord>> {
    const now = TEST_TIMESTAMP;
    const record: JobRecord = {
      jobId,
      projectId: scope.projectId,
      referenceId: input.referenceId,
      state: 'created',
      progressPercent: 0,
      retryOfJobId: input.retryOfJobId,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(jobId, record);
    return { ok: true, data: record };
  }

  async getById(scope: OwnerScope, jobId: EntityId): Promise<PersistenceResult<JobRecord>> {
    const record = this.jobs.get(jobId);
    if (!record || record.projectId !== scope.projectId) {
      return { ok: false, code: 'not_found' };
    }
    return { ok: true, data: record };
  }

  async transitionState(
    scope: OwnerScope,
    input: JobStateTransitionInput,
  ): Promise<PersistenceResult<JobRecord>> {
    const existing = this.jobs.get(input.jobId);
    if (!existing || existing.projectId !== scope.projectId || existing.state !== input.expectedState) {
      return { ok: false, code: 'conflict' };
    }

    const updated: JobRecord = {
      ...existing,
      state: input.nextState,
      progressPercent: input.progressPercent,
      failure: input.failure,
      completedAt: input.completedAt,
      cacheHit: input.cacheHit,
      updatedAt: TEST_TIMESTAMP,
    };
    this.jobs.set(input.jobId, updated);
    return { ok: true, data: updated };
  }

  async appendEvent(): Promise<PersistenceResult<JobEventRecord>> {
    throw new Error('not implemented');
  }

  async listByReference(
    scope: OwnerScope,
    referenceId: EntityId,
    request: CursorPageRequest,
  ): Promise<PersistenceResult<CursorPage<JobRecord>>> {
    const items = [...this.jobs.values()]
      .filter((job) => job.referenceId === referenceId && job.projectId === scope.projectId)
      .slice(0, request.limit);
    return { ok: true, data: { items, nextCursor: null, hasMore: false } };
  }

  async getActiveByProject(): Promise<PersistenceResult<JobRecord | null>> {
    return { ok: true, data: null };
  }
}

function seedTranscriptReference(): {
  referenceRepository: InMemoryReferenceRepository;
  payloadRepository: InMemoryReferenceIntakePayloadRepository;
} {
  const reference: Reference = {
    referenceId: REFERENCE_ID,
    projectId: TEST_SCOPE.projectId,
    referenceKind: 'transcript',
    accessStatus: 'public',
    submittedAt: TEST_TIMESTAMP,
    rightsAttestationId: ATTESTATION_ID,
  };
  const referenceRepository = new InMemoryReferenceRepository(new Map([[REFERENCE_ID, reference]]));
  const payloadRepository = new InMemoryReferenceIntakePayloadRepository();

  void payloadRepository.insert(TEST_SCOPE, {
    referenceId: REFERENCE_ID,
    payloadKind: 'transcript',
    bodyText: VALID_TRANSCRIPT,
  });

  return { referenceRepository, payloadRepository };
}

function createTriggerHarness(options?: {
  referenceRepository?: InMemoryReferenceRepository;
  payloadRepository?: InMemoryReferenceIntakePayloadRepository;
  jobRepository?: InMemoryJobRepository;
  analysisId?: EntityId;
  orchestrator?: JobOrchestrator;
}) {
  const analysisRepository = new InMemoryAnalysisRepository();
  const cacheRepository = new InMemoryCacheRepository();
  cacheRepository.setFingerprintVersion(
    TEST_FINGERPRINT.fingerprintId,
    TEST_FINGERPRINT.fingerprintAlgorithmVersion,
  );
  const analysisStack = createAnalysisStack({
    analysisRepository,
    cacheRepository,
    resolvePortInput: () => ({
      referenceKind: 'transcript',
      fingerprintId: TEST_FINGERPRINT.fingerprintId,
      fingerprintAlgorithmVersion: TEST_FINGERPRINT.fingerprintAlgorithmVersion,
      intake: {},
    }),
    idGenerator: () => options?.analysisId ?? ('analysis-trigger-001' as EntityId),
  });
  const cacheStack = createCacheStack({ analysisRepository, cacheRepository });

  const seeded = seedTranscriptReference();
  const jobRepository = options?.jobRepository ?? new InMemoryJobRepository();
  const orchestrator =
    options?.orchestrator ??
    createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });

  return {
    trigger: createPipelineTriggerService({
      orchestrator,
      jobRepository,
      referenceRepository: options?.referenceRepository ?? seeded.referenceRepository,
      referenceIntakePayloadRepository: options?.payloadRepository ?? seeded.payloadRepository,
      linkCoordinator: createLinkIntelligenceStack(),
      cacheCoordinator: cacheStack.coordinator,
      analysisCoordinator: analysisStack.coordinator,
      idGenerator: () => 'job-trigger-001' as EntityId,
      fingerprintStub: TEST_FINGERPRINT,
    }),
    analysisRepository,
    cacheRepository,
    jobRepository,
  };
}

describe('pipeline trigger service', () => {
  it('runs transcript reference analysis end-to-end with persisted job and analysis rows', async () => {
    const analysisId = 'analysis-trigger-transcript-001' as EntityId;
    const { trigger, analysisRepository, jobRepository } = createTriggerHarness({ analysisId });

    const result = await trigger.runReferenceAnalysis({
      scope: TEST_SCOPE,
      referenceId: REFERENCE_ID,
      referenceKind: 'transcript',
      occurredAt: TEST_TIMESTAMP,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.terminalState).toBe('completed');
    expect(result.analysisId).toBe(analysisId);

    const storedJob = jobRepository.jobs.get('job-trigger-001');
    expect(storedJob?.state).toBe('completed');
    expect(storedJob?.progressPercent).toBe(100);

    const storedAnalysis = analysisRepository.getStored(TEST_SCOPE, analysisId);
    expect(storedAnalysis?.referenceId).toBe(REFERENCE_ID);
    expect(storedAnalysis?.metadata.referenceKind).toBe('transcript');
  });

  it('rejects duplicate active jobs for the same reference', async () => {
    const jobRepository = new InMemoryJobRepository();
    await jobRepository.create(TEST_SCOPE, { referenceId: REFERENCE_ID }, 'job-existing-001' as EntityId);
    await jobRepository.transitionState(TEST_SCOPE, {
      jobId: 'job-existing-001' as EntityId,
      expectedState: 'created',
      nextState: 'validated',
      progressPercent: 5,
    });

    const { trigger } = createTriggerHarness({ jobRepository });

    const result = await trigger.runReferenceAnalysis({
      scope: TEST_SCOPE,
      referenceId: REFERENCE_ID,
      referenceKind: 'transcript',
      occurredAt: TEST_TIMESTAMP,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.code).toBe('conflict');
  });

  it('fails validation when durable transcript payload is missing', async () => {
    const reference: Reference = {
      referenceId: REFERENCE_ID,
      projectId: TEST_SCOPE.projectId,
      referenceKind: 'transcript',
      accessStatus: 'public',
      submittedAt: TEST_TIMESTAMP,
      rightsAttestationId: ATTESTATION_ID,
    };
    const { trigger } = createTriggerHarness({
      referenceRepository: new InMemoryReferenceRepository(new Map([[REFERENCE_ID, reference]])),
      payloadRepository: new InMemoryReferenceIntakePayloadRepository(),
    });

    const result = await trigger.runReferenceAnalysis({
      scope: TEST_SCOPE,
      referenceId: REFERENCE_ID,
      referenceKind: 'transcript',
      occurredAt: TEST_TIMESTAMP,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.code).toBe('validation_error');
  });

  it('persists terminal failure when a stage aborts and allows a subsequent run', async () => {
    const inner = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const failingOrchestrator: JobOrchestrator = {
      start: (request) => inner.start(request),
      completeStage(context, completion) {
        if (completion.stageId === 'fingerprint') {
          return {
            ok: false,
            error: {
              code: 'lifecycle_rejected',
              message: 'Injected fingerprint stage failure',
              stageId: 'fingerprint',
            },
          };
        }
        return inner.completeStage(context, completion);
      },
      cancel: (request) => inner.cancel(request),
      planRetry: (request) => inner.planRetry(request),
      planResume: (request) => inner.planResume(request),
      propagateFailure: (request) => inner.propagateFailure(request),
      getNextStage: (context) => inner.getNextStage(context),
      applyJobTransitions: (context, transitions) => inner.applyJobTransitions(context, transitions),
      refineJobProgress: (context, request) => inner.refineJobProgress(context, request),
    };

    const jobRepository = new InMemoryJobRepository();
    const { trigger } = createTriggerHarness({ jobRepository, orchestrator: failingOrchestrator });

    const failedRun = await trigger.runReferenceAnalysis({
      scope: TEST_SCOPE,
      referenceId: REFERENCE_ID,
      referenceKind: 'transcript',
      occurredAt: TEST_TIMESTAMP,
    });

    expect(failedRun.ok).toBe(false);
    if (failedRun.ok) {
      return;
    }

    expect(failedRun.failure?.code).toBe('analysis_failed');
    expect(failedRun.failure?.message).toContain('Injected fingerprint stage failure');

    const storedJob = jobRepository.jobs.get('job-trigger-001');
    expect(storedJob?.state).toBe('failed');
    expect(storedJob?.failure?.code).toBe('analysis_failed');

    const { trigger: successTrigger } = createTriggerHarness({
      jobRepository,
      orchestrator: inner,
      analysisId: 'analysis-trigger-retry-001' as EntityId,
    });

    const retryRun = await successTrigger.runReferenceAnalysis({
      scope: TEST_SCOPE,
      referenceId: REFERENCE_ID,
      referenceKind: 'transcript',
      occurredAt: TEST_TIMESTAMP,
    });

    expect(retryRun.ok).toBe(true);
    if (!retryRun.ok) {
      return;
    }

    expect(jobRepository.jobs.get('job-trigger-001')?.state).toBe('completed');
  });
});
