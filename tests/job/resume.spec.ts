import { describe, expect, it } from 'vitest';
import type { JobRecord } from '../../src/domain/canonical/job.js';
import {
  canResumeUpload,
  evaluateResume,
  resolveResumeState,
} from '../../src/domain/job/resume.js';
import { createDefaultJobLifecycleService } from '../../src/server/job/default-job-lifecycle-service.js';

const TIMESTAMP = '2026-07-05T12:00:00.000Z';

describe('job resume model', () => {
  const lifecycle = createDefaultJobLifecycleService();

  it('maps checkpoints to resume states', () => {
    expect(resolveResumeState('upload_bytes')).toBe('uploading');
    expect(resolveResumeState('post_fingerprinting')).toBe('fingerprinting');
    expect(resolveResumeState('post_analyzing')).toBe('analyzing');
  });

  it('allows upload resume only in uploading state', () => {
    const uploadingJob: JobRecord = {
      jobId: 'job-001',
      projectId: 'project-001',
      referenceId: 'reference-001',
      state: 'uploading',
      progressPercent: 15,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    };

    expect(canResumeUpload(uploadingJob)).toBe(true);
    expect(lifecycle.canResumeUpload(uploadingJob)).toBe(true);

    const plan = lifecycle.planUploadResume(uploadingJob, {
      jobId: 'job-001',
      bytesUploaded: 512,
      requestedAt: TIMESTAMP,
    });
    expect(plan.ok).toBe(true);
  });

  it('rejects resume when checkpoint does not match job', () => {
    const job: JobRecord = {
      jobId: 'job-001',
      projectId: 'project-001',
      referenceId: 'reference-001',
      state: 'analyzing',
      progressPercent: 55,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    };

    const decision = evaluateResume(job, {
      checkpoint: 'post_fingerprinting',
      jobId: 'job-002',
      stateAtCheckpoint: 'fingerprinting',
      recordedAt: TIMESTAMP,
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe('checkpoint_unavailable');
    }
  });
});
