import { describe, expect, it } from 'vitest';
import {
  JobFailureSchemaWithCategory,
  JobRecordSchema,
  PackageEnvelopeSchema,
  ReferenceVideoAnalysisSchema,
} from '../../src/domain/canonical/index.js';
import {
  validBlueprintPackageEnvelopeFixture,
  validPromptPackageEnvelopeFixture,
} from '../fixtures/validPackageEnvelope.js';
import { validReferenceVideoAnalysisFixture } from '../fixtures/validReferenceVideoAnalysis.js';

describe('ReferenceVideoAnalysisSchema', () => {
  it('parses the valid reference analysis fixture', () => {
    const result = ReferenceVideoAnalysisSchema.safeParse(validReferenceVideoAnalysisFixture);
    expect(result.success).toBe(true);
  });

  it('rejects analysis missing required safety transformation notice', () => {
    const data = structuredClone(validReferenceVideoAnalysisFixture);
    data.safety.transformationNotice = '';
    const result = ReferenceVideoAnalysisSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects unsupported reference kind', () => {
    const data = structuredClone(validReferenceVideoAnalysisFixture);
    data.metadata.referenceKind = 'podcast_url' as typeof data.metadata.referenceKind;
    const result = ReferenceVideoAnalysisSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('PackageEnvelopeSchema', () => {
  it('parses prompt and blueprint package fixtures', () => {
    expect(PackageEnvelopeSchema.safeParse(validPromptPackageEnvelopeFixture).success).toBe(true);
    expect(PackageEnvelopeSchema.safeParse(validBlueprintPackageEnvelopeFixture).success).toBe(true);
  });

  it('rejects mismatched packageType and payload shape', () => {
    const data = structuredClone(validPromptPackageEnvelopeFixture);
    data.packageType = 'seo';
    const result = PackageEnvelopeSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('JobRecordSchema', () => {
  it('requires failure on failed state', () => {
    const result = JobRecordSchema.safeParse({
      jobId: 'job-001',
      projectId: 'project-001',
      referenceId: 'reference-001',
      state: 'failed',
      progressPercent: 40,
      createdAt: '2026-07-05T12:00:00.000Z',
      updatedAt: '2026-07-05T12:01:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('validates failure code and category alignment', () => {
    const result = JobFailureSchemaWithCategory.safeParse({
      code: 'invalid_url',
      category: 'access',
      message: 'URL failed validation',
      retryable: false,
      occurredAt: '2026-07-05T12:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('accepts completed job at 100% progress', () => {
    const result = JobRecordSchema.safeParse({
      jobId: 'job-001',
      projectId: 'project-001',
      referenceId: 'reference-001',
      state: 'completed',
      progressPercent: 100,
      createdAt: '2026-07-05T12:00:00.000Z',
      updatedAt: '2026-07-05T12:05:00.000Z',
      completedAt: '2026-07-05T12:05:00.000Z',
    });
    expect(result.success).toBe(true);
  });
});
