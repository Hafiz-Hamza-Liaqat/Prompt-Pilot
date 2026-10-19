import { describe, expect, it, vi } from 'vitest';
import { createDefaultJobLifecycleService } from '../../src/server/job/index.js';
import {
  createDefaultJobOrchestrator,
  InMemoryOrchestrationEventPublisher,
} from '../../src/server/orchestration/index.js';
import type { MediaIntakeService } from '../../src/server/media/media-intake-service.js';

const TIMESTAMP = '2026-07-06T12:00:00.000Z';
const OWNER = 'owner-001';
const PROJECT = 'project-001';
const REFERENCE = 'reference-001';
const JOB = 'job-001';

function createMockMediaIntakeService(): MediaIntakeService {
  return {
    validateMetadata: vi.fn(),
    validateMetadataForIntake: vi.fn(),
    registerSession: vi.fn(),
    startSession: vi.fn(),
    recordProgress: vi.fn(),
    completeSession: vi.fn(),
    cancelSession: vi.fn(),
    resumeSession: vi.fn(),
    assertScope: vi.fn(),
    assertUploadSession: vi.fn(),
    assertTemporaryAsset: vi.fn(),
    planUploadRequest: vi.fn(),
    resolveUrlReference: vi.fn(),
  };
}

async function advanceToMediaIntakeStage(
  orchestrator: ReturnType<typeof createDefaultJobOrchestrator>,
) {
  const started = orchestrator.start({
    jobId: JOB,
    projectId: PROJECT,
    ownerId: OWNER,
    referenceId: REFERENCE,
    referenceKind: 'video_upload',
    occurredAt: TIMESTAMP,
  });
  expect(started.ok).toBe(true);
  if (!started.ok) {
    throw new Error('start failed');
  }

  let context = started.data.context;
  for (const stageId of ['validation', 'ownership'] as const) {
    const step = orchestrator.completeStage(context, {
      stageId,
      jobId: JOB,
      completedAt: TIMESTAMP,
      outcome: 'success',
    });
    expect(step.ok).toBe(true);
    if (step.ok) {
      context = step.data.context;
    }
  }

  expect(context.currentStageId).toBe('media_intake');
  return context;
}

describe('MediaIntakeService orchestrator coordination', () => {
  it('accepts optional MediaIntakeService injection without invoking upload methods on start', () => {
    const mediaIntake = createMockMediaIntakeService();

    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
      mediaIntake,
    });

    const started = orchestrator.start({
      jobId: JOB,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'video_upload',
      occurredAt: TIMESTAMP,
    });

    expect(started.ok).toBe(true);
    expect(mediaIntake.planUploadRequest).not.toHaveBeenCalled();
    expect(mediaIntake.cancelSession).not.toHaveBeenCalled();
    expect(mediaIntake.startSession).not.toHaveBeenCalled();
  });

  it('coordinates upload-stage cancellation via events only when MediaIntakeService is injected', async () => {
    const mediaIntake = createMockMediaIntakeService();
    const publisher = new InMemoryOrchestrationEventPublisher();

    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
      mediaIntake,
      publisher,
    });

    const context = await advanceToMediaIntakeStage(orchestrator);

    const cancelled = orchestrator.cancel({
      context,
      requestedAt: TIMESTAMP,
      reason: 'User aborted upload',
    });

    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) {
      return;
    }
    expect(cancelled.data.events).toContain('cancellation_requested');
    expect(cancelled.data.context.job.state).toBe('cancelled');

    expect(mediaIntake.cancelSession).not.toHaveBeenCalled();
    expect(mediaIntake.planUploadRequest).not.toHaveBeenCalled();

    const cancellationEvent = publisher.list().find((event) => event.eventType === 'cancellation_requested');
    expect(cancellationEvent?.stageId).toBe('media_intake');
    expect(cancellationEvent?.message).toContain('User aborted upload');
  });

  it('uses generic cancellation messaging when MediaIntakeService is not injected', async () => {
    const publisher = new InMemoryOrchestrationEventPublisher();
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
      publisher,
    });

    const context = await advanceToMediaIntakeStage(orchestrator);

    const cancelled = orchestrator.cancel({
      context,
      requestedAt: TIMESTAMP,
      reason: 'User aborted upload',
    });

    expect(cancelled.ok).toBe(true);

    const cancellationEvent = publisher.list().find((event) => event.eventType === 'cancellation_requested');
    expect(cancellationEvent?.stageId).toBeUndefined();
    expect(cancellationEvent?.message).toBe('User aborted upload');
  });
});
