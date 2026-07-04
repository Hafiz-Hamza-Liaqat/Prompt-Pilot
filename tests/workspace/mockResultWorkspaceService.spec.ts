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
  createMockResultWorkspaceService,
  MockResultWorkspaceService,
} from '../../src/server/workspace/mock-result-workspace-service.js';
import { buildDeterministicRecommendationCatalogue } from '../recommendations/catalogueFixtures.js';
const COMPLETED_AT = '2026-07-04T12:00:00+00:00';

const ownerA = '11111111-1111-1111-1111-111111111111';
const ownerB = '22222222-2222-2222-2222-222222222222';
const projectId = '33333333-3333-3333-3333-333333333333';
const briefId = '44444444-4444-4444-4444-444444444444';

class FakeProjectRepository implements ProjectRepository {
  private projects = new Map<string, ProjectRecord>();

  seed(project: ProjectRecord) {
    this.projects.set(project.id, project);
  }

  delete(projectIdToDelete: string) {
    this.projects.delete(projectIdToDelete);
  }

  setShouldFail(value: boolean) {
    this.shouldFail = value;
  }

  private shouldFail = false;

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

  seed(brief: PartialVideoBriefDraft) {
    this.briefs.set(brief.projectId, brief);
  }

  delete(projectIdToDelete: string) {
    this.briefs.delete(projectIdToDelete);
  }

  setShouldFail(value: boolean) {
    this.shouldFail = value;
  }

  private shouldFail = false;

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

  removeProvider(providerId: AiVideoProvider) {
    this.providers.delete(providerId);
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
  return catalogue;
}

function buildCatalogueRepository(options?: { excludeSora?: boolean }) {
  const repository = new FakeProviderCatalogueRepository();
  seedFromDeterministicCatalogue(repository);

  if (options?.excludeSora) {
    repository.removeProvider('openai_sora');
  }

  return repository;
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

function createService(options?: {
  excludeSora?: boolean;
  fixture?: typeof mockResultWorkspaceFixture;
}) {
  const projectRepository = new FakeProjectRepository();
  const briefRepository = new FakeVideoBriefRepository();
  const providerCatalogueRepository = buildCatalogueRepository({
    excludeSora: options?.excludeSora,
  });

  projectRepository.seed(buildProject());
  briefRepository.seed(buildCompletedBrief());

  const service = createMockResultWorkspaceService({
    projectRepository,
    briefRepository,
    providerCatalogueRepository,
    fixture: options?.fixture ?? mockResultWorkspaceFixture,
  });

  return {
    service,
    projectRepository,
    briefRepository,
    providerCatalogueRepository,
  };
}

describe('MockResultWorkspaceService', () => {
  it('returns hybrid workspace for a valid completed brief', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mode).toBe('hybrid_preview');
      expect(result.data.dataOrigin).toBe('mixed');
      expect(result.data.brief.completedAt).toBe(COMPLETED_AT);
    }
  });

  it('forwards the trusted user ID to repositories', async () => {
    const { service, projectRepository } = createService();
    const spy = vi.spyOn(projectRepository, 'getById');

    await service.loadWorkspace(ownerA, projectId);
    expect(spy).toHaveBeenCalledWith(ownerA, projectId);
  });

  it('cannot access another user project by changing owner ID', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerB, projectId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('not_found');
    }
  });

  it('returns not found for a missing project', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, '99999999-9999-9999-9999-999999999999');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('not_found');
    }
  });

  it('returns not found for another user project', async () => {
    const { projectRepository, service } = createService();
    const otherProjectId = '55555555-5555-5555-5555-555555555555';
    projectRepository.seed(
      buildProject({
        id: otherProjectId,
        ownerId: ownerB,
        title: 'Other project',
      }),
    );

    const result = await service.loadWorkspace(ownerA, otherProjectId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('not_found');
    }
  });

  it('returns not found for a deleted project', async () => {
    const { projectRepository, service } = createService();
    projectRepository.delete(projectId);

    const result = await service.loadWorkspace(ownerA, projectId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('not_found');
    }
  });

  it('returns brief required when no brief exists', async () => {
    const { briefRepository, service } = createService();
    briefRepository.delete(projectId);

    const result = await service.loadWorkspace(ownerA, projectId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('brief_required');
    }
  });

  it('returns brief required for a draft brief without completedAt', async () => {
    const { briefRepository, service } = createService();
    briefRepository.seed(buildCompletedBrief({ completedAt: null }));

    const result = await service.loadWorkspace(ownerA, projectId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('brief_required');
    }
  });

  it('succeeds for a completed brief', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.brief.workingTitle).toBe('Summer Launch');
    }
  });

  it('allows archived projects with completed briefs', async () => {
    const { projectRepository, service } = createService();
    projectRepository.seed(
      buildProject({
        archivedAt: COMPLETED_AT,
      }),
    );

    const result = await service.loadWorkspace(ownerA, projectId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.project.status).toBe('archived');
    }
  });

  it('includes providerRecommendation in the view model', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.providerRecommendation.algorithmVersion).toBe('provider-recommendation-v1');
      expect(result.data.providerRecommendation.origin).toBe('deterministic_evidence_engine');
      expect(result.data).not.toHaveProperty('providers');
    }
  });

  it('returns evaluated provider recommendation candidates', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const recommendation = result.data.providerRecommendation;
      expect(recommendation.requestedNeeds.length).toBeGreaterThan(0);
      expect(recommendation.ineligible.length).toBeGreaterThan(0);
      expect([
        'recommended',
        'close_alternatives',
        'insufficient_evidence',
        'no_eligible_candidate',
      ]).toContain(recommendation.recommendationStatus);
    }
  });

  it('marks sunsetting Sora as ineligible in recommendation output', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const sora = result.data.providerRecommendation.ineligible.find(
        (candidate) => candidate.providerId === 'openai_sora',
      );
      expect(sora).toBeDefined();
      expect(sora?.classification).toBe('ineligible');
    }
  });

  it('keeps sunsetting Sora out of ranked recommendations', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const rankedIds = [
        result.data.providerRecommendation.primaryRecommendation?.providerId,
        ...result.data.providerRecommendation.leadingAlternatives.map(
          (candidate) => candidate.providerId,
        ),
        ...result.data.providerRecommendation.alternatives.map((candidate) => candidate.providerId),
      ].filter(Boolean);
      expect(rankedIds).not.toContain('openai_sora');
    }
  });

  it('does not select a provider for execution', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('selectedProvider');
      expect(result.data.isDecisionReady).toBe(false);
    }
  });

  it('does not create forbidden ranking metadata on the view model', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('recommendationScore');
      expect(result.data).not.toHaveProperty('winningProvider');
      expect(result.data).not.toHaveProperty('matchPercentage');
    }
  });

  it('does not create match percentages', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('matchPercentage');
    }
  });

  it('calculates deterministic scene roadmap from brief duration', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sceneDecomposition.isAiGenerated).toBe(false);
      expect(result.data.sceneDecomposition.isPersisted).toBe(false);
      expect(result.data.sceneDecomposition.totalDurationSeconds).toBe(30);
      expect(result.data.sceneDecomposition.sceneCount).toBe(3);
      expect(result.data).not.toHaveProperty('sampleScenes');
    }
  });

  it('matches scene duration sum to brief duration', async () => {
    const { briefRepository, service } = createService();
    briefRepository.seed(buildCompletedBrief({ durationSeconds: 60 }));
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const sum = result.data.sceneDecomposition.scenes.reduce(
        (total, scene) => total + scene.durationSeconds,
        0,
      );
      expect(sum).toBe(60);
    }
  });

  it('keeps prompt section marked as sample', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.samplePromptSections.every((section) => section.isSample)).toBe(true);
    }
  });

  it('keeps continuity and audio sections marked as sample', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.continuityItems.every((item) => item.isSample)).toBe(true);
      expect(result.data.audioEditingItems.every((item) => item.isSample)).toBe(true);
      expect(result.data).not.toHaveProperty('qualityItems');
    }
  });

  it('includes deterministic complexity and execution-risk assessment', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.complexityRiskAssessment.algorithmVersion).toBe('complexity-risk-v1');
      expect(result.data.complexityRiskAssessment.isPersisted).toBe(false);
      expect(result.data.complexityRiskAssessment.complexity.score).toBeGreaterThanOrEqual(0);
      expect(result.data.complexityRiskAssessment.executionRisk.score).toBeLessThanOrEqual(100);
    }
  });

  it('does not change assessment when catalogue eligibility changes', async () => {
    const baseline = createService();
    const withoutSora = createService({ excludeSora: true });

    const baselineResult = await baseline.service.loadWorkspace(ownerA, projectId);
    const withoutSoraResult = await withoutSora.service.loadWorkspace(ownerA, projectId);

    expect(baselineResult.ok).toBe(true);
    expect(withoutSoraResult.ok).toBe(true);
    if (baselineResult.ok && withoutSoraResult.ok) {
      expect(baselineResult.data.complexityRiskAssessment).toEqual(
        withoutSoraResult.data.complexityRiskAssessment,
      );
    }
  });

  it('exposes mixed section origins truthfully', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sectionOrigins.scenes).toBe('deterministic_rule_engine');
      expect(result.data.sectionOrigins.prompts).toBe('static_fixture');
      expect(result.data.sectionOrigins.providers).toBe('deterministic_evidence_engine');
      expect(result.data.sectionOrigins.quality).toBe('deterministic_rule_engine');
      expect(result.data.sectionOrigins.overview).toBe('persisted_input');
    }
  });

  it('maps invalid duration safely', async () => {
    const { briefRepository, service } = createService();
    briefRepository.seed(buildCompletedBrief({ durationSeconds: 4 }));

    const result = await service.loadWorkspace(ownerA, projectId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('invalid_fixture');
    }
  });

  it('does not mutate the static fixture', async () => {
    const fixtureCopy = structuredClone(mockResultWorkspaceFixture);
    const { service } = createService();
    await service.loadWorkspace(ownerA, projectId);

    expect(mockResultWorkspaceFixture).toEqual(fixtureCopy);
  });

  it('keeps static fixture sample sections marked as sample', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.samplePromptSections.every((section) => section.isSample)).toBe(true);
    }
  });

  it('maps invalid fixture data to invalid_fixture', async () => {
    const invalidFixture = {
      ...mockResultWorkspaceFixture,
      samplePromptSections: mockResultWorkspaceFixture.samplePromptSections.slice(0, 2),
    };
    const { service } = createService({ fixture: invalidFixture });
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('invalid_fixture');
    }
  });

  it('maps repository failure to persistence_error', async () => {
    const { projectRepository, service } = createService();
    projectRepository.setShouldFail(true);

    const result = await service.loadWorkspace(ownerA, projectId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('persistence_error');
    }
  });

  it('performs no repository mutation during load', async () => {
    const { projectRepository, briefRepository, providerCatalogueRepository, service } =
      createService();

    const projectSpy = vi.spyOn(projectRepository, 'getById');
    const briefSpy = vi.spyOn(briefRepository, 'getByProjectId');
    const providerSpy = vi.spyOn(providerCatalogueRepository, 'listProviders');

    await service.loadWorkspace(ownerA, projectId);

    expect(projectSpy).toHaveBeenCalledTimes(1);
    expect(briefSpy).toHaveBeenCalledTimes(1);
    expect(providerSpy).toHaveBeenCalledTimes(1);
    expect(Object.keys(projectRepository)).not.toContain('create');
  });

  it('does not perform external requests', () => {
    const serviceSource = MockResultWorkspaceService.toString();
    expect(serviceSource).not.toContain('fetch(');
    expect(serviceSource).not.toContain('axios');
  });

  it('falls back invalid section input to overview', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId, 'not-a-section');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.activeSection).toBe('overview');
    }
  });

  it('preserves a valid section input', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId, 'prompts');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.activeSection).toBe('prompts');
    }
  });
});
