import { describe, expect, it } from 'vitest';
import type { ProductionRequirements } from '@/domain/videoBrief';
import type {
  PartialVideoBriefDraft,
  SourceStepInput,
} from '@/domain/videoBriefDraft';
import type {
  VideoBriefRepository,
  VideoBriefRepositoryResult,
} from '@/server/briefs/video-brief-repository';
import { VideoBriefService } from '@/server/briefs/video-brief-service';

type FakeProject = {
  ownerId: string;
  archived: boolean;
  deleted: boolean;
};

const EMPTY_REQUIREMENTS: ProductionRequirements = {
  characterConsistency: false,
  productConsistency: false,
  logoAccuracy: false,
  exactTextVisibility: false,
  nativeAudio: false,
  dialogue: false,
  voiceover: false,
  lipSync: false,
  multipleLocations: false,
  cameraControl: false,
  firstLastFrameControl: false,
  videoExtension: false,
  referenceImages: false,
  commercialUse: false,
};

const ownerA = '11111111-1111-1111-1111-111111111111';
const ownerB = '22222222-2222-2222-2222-222222222222';
const projectId = '33333333-3333-3333-3333-333333333333';
const missingProjectId = '44444444-4444-4444-4444-444444444444';

const validIdeaSource: SourceStepInput = {
  sourceType: 'idea',
  sourceText: 'A compelling summer product launch concept for urban professionals.',
  sourceUrl: null,
};

const validObjective = {
  workingTitle: 'Summer Launch',
  objective: 'Showcase the new product line to young professionals seeking quality.',
  targetAudience: 'Urban professionals aged 25-35',
};

const validDestination = {
  publishingDestination: 'youtube' as const,
  aspectRatio: '16:9' as const,
};

const validCategory = {
  videoCategory: 'product_advertisement' as const,
};

const validDuration = {
  durationSeconds: 30,
};

const validStyle = {
  visualStyle: 'Cinematic',
  tone: 'Upbeat',
};

const validRequirements = {
  productionRequirements: {
    ...EMPTY_REQUIREMENTS,
    voiceover: true,
    commercialUse: true,
  },
};

const validPriorities = {
  budgetPriority: 'balanced' as const,
  qualityPriority: 'highest_quality' as const,
  userConstraints: null,
};

class FakeVideoBriefRepository implements VideoBriefRepository {
  private projects = new Map<string, FakeProject>();
  private briefs = new Map<string, PartialVideoBriefDraft>();
  private shouldFail = false;

  seedProject(projectIdToSeed: string, project: FakeProject) {
    this.projects.set(projectIdToSeed, project);
  }

  setShouldFail(value: boolean) {
    this.shouldFail = value;
  }

  async getByProjectId(
    userId: string,
    targetProjectId: string,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    const project = this.projects.get(targetProjectId);

    if (!project || project.deleted || project.ownerId !== userId) {
      return { ok: false, code: 'not_found' };
    }

    const brief = this.briefs.get(targetProjectId);

    if (!brief) {
      return { ok: false, code: 'not_found' };
    }

    return { ok: true, data: { ...brief } };
  }

  private verifyMutation(userId: string, targetProjectId: string): VideoBriefRepositoryResult<void> {
    if (this.shouldFail) {
      return { ok: false, code: 'persistence_error' };
    }

    const project = this.projects.get(targetProjectId);

    if (!project || project.deleted || project.ownerId !== userId) {
      return { ok: false, code: 'not_found' };
    }

    if (project.archived) {
      return { ok: false, code: 'project_archived' };
    }

    return { ok: true, data: undefined };
  }

  private upsert(
    userId: string,
    targetProjectId: string,
    fields: Partial<PartialVideoBriefDraft>,
  ): VideoBriefRepositoryResult<PartialVideoBriefDraft> {
    const verified = this.verifyMutation(userId, targetProjectId);

    if (!verified.ok) {
      return verified;
    }

    const now = new Date().toISOString();
    const existing = this.briefs.get(targetProjectId);
    const updated: PartialVideoBriefDraft = {
      id: existing?.id ?? crypto.randomUUID(),
      projectId: targetProjectId,
      createdAt: existing?.createdAt ?? now,
      ...existing,
      ...fields,
      updatedAt: now,
      completedAt: null,
    };

    this.briefs.set(targetProjectId, updated);
    return { ok: true, data: { ...updated } };
  }

  async saveSourceStep(
    userId: string,
    targetProjectId: string,
    input: SourceStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsert(userId, targetProjectId, {
      sourceType: input.sourceType,
      sourceText: input.sourceText,
      sourceUrl: input.sourceUrl,
    });
  }

  async saveObjectiveStep(
    userId: string,
    targetProjectId: string,
    input: typeof validObjective,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsert(userId, targetProjectId, input);
  }

  async saveDestinationStep(
    userId: string,
    targetProjectId: string,
    input: typeof validDestination,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsert(userId, targetProjectId, input);
  }

  async saveCategoryStep(
    userId: string,
    targetProjectId: string,
    input: typeof validCategory,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsert(userId, targetProjectId, input);
  }

  async saveDurationStep(
    userId: string,
    targetProjectId: string,
    input: typeof validDuration,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsert(userId, targetProjectId, input);
  }

  async saveStyleStep(
    userId: string,
    targetProjectId: string,
    input: typeof validStyle,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsert(userId, targetProjectId, input);
  }

  async saveRequirementsStep(
    userId: string,
    targetProjectId: string,
    input: typeof validRequirements,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsert(userId, targetProjectId, {
      productionRequirements: input.productionRequirements,
    });
  }

  async savePrioritiesStep(
    userId: string,
    targetProjectId: string,
    input: typeof validPriorities,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsert(userId, targetProjectId, input);
  }

  async completeBrief(
    userId: string,
    targetProjectId: string,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    const verified = this.verifyMutation(userId, targetProjectId);

    if (!verified.ok) {
      return verified;
    }

    const brief = this.briefs.get(targetProjectId);

    if (!brief) {
      return { ok: false, code: 'not_found' };
    }

    const completed = {
      ...brief,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.briefs.set(targetProjectId, completed);
    return { ok: true, data: { ...completed } };
  }
}

function createServiceWithProject(archived = false) {
  const repository = new FakeVideoBriefRepository();
  repository.seedProject(projectId, {
    ownerId: ownerA,
    archived,
    deleted: false,
  });
  return { repository, service: new VideoBriefService(repository) };
}

async function saveAllInputSteps(service: VideoBriefService) {
  await service.saveSourceStep(ownerA, projectId, validIdeaSource);
  await service.saveObjectiveStep(ownerA, projectId, validObjective);
  await service.saveDestinationStep(ownerA, projectId, validDestination);
  await service.saveCategoryStep(ownerA, projectId, validCategory);
  await service.saveDurationStep(ownerA, projectId, validDuration);
  await service.saveStyleStep(ownerA, projectId, validStyle);
  await service.saveRequirementsStep(ownerA, projectId, validRequirements);
  await service.savePrioritiesStep(ownerA, projectId, validPriorities);
}

describe('VideoBriefService', () => {
  it('source step validates', async () => {
    const { service } = createServiceWithProject();
    const result = await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    expect(result.ok).toBe(true);
  });

  it('source save normalizes irrelevant values', async () => {
    const { service } = createServiceWithProject();
    const result = await service.saveSourceStep(ownerA, projectId, {
      sourceType: 'idea',
      sourceText: validIdeaSource.sourceText,
      sourceUrl: 'https://example.com/ignored',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sourceUrl).toBeNull();
    }
  });

  it('objective is blocked before source', async () => {
    const { service } = createServiceWithProject();
    const result = await service.saveObjectiveStep(ownerA, projectId, validObjective);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('validation_error');
    }
  });

  it('destination is blocked before objective', async () => {
    const { service } = createServiceWithProject();
    await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    const result = await service.saveDestinationStep(ownerA, projectId, validDestination);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('validation_error');
    }
  });

  it('category is blocked before destination', async () => {
    const { service } = createServiceWithProject();
    await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    await service.saveObjectiveStep(ownerA, projectId, validObjective);
    const result = await service.saveCategoryStep(ownerA, projectId, validCategory);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('validation_error');
    }
  });

  it('duration is blocked before category', async () => {
    const { service } = createServiceWithProject();
    await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    await service.saveObjectiveStep(ownerA, projectId, validObjective);
    await service.saveDestinationStep(ownerA, projectId, validDestination);
    const result = await service.saveDurationStep(ownerA, projectId, validDuration);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('validation_error');
    }
  });

  it('style is blocked before duration', async () => {
    const { service } = createServiceWithProject();
    await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    await service.saveObjectiveStep(ownerA, projectId, validObjective);
    await service.saveDestinationStep(ownerA, projectId, validDestination);
    await service.saveCategoryStep(ownerA, projectId, validCategory);
    const result = await service.saveStyleStep(ownerA, projectId, validStyle);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('validation_error');
    }
  });

  it('requirements are blocked before style', async () => {
    const { service } = createServiceWithProject();
    await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    await service.saveObjectiveStep(ownerA, projectId, validObjective);
    await service.saveDestinationStep(ownerA, projectId, validDestination);
    await service.saveCategoryStep(ownerA, projectId, validCategory);
    await service.saveDurationStep(ownerA, projectId, validDuration);
    const result = await service.saveRequirementsStep(ownerA, projectId, validRequirements);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('validation_error');
    }
  });

  it('priorities are blocked before requirements', async () => {
    const { service } = createServiceWithProject();
    await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    await service.saveObjectiveStep(ownerA, projectId, validObjective);
    await service.saveDestinationStep(ownerA, projectId, validDestination);
    await service.saveCategoryStep(ownerA, projectId, validCategory);
    await service.saveDurationStep(ownerA, projectId, validDuration);
    await service.saveStyleStep(ownerA, projectId, validStyle);
    const result = await service.savePrioritiesStep(ownerA, projectId, validPriorities);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('validation_error');
    }
  });

  it('review is blocked before priorities', async () => {
    const { service } = createServiceWithProject();
    await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    await service.saveObjectiveStep(ownerA, projectId, validObjective);
    await service.saveDestinationStep(ownerA, projectId, validDestination);
    await service.saveCategoryStep(ownerA, projectId, validCategory);
    await service.saveDurationStep(ownerA, projectId, validDuration);
    await service.saveStyleStep(ownerA, projectId, validStyle);
    await service.saveRequirementsStep(ownerA, projectId, validRequirements);
    const result = await service.completeBrief(ownerA, projectId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('validation_error');
    }
  });

  it('earlier completed steps are revisitable', async () => {
    const { service } = createServiceWithProject();
    await saveAllInputSteps(service);

    const revisedSource = {
      ...validIdeaSource,
      sourceText: 'An updated compelling summer product launch concept for professionals.',
    };

    const result = await service.saveSourceStep(ownerA, projectId, revisedSource);
    expect(result.ok).toBe(true);
  });

  it('saving an edited step reopens a completed draft', async () => {
    const { service } = createServiceWithProject();
    await saveAllInputSteps(service);

    const completed = await service.completeBrief(ownerA, projectId);
    expect(completed.ok).toBe(true);

    const edited = await service.saveSourceStep(ownerA, projectId, {
      ...validIdeaSource,
      sourceText: 'A revised compelling summer product launch concept for professionals.',
    });

    expect(edited.ok).toBe(true);
    if (edited.ok) {
      expect(edited.data.completedAt).toBeNull();
    }
  });

  it('invalid source returns validation error', async () => {
    const { service } = createServiceWithProject();
    const result = await service.saveSourceStep(ownerA, projectId, {
      sourceType: 'idea',
      sourceText: 'short',
      sourceUrl: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('validation_error');
    }
  });

  it('invalid duration returns validation error', async () => {
    const { service } = createServiceWithProject();
    await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    await service.saveObjectiveStep(ownerA, projectId, validObjective);
    await service.saveDestinationStep(ownerA, projectId, validDestination);
    await service.saveCategoryStep(ownerA, projectId, validCategory);
    const result = await service.saveDurationStep(ownerA, projectId, { durationSeconds: 4 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('validation_error');
    }
  });

  it('missing project returns not found', async () => {
    const { service } = createServiceWithProject();
    const result = await service.saveSourceStep(ownerA, missingProjectId, validIdeaSource);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('not_found');
    }
  });

  it('archived project returns project-archived', async () => {
    const { service } = createServiceWithProject(true);
    const result = await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('project_archived');
    }
  });

  it('repository error returns persistence error', async () => {
    const { repository, service } = createServiceWithProject();
    repository.setShouldFail(true);
    const result = await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('persistence_error');
    }
  });

  it('complete draft succeeds', async () => {
    const { service } = createServiceWithProject();
    await saveAllInputSteps(service);
    const result = await service.completeBrief(ownerA, projectId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.completedAt).not.toBeNull();
    }
  });

  it('incomplete draft cannot complete', async () => {
    const { service } = createServiceWithProject();
    await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    const result = await service.completeBrief(ownerA, projectId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('validation_error');
    }
  });

  it('trusted user ID is forwarded', async () => {
    const repository = new FakeVideoBriefRepository();
    repository.seedProject(projectId, { ownerId: ownerA, archived: false, deleted: false });
    const service = new VideoBriefService(repository);
    const result = await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    expect(result.ok).toBe(true);

    const foreign = await repository.getByProjectId(ownerB, projectId);
    expect(foreign.ok).toBe(false);
  });

  it('form or URL input cannot replace the trusted user ID', async () => {
    const { service } = createServiceWithProject();
    const result = await service.saveSourceStep(ownerA, projectId, {
      ...validIdeaSource,
      userId: ownerB,
      ownerId: ownerB,
    });
    expect(result.ok).toBe(true);

    const brief = await service.getByProjectId(ownerA, projectId);
    expect(brief.ok).toBe(true);

    const foreign = await service.getByProjectId(ownerB, projectId);
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) {
      expect(foreign.status).toBe('not_found');
    }
  });

  it('next-step helper is deterministic', async () => {
    const { service } = createServiceWithProject();
    expect(service.getNextStep('source')).toBe('objective');
    expect(service.getNextStep('objective')).toBe('destination');
    expect(service.getNextStep('priorities')).toBe('review');
    expect(service.getNextStep('review')).toBeNull();
  });

  it('first-incomplete-step helper is deterministic', async () => {
    const { service, repository } = createServiceWithProject();
    const emptyDraft: PartialVideoBriefDraft = {
      id: '00000000-0000-0000-0000-000000000000',
      projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(service.getFirstIncompleteStep(emptyDraft)).toBe('source');

    await service.saveSourceStep(ownerA, projectId, validIdeaSource);
    const loaded = await repository.getByProjectId(ownerA, projectId);
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(service.getFirstIncompleteStep(loaded.data)).toBe('objective');
    }
  });
});
