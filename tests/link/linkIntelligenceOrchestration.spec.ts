import { describe, expect, it } from 'vitest';
import { createDefaultJobLifecycleService } from '../../src/server/job/index.js';
import { createDefaultJobOrchestrator } from '../../src/server/orchestration/index.js';
import { createLinkIntelligenceCoordinator } from '../../src/server/link/link-intelligence-coordinator.js';
import { createLinkProviderRegistry } from '../../src/server/link/link-provider-registry.js';
import { executeLinkIntelligenceStage } from '../../src/server/link/link-intelligence-stage-runner.js';
import { createMockLinkProvider } from '../../src/server/link/mock-link-provider.js';
import { createPureMediaIntakeService } from '../../src/server/media/pure-media-intake-service.js';

const publicDns = async () => ['93.184.216.34'];

const TIMESTAMP = '2026-07-06T15:00:00.000Z';
const OWNER = 'owner-001';
const PROJECT = 'project-001';
const REFERENCE = 'reference-001';
const JOB = 'job-001';

async function advanceToLinkIntelligenceStage(
  orchestrator: ReturnType<typeof createDefaultJobOrchestrator>,
) {
  const started = orchestrator.start({
    jobId: JOB,
    projectId: PROJECT,
    ownerId: OWNER,
    referenceId: REFERENCE,
    referenceKind: 'youtube_url',
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

  expect(context.currentStageId).toBe('link_intelligence');
  return context;
}

describe('Link Intelligence orchestrator coordination', () => {
  it('includes link_intelligence stage for youtube_url plans', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });

    const started = orchestrator.start({
      jobId: JOB,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'youtube_url',
      occurredAt: TIMESTAMP,
    });

    expect(started.ok).toBe(true);
    if (started.ok) {
      const stageIds = started.data.context.plan.stages.map((stage) => stage.stageId);
      expect(stageIds).toContain('link_intelligence');
      expect(stageIds).not.toContain('media_intake');
    }
  });

  it('executes link intelligence then advances orchestrator past link_intelligence', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const coordinator = createLinkIntelligenceCoordinator({
      registry: createLinkProviderRegistry([createMockLinkProvider()]),
      hostResolver: publicDns,
    });

    const context = await advanceToLinkIntelligenceStage(orchestrator);

    const executed = await executeLinkIntelligenceStage(
      orchestrator,
      coordinator,
      context,
      {
        rawUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        occurredAt: TIMESTAMP,
      },
    );

    expect(executed.ok).toBe(true);
    if (executed.ok) {
      expect(executed.data.context.linkMetadataId).toBeTruthy();
      expect(executed.data.context.currentStageId).toBe('fingerprint');
      expect(executed.data.context.job.state).toBe('fingerprinting');
      expect(executed.data.events).toContain('stage_completed');
    }
  });

  it('hands LinkMetadata to Media Intake and binds urlMediaDescriptorId', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const coordinator = createLinkIntelligenceCoordinator({
      registry: createLinkProviderRegistry([createMockLinkProvider()]),
      hostResolver: publicDns,
    });
    const mediaIntake = createPureMediaIntakeService();

    const context = await advanceToLinkIntelligenceStage(orchestrator);

    const executed = await executeLinkIntelligenceStage(
      orchestrator,
      coordinator,
      context,
      {
        rawUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        occurredAt: TIMESTAMP,
      },
      { mediaIntake },
    );

    expect(executed.ok).toBe(true);
    if (executed.ok) {
      expect(executed.data.context.linkMetadataId).toBeTruthy();
      expect(executed.data.context.urlMediaDescriptorId).toBe(executed.data.context.linkMetadataId);
      expect(executed.data.context.currentStageId).toBe('fingerprint');
    }
  });

  it('does not include link_intelligence for upload references', () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
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
    if (started.ok) {
      const stageIds = started.data.context.plan.stages.map((stage) => stage.stageId);
      expect(stageIds).not.toContain('link_intelligence');
      expect(stageIds).toContain('media_intake');
    }
  });
});
