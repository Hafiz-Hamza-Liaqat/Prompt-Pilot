import { describe, expect, it } from 'vitest';
import {
  parseReferenceIntakeForm,
  parseReferenceIntakeFormData,
  parseStartAnalysisJobForm,
} from '../../src/app/projects/[projectId]/reference/validation.js';
import { initialReferenceIntakeFormState } from '../../src/app/projects/[projectId]/reference/form-state.js';
import { REFERENCE_ATTESTATION_VERSION } from '../../src/config/reference-intake.js';
import type {
  CreateReferenceInput,
  OwnerScope,
  PersistenceResult,
  ReferenceIntakePayloadRecord,
  RightsAttestationRecord,
} from '../../src/server/persistence/contracts/index.js';
import type { AttestationRepository } from '../../src/server/persistence/repositories/attestation-repository.js';
import type { ReferenceIntakePayloadRepository } from '../../src/server/persistence/repositories/reference-intake-payload-repository.js';
import type { ReferenceRepository } from '../../src/server/persistence/repositories/reference-repository.js';
import { createReferenceIntakeService } from '../../src/server/reference/reference-intake-service.js';

const projectId = '33333333-3333-3333-3333-333333333333';
const ownerId = '11111111-1111-1111-1111-111111111111';
const scope: OwnerScope = { ownerId, projectId };

const validTranscript =
  'This transcript contains enough characters to pass the minimum length validation gate.';
const validScript =
  'Scene one opens on a city skyline at dawn with narration describing the product launch.';
const validYoutubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

function buildFormData(fields: Record<string, string | undefined>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      formData.set(key, value);
    }
  }
  return formData;
}

class FakeAttestationRepository implements AttestationRepository {
  readonly inserts: Array<{ scope: OwnerScope; version: string; id: string }> = [];
  shouldFail = false;

  async insert(scope: OwnerScope, input: { attestationVersion: string }, attestationId: string) {
    if (this.shouldFail) {
      return { ok: false as const, code: 'persistence_error' as const };
    }

    this.inserts.push({
      scope,
      version: input.attestationVersion,
      id: attestationId,
    });

    const now = new Date().toISOString();
    const record: RightsAttestationRecord = {
      attestationId,
      projectId: scope.projectId,
      ownerId: scope.ownerId,
      attestationVersion: input.attestationVersion,
      acceptedAt: now,
      createdAt: now,
    };

    return { ok: true as const, data: record };
  }
}

class FakeReferenceRepository implements ReferenceRepository {
  readonly inserts: Array<{ scope: OwnerScope; input: CreateReferenceInput; id: string }> = [];
  shouldFail = false;

  async insert(scope: OwnerScope, input: CreateReferenceInput, referenceId: string) {
    if (this.shouldFail) {
      return { ok: false as const, code: 'persistence_error' as const };
    }

    this.inserts.push({ scope, input, id: referenceId });
    return {
      ok: true as const,
      data: {
        referenceId,
        projectId: scope.projectId,
        referenceKind: input.referenceKind,
        canonicalUrl: input.canonicalUrl,
        platform: input.platform,
        platformContentId: input.platformContentId,
        title: input.title,
        submittedAt: new Date().toISOString(),
        accessStatus: input.accessStatus,
        rightsAttestationId: input.rightsAttestationId,
      },
    };
  }

  async getById(): Promise<PersistenceResult<never>> {
    return { ok: false, code: 'not_found' };
  }

  async listByProject(): Promise<PersistenceResult<never>> {
    return { ok: false, code: 'not_found' };
  }

  async getLatestByProject(): Promise<PersistenceResult<null>> {
    return { ok: true, data: null };
  }

  async updateMetadata(): Promise<PersistenceResult<never>> {
    return { ok: false, code: 'not_found' };
  }
}

class FakeReferenceIntakePayloadRepository implements ReferenceIntakePayloadRepository {
  readonly inserts: Array<{ scope: OwnerScope; referenceId: string; bodyText: string }> = [];
  shouldFail = false;

  async insert(
    scope: OwnerScope,
    input: { referenceId: string; payloadKind: 'transcript' | 'script'; bodyText: string },
  ): Promise<PersistenceResult<ReferenceIntakePayloadRecord>> {
    if (this.shouldFail) {
      return { ok: false, code: 'persistence_error' };
    }

    this.inserts.push({
      scope,
      referenceId: input.referenceId,
      bodyText: input.bodyText,
    });

    return {
      ok: true,
      data: {
        referenceId: input.referenceId,
        projectId: scope.projectId,
        ownerId: scope.ownerId,
        payloadKind: input.payloadKind,
        bodyText: input.bodyText,
        createdAt: new Date().toISOString(),
      },
    };
  }

  async getByReferenceId(): Promise<PersistenceResult<ReferenceIntakePayloadRecord | null>> {
    return { ok: true, data: null };
  }
}

function createServiceHarness() {
  const attestationRepository = new FakeAttestationRepository();
  const referenceRepository = new FakeReferenceRepository();
  const referenceIntakePayloadRepository = new FakeReferenceIntakePayloadRepository();
  let nextId = 0;

  const service = createReferenceIntakeService({
    attestationRepository,
    referenceRepository,
    referenceIntakePayloadRepository,
    idGenerator: () => {
      nextId += 1;
      return `00000000-0000-4000-8000-${String(nextId).padStart(12, '0')}`;
    },
  });

  return {
    service,
    attestationRepository,
    referenceRepository,
    referenceIntakePayloadRepository,
  };
}

describe('reference intake validation', () => {
  it('starts with idle form state', () => {
    expect(initialReferenceIntakeFormState).toEqual({ status: 'idle' });
  });

  it('parses a valid transcript submission', () => {
    const parsed = parseReferenceIntakeForm({
      projectId,
      referenceKind: 'transcript',
      attestationAccepted: true,
      attestationVersion: REFERENCE_ATTESTATION_VERSION,
      bodyText: validTranscript,
    });

    expect(parsed.ok).toBe(true);
  });

  it('requires rights attestation acceptance', () => {
    const parsed = parseReferenceIntakeForm({
      projectId,
      referenceKind: 'transcript',
      attestationAccepted: false,
      attestationVersion: REFERENCE_ATTESTATION_VERSION,
      bodyText: validTranscript,
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.fieldErrors.attestationAccepted).toBeTruthy();
    }
  });

  it('rejects short transcript text', () => {
    const parsed = parseReferenceIntakeForm({
      projectId,
      referenceKind: 'transcript',
      attestationAccepted: true,
      attestationVersion: REFERENCE_ATTESTATION_VERSION,
      bodyText: 'too short',
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.fieldErrors.bodyText).toBeTruthy();
    }
  });

  it('parses form data for youtube url intake', () => {
    const parsed = parseReferenceIntakeFormData(
      buildFormData({
        projectId,
        referenceKind: 'youtube_url',
        attestationAccepted: 'on',
        attestationVersion: REFERENCE_ATTESTATION_VERSION,
        canonicalUrl: validYoutubeUrl,
      }),
    );

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.referenceKind).toBe('youtube_url');
    }
  });

  it('parses start analysis job form input', () => {
    const parsed = parseStartAnalysisJobForm({
      projectId,
      referenceId: '44444444-4444-4444-4444-444444444444',
      referenceKind: 'transcript',
    });

    expect(parsed.ok).toBe(true);
  });
});

describe('ReferenceIntakeService', () => {
  it('persists attestation, reference, and durable transcript payload', async () => {
    const { service, attestationRepository, referenceRepository, referenceIntakePayloadRepository } =
      createServiceHarness();

    const result = await service.submitIntake(scope, {
      projectId,
      referenceKind: 'transcript',
      attestationAccepted: true,
      attestationVersion: REFERENCE_ATTESTATION_VERSION,
      bodyText: validTranscript,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.referenceKind).toBe('transcript');
      expect(attestationRepository.inserts).toHaveLength(1);
      expect(referenceRepository.inserts).toHaveLength(1);
      expect(referenceIntakePayloadRepository.inserts).toHaveLength(1);
      expect(referenceIntakePayloadRepository.inserts[0]?.bodyText).toBe(validTranscript);
      expect(referenceRepository.inserts[0]?.input.rightsAttestationId).toBe(
        attestationRepository.inserts[0]?.id,
      );
    }
  });

  it('persists script payload without youtube metadata', async () => {
    const { service, referenceRepository, referenceIntakePayloadRepository } =
      createServiceHarness();

    const result = await service.submitIntake(scope, {
      projectId,
      referenceKind: 'script',
      attestationAccepted: true,
      attestationVersion: REFERENCE_ATTESTATION_VERSION,
      bodyText: validScript,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(referenceIntakePayloadRepository.inserts[0]?.bodyText).toBe(validScript);
      expect(referenceRepository.inserts[0]?.input.canonicalUrl).toBeUndefined();
    }
  });

  it('normalizes youtube url on reference row and skips payload insert', async () => {
    const { service, referenceRepository, referenceIntakePayloadRepository } =
      createServiceHarness();

    const result = await service.submitIntake(scope, {
      projectId,
      referenceKind: 'youtube_url',
      attestationAccepted: true,
      attestationVersion: REFERENCE_ATTESTATION_VERSION,
      canonicalUrl: validYoutubeUrl,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(referenceIntakePayloadRepository.inserts).toHaveLength(0);
      expect(referenceRepository.inserts[0]?.input.platform).toBe('youtube');
      expect(referenceRepository.inserts[0]?.input.platformContentId).toBe('dQw4w9WgXcQ');
      expect(referenceRepository.inserts[0]?.input.canonicalUrl).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      );
    }
  });

  it('returns invalid_url for unsupported youtube links', async () => {
    const { service, attestationRepository } = createServiceHarness();

    const result = await service.submitIntake(scope, {
      projectId,
      referenceKind: 'youtube_url',
      attestationAccepted: true,
      attestationVersion: REFERENCE_ATTESTATION_VERSION,
      canonicalUrl: 'https://example.com/not-youtube',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('invalid_url');
      expect(attestationRepository.inserts).toHaveLength(1);
    }
  });

  it('surfaces persistence errors from attestation insert', async () => {
    const { service, attestationRepository } = createServiceHarness();
    attestationRepository.shouldFail = true;

    const result = await service.submitIntake(scope, {
      projectId,
      referenceKind: 'transcript',
      attestationAccepted: true,
      attestationVersion: REFERENCE_ATTESTATION_VERSION,
      bodyText: validTranscript,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('persistence_error');
    }
  });

  it('surfaces persistence errors from payload insert', async () => {
    const { service, referenceIntakePayloadRepository } = createServiceHarness();
    referenceIntakePayloadRepository.shouldFail = true;

    const result = await service.submitIntake(scope, {
      projectId,
      referenceKind: 'script',
      attestationAccepted: true,
      attestationVersion: REFERENCE_ATTESTATION_VERSION,
      bodyText: validScript,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('persistence_error');
    }
  });
});
