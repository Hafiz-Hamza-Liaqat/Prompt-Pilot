import { describe, expect, it, vi } from 'vitest';
import type { AiVideoProvider } from '../../src/domain/constants.js';
import type { ProjectRecord } from '../../src/domain/project.js';
import type {
  CatalogueCapabilityFact,
  CatalogueOffering,
  CatalogueProvider,
  CatalogueSource,
} from '../../src/domain/providerCatalogue.js';
import type { PartialVideoBriefDraft } from '../../src/domain/videoBriefDraft.js';
import { createDefaultProductionRequirements } from '../../src/domain/productionRequirements.js';
import { mockResultWorkspaceFixture } from '../../src/fixtures/mock-result-workspace.js';
import { validReferenceVideoAnalysisFixture } from '../fixtures/validReferenceVideoAnalysis.js';
import type {
  ProjectRepository,
  RepositoryResult,
} from '../../src/server/projects/project-repository.js';
import type {
  VideoBriefRepository,
  VideoBriefRepositoryResult,
} from '../../src/server/briefs/video-brief-repository.js';
import type {
  ProviderCatalogueRepository,
  ProviderCatalogueRepositoryResult,
} from '../../src/server/providers/provider-catalogue-repository.js';
import {
  createWorkspaceComposerService,
  WorkspaceComposerService,
} from '../../src/server/workspace/workspace-composer-service.js';
import type {
  PersistenceResult,
  WorkspaceIntelligenceSnapshot,
} from '../../src/server/persistence/contracts/index.js';
import type { WorkspaceRepository } from '../../src/server/persistence/repositories/workspace-repository.js';
import { buildDeterministicRecommendationCatalogue } from '../recommendations/catalogueFixtures.js';
import {
  buildIntelligenceSnapshot,
  StubWorkspaceRepository,
} from './composer-test-doubles.js';

const COMPLETED_AT = '2026-07-04T12:00:00+00:00';

const ownerA = '11111111-1111-1111-1111-111111111111';
const ownerB = '22222222-2222-2222-2222-222222222222';
const projectId = '33333333-3333-3333-3333-333333333333';
const briefId = '44444444-4444-4444-4444-444444444444';

class FakeProjectRepository implements ProjectRepository {
  private projects = new Map<string, ProjectRecord>();
  private shouldFail = false;

  seed(project: ProjectRecord) {
    this.projects.set(project.id, project);
  }

  delete(projectIdToDelete: string) {
    this.projects.delete(projectIdToDelete);
  }

  setShouldFail(value: boolean) {
    this.shouldFail = value;
  }

  async create(): Promise<RepositoryResult<ProjectRecord>> {
    throw new Error('Not implemented in workspace tests');
  }

  async getById(ownerId: string, targetProjectId: string): Promise<RepositoryResult<ProjectRecord>> {
    if (this.shouldFail) {
      return { ok: false, code: 'persistence_error' };
    }

    const project = this.projects.get(targetProjectId);
    if (!project || project.ownerId !== ownerId) {
      return { ok: false, code: 'not_found' };
    }

    return { ok: true, data: project };
  }

  async list(): Promise<RepositoryResult<never>> {
    throw new Error('Not implemented in workspace tests');
  }

  async update(): Promise<RepositoryResult<ProjectRecord>> {
    throw new Error('Not implemented in workspace tests');
  }

  async setArchived(): Promise<RepositoryResult<ProjectRecord>> {
    throw new Error('Not implemented in workspace tests');
  }

  async duplicate(): Promise<RepositoryResult<ProjectRecord>> {
    throw new Error('Not implemented in workspace tests');
  }

  async softDelete(): Promise<RepositoryResult<void>> {
    throw new Error('Not implemented in workspace tests');
  }
}

class FakeVideoBriefRepository implements VideoBriefRepository {
  private briefs = new Map<string, PartialVideoBriefDraft>();
  private shouldFail = false;

  seed(brief: PartialVideoBriefDraft) {
    this.briefs.set(brief.projectId, brief);
  }

  delete(projectIdToDelete: string) {
    this.briefs.delete(projectIdToDelete);
  }

  setShouldFail(value: boolean) {
    this.shouldFail = value;
  }

  async getByProjectId(
    userId: string,
    targetProjectId: string,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    if (this.shouldFail) {
      return { ok: false, code: 'persistence_error' };
    }

    const brief = this.briefs.get(targetProjectId);
    if (!brief) {
      return { ok: false, code: 'not_found' };
    }

    return { ok: true, data: brief };
  }

  async saveSourceStep(): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    throw new Error('Not implemented in workspace tests');
  }

  async saveObjectiveStep(): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    throw new Error('Not implemented in workspace tests');
  }

  async saveDestinationStep(): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    throw new Error('Not implemented in workspace tests');
  }

  async saveCategoryStep(): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    throw new Error('Not implemented in workspace tests');
  }

  async saveDurationStep(): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    throw new Error('Not implemented in workspace tests');
  }

  async saveStyleStep(): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    throw new Error('Not implemented in workspace tests');
  }

  async saveRequirementsStep(): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    throw new Error('Not implemented in workspace tests');
  }

  async savePrioritiesStep(): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    throw new Error('Not implemented in workspace tests');
  }

  async completeBrief(): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    throw new Error('Not implemented in workspace tests');
  }

  async reopenBrief(): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    throw new Error('Not implemented in workspace tests');
  }
}

class FakeProviderCatalogueRepository implements ProviderCatalogueRepository {
  private providers = new Map<AiVideoProvider, CatalogueProvider>();
  private offerings = new Map<string, CatalogueOffering>();
  private facts = new Map<string, CatalogueCapabilityFact[]>();
  private sources = new Map<AiVideoProvider, CatalogueSource[]>();
  private shouldFail = false;

  seedProvider(provider: CatalogueProvider) {
    this.providers.set(provider.id, provider);
  }

  seedOffering(offering: CatalogueOffering) {
    this.offerings.set(offering.id, offering);
  }

  seedFacts(offeringId: string, facts: CatalogueCapabilityFact[]) {
    this.facts.set(offeringId, facts);
  }

  seedSources(providerId: AiVideoProvider, sources: CatalogueSource[]) {
    this.sources.set(providerId, sources);
  }

  setShouldFail(value: boolean) {
    this.shouldFail = value;
  }

  async listProviders(): Promise<ProviderCatalogueRepositoryResult<CatalogueProvider[]>> {
    if (this.shouldFail) {
      return { ok: false, code: 'persistence_error' };
    }

    return { ok: true, data: [...this.providers.values()] };
  }

  async getProviderById(
    providerId: AiVideoProvider,
  ): Promise<ProviderCatalogueRepositoryResult<CatalogueProvider>> {
    if (this.shouldFail) {
      return { ok: false, code: 'persistence_error' };
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      return { ok: false, code: 'not_found' };
    }

    return { ok: true, data: provider };
  }

  async listOfferingsByProvider(
    providerId: AiVideoProvider,
  ): Promise<ProviderCatalogueRepositoryResult<CatalogueOffering[]>> {
    if (this.shouldFail) {
      return { ok: false, code: 'persistence_error' };
    }

    return {
      ok: true,
      data: [...this.offerings.values()].filter((offering) => offering.providerId === providerId),
    };
  }

  async listCapabilityFactsByOffering(
    offeringId: string,
  ): Promise<ProviderCatalogueRepositoryResult<CatalogueCapabilityFact[]>> {
    if (this.shouldFail) {
      return { ok: false, code: 'persistence_error' };
    }

    return { ok: true, data: this.facts.get(offeringId) ?? [] };
  }

  async listSourcesByProvider(
    providerId: AiVideoProvider,
  ): Promise<ProviderCatalogueRepositoryResult<CatalogueSource[]>> {
    if (this.shouldFail) {
      return { ok: false, code: 'persistence_error' };
    }

    return { ok: true, data: this.sources.get(providerId) ?? [] };
  }
}

function seedFromDeterministicCatalogue(repository: FakeProviderCatalogueRepository) {
  const catalogue = buildDeterministicRecommendationCatalogue();
  for (const provider of catalogue.providers) {
    repository.seedProvider(provider);
  }
  for (const offering of catalogue.offerings) {
    repository.seedOffering(offering);
  }
  for (const [offeringId, facts] of Object.entries(catalogue.factsByOfferingId)) {
    repository.seedFacts(offeringId, facts);
  }
  for (const [providerId, sources] of Object.entries(catalogue.sourcesByProviderId)) {
    repository.seedSources(providerId as AiVideoProvider, sources);
  }
}

function buildProject(overrides: Partial<ProjectRecord> = {}): ProjectRecord {
  return {
    id: projectId,
    ownerId: ownerA,
    title: 'Summer Launch',
    description: 'Campaign project',
    archivedAt: null,
    createdAt: COMPLETED_AT,
    updatedAt: COMPLETED_AT,
    ...overrides,
  };
}

function buildCompletedBrief(overrides: Partial<PartialVideoBriefDraft> = {}): PartialVideoBriefDraft {
  return {
    id: briefId,
    projectId,
    sourceType: 'idea',
    sourceText: 'A compelling summer product launch concept for urban professionals.',
    sourceUrl: null,
    workingTitle: 'Summer Launch',
    objective: 'Showcase the new product line.',
    targetAudience: 'Urban professionals aged 25-35',
    publishingDestination: 'youtube',
    aspectRatio: '16:9',
    videoCategory: 'product_advertisement',
    durationSeconds: 30,
    visualStyle: 'Cinematic',
    tone: 'Upbeat',
    productionRequirements: {
      ...createDefaultProductionRequirements(),
      voiceover: true,
      dialogue: true,
      characterConsistency: true,
    },
    budgetPriority: 'balanced',
    qualityPriority: 'highest_quality',
    userConstraints: null,
    completedAt: COMPLETED_AT,
    createdAt: COMPLETED_AT,
    updatedAt: COMPLETED_AT,
    ...overrides,
  };
}

function createComposer(options?: {
  snapshot?: ReturnType<typeof buildIntelligenceSnapshot>;
  fixture?: typeof mockResultWorkspaceFixture;
  workspaceResult?: PersistenceResult<WorkspaceIntelligenceSnapshot>;
  cloneOnRead?: boolean;
}) {
  const projectRepository = new FakeProjectRepository();
  const briefRepository = new FakeVideoBriefRepository();
  const providerCatalogueRepository = new FakeProviderCatalogueRepository();
  const workspaceRepository = new StubWorkspaceRepository({
    snapshot: options?.snapshot,
    result: options?.workspaceResult,
    cloneOnRead: options?.cloneOnRead,
  });

  seedFromDeterministicCatalogue(providerCatalogueRepository);
  projectRepository.seed(buildProject());
  briefRepository.seed(buildCompletedBrief());

  const service = createWorkspaceComposerService({
    workspaceRepository,
    projectRepository,
    briefRepository,
    providerCatalogueRepository,
    staticFixture: options?.fixture ?? mockResultWorkspaceFixture,
  });

  return {
    service,
    projectRepository,
    briefRepository,
    providerCatalogueRepository,
    workspaceRepository,
  };
}

describe('WorkspaceComposerService', () => {
  it('returns hybrid_preview when the intelligence bundle has no analysis', async () => {
    const { service } = createComposer();

    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mode).toBe('hybrid_preview');
      expect(result.data.analysis).toBeNull();
      expect(result.data.intelligence.analysisId).toBeNull();
    }
  });

  it('returns analysis_available when the bundle includes analysis', async () => {
    const analysis = structuredClone(validReferenceVideoAnalysisFixture);
    const { service } = createComposer({
      snapshot: buildIntelligenceSnapshot({ analysis, activeJobState: 'analyzing' }),
    });

    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mode).toBe('analysis_available');
      expect(result.data.analysis).not.toBeNull();
      expect(result.data.analysis?.summary.referenceKind).toBe('youtube_url');
      expect(result.data.intelligence.analysisId).toBe(analysis.analysisId);
      expect(result.data.intelligence.referenceId).toBe(analysis.referenceId);
      expect(result.data.intelligence.activeJobState).toBe('analyzing');
    }
  });

  it('keeps mapper presentation-neutral for analysis metadata', async () => {
    const analysis = structuredClone(validReferenceVideoAnalysisFixture);
    const { service } = createComposer({
      snapshot: buildIntelligenceSnapshot({ analysis }),
    });

    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.analysis?.metadata.platform).toBe('youtube');
      expect(result.data.analysis?.metadata.referenceKind).toBe('youtube_url');
    }
  });

  it('runs hybrid engines alongside persisted analysis', async () => {
    const { service } = createComposer({
      snapshot: buildIntelligenceSnapshot({
        analysis: structuredClone(validReferenceVideoAnalysisFixture),
      }),
    });

    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sceneDecomposition.scenes.length).toBeGreaterThan(0);
      expect(result.data.providerRecommendation.algorithmVersion).toBe('provider-recommendation-v1');
      expect(result.data.complexityRiskAssessment.complexity.score).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns brief_required when no brief exists', async () => {
    const { briefRepository, service, workspaceRepository } = createComposer();
    briefRepository.delete(projectId);

    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('brief_required');
    }
    expect(workspaceRepository.calls).toHaveLength(0);
  });

  it('returns brief_required when the brief is incomplete', async () => {
    const { briefRepository, service, workspaceRepository } = createComposer();
    briefRepository.seed(buildCompletedBrief({ completedAt: null }));

    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('brief_required');
    }
    expect(workspaceRepository.calls).toHaveLength(0);
  });

  it('returns not_found for invalid project ids', async () => {
    const { service } = createComposer();
    const result = await service.loadWorkspace(ownerA, 'not-a-uuid');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('not_found');
    }
  });

  it('returns not_found when the project owner does not match', async () => {
    const { service } = createComposer();
    const result = await service.loadWorkspace(ownerB, projectId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('not_found');
    }
  });

  it('falls back invalid section input to overview', async () => {
    const { service } = createComposer();
    const result = await service.loadWorkspace(ownerA, projectId, 'not-a-section');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.activeSection).toBe('overview');
    }
  });

  it('preserves a valid section input', async () => {
    const { service } = createComposer();
    const result = await service.loadWorkspace(ownerA, projectId, 'prompts');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.activeSection).toBe('prompts');
    }
  });

  it('does not mutate the intelligence bundle snapshot', async () => {
    const snapshot = buildIntelligenceSnapshot({
      analysis: structuredClone(validReferenceVideoAnalysisFixture),
      activeJobState: 'analyzing',
    });
    const snapshotCopy = structuredClone(snapshot);
    const { service } = createComposer({ snapshot, cloneOnRead: false });

    await service.loadWorkspace(ownerA, projectId);

    expect(snapshot).toEqual(snapshotCopy);
  });

  it('invokes getIntelligenceBundle exactly once per successful load', async () => {
    const { service, workspaceRepository } = createComposer();
    const bundleSpy = vi.spyOn(workspaceRepository, 'getIntelligenceBundle');

    await service.loadWorkspace(ownerA, projectId);

    expect(bundleSpy).toHaveBeenCalledTimes(1);
    expect(bundleSpy).toHaveBeenCalledWith({
      ownerId: ownerA,
      projectId,
    });
  });

  it('limits pivot intelligence reads to a single getIntelligenceBundle call', async () => {
    const snapshot = buildIntelligenceSnapshot();
    const getIntelligenceBundle = vi
      .fn<WorkspaceRepository['getIntelligenceBundle']>()
      .mockResolvedValue({ ok: true, data: snapshot });
    const workspaceRepository: WorkspaceRepository = { getIntelligenceBundle };
    const projectRepository = new FakeProjectRepository();
    const briefRepository = new FakeVideoBriefRepository();
    const providerCatalogueRepository = new FakeProviderCatalogueRepository();

    seedFromDeterministicCatalogue(providerCatalogueRepository);
    projectRepository.seed(buildProject());
    briefRepository.seed(buildCompletedBrief());

    const service = createWorkspaceComposerService({
      workspaceRepository,
      projectRepository,
      briefRepository,
      providerCatalogueRepository,
      staticFixture: mockResultWorkspaceFixture,
    });

    await service.loadWorkspace(ownerA, projectId);

    expect(getIntelligenceBundle).toHaveBeenCalledTimes(1);
    expect(getIntelligenceBundle).toHaveBeenCalledWith({
      ownerId: ownerA,
      projectId,
    });
  });

  it('maps workspace repository failures to persistence_error', async () => {
    const { service } = createComposer({
      workspaceResult: { ok: false, code: 'persistence_error' },
    });

    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('persistence_error');
    }
  });

  it('maps invalid static fixture data to invalid_fixture', async () => {
    const invalidFixture = {
      ...mockResultWorkspaceFixture,
      samplePromptSections: mockResultWorkspaceFixture.samplePromptSections.slice(0, 2),
    };
    const { service } = createComposer({ fixture: invalidFixture });
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('invalid_fixture');
    }
  });

  it('does not perform external requests', () => {
    const serviceSource = WorkspaceComposerService.toString();
    expect(serviceSource).not.toContain('fetch(');
    expect(serviceSource).not.toContain('axios');
  });

  it('does not import PP-10 analysis modules', async () => {
    const composerModule = await import('../../src/server/workspace/workspace-composer-service.js');
    const source = composerModule.WorkspaceComposerService.toString();
    expect(source).not.toContain('CoreAnalysisCoordinator');
    expect(source).not.toContain('MockAnalysisProvider');
    expect(source).not.toContain('CacheCoordinator');
  });
});
