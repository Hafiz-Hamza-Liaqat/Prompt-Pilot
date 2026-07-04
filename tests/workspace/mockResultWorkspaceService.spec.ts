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

const VERIFIED_AT = '2026-07-04T12:00:00+00:00';
const REVIEW_DUE_AT = '2026-08-03T12:00:00+00:00';
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

function providerRecord(
  id: AiVideoProvider,
  overrides: Partial<CatalogueProvider> = {},
): CatalogueProvider {
  const defaults: Record<AiVideoProvider, Pick<CatalogueProvider, 'displayName' | 'vendorName'>> = {
    google_veo: { displayName: 'Google Veo', vendorName: 'Google' },
    openai_sora: { displayName: 'OpenAI Sora', vendorName: 'OpenAI' },
    runway: { displayName: 'Runway', vendorName: 'Runway' },
    kling: { displayName: 'Kling', vendorName: 'Kuaishou' },
    adobe_firefly: { displayName: 'Adobe Firefly', vendorName: 'Adobe' },
  };

  return {
    id,
    displayName: defaults[id].displayName,
    vendorName: defaults[id].vendorName,
    summary: `${defaults[id].displayName} summary for Prompt Pilot catalogue testing.`,
    lifecycleStatus: 'active',
    apiAccessStatus: 'public',
    recommendationEligible: true,
    sunsetAt: null,
    catalogueNotice: null,
    verifiedAt: VERIFIED_AT,
    reviewDueAt: REVIEW_DUE_AT,
    createdAt: VERIFIED_AT,
    updatedAt: VERIFIED_AT,
    ...overrides,
  };
}

function offeringRecord(
  id: string,
  providerId: AiVideoProvider,
  overrides: Partial<CatalogueOffering> = {},
): CatalogueOffering {
  return {
    id,
    providerId,
    offeringKey: `${providerId}-primary`,
    displayName: `${providerId} offering`,
    offeringType: 'model',
    ownershipType: 'first_party',
    officialIdentifier: `${providerId}-model`,
    summary: `${providerId} offering summary for Prompt Pilot catalogue testing.`,
    lifecycleStatus: 'active',
    apiAccessStatus: 'public',
    recommendationEligible: true,
    sunsetAt: null,
    verifiedAt: VERIFIED_AT,
    reviewDueAt: REVIEW_DUE_AT,
    createdAt: VERIFIED_AT,
    updatedAt: VERIFIED_AT,
    ...overrides,
  };
}

function sourceRecord(
  id: string,
  providerId: AiVideoProvider,
  url: string,
  overrides: Partial<CatalogueSource> = {},
): CatalogueSource {
  return {
    id,
    providerId,
    offeringId: null,
    sourceKind: 'developer_docs',
    title: `${providerId} official documentation`,
    url,
    publishedOrUpdatedAt: null,
    verifiedAt: VERIFIED_AT,
    createdAt: VERIFIED_AT,
    ...overrides,
  };
}

function factRecord(
  id: string,
  offeringId: string,
  sourceId: string,
  overrides: Partial<CatalogueCapabilityFact> = {},
): CatalogueCapabilityFact {
  return {
    id,
    offeringId,
    capabilityKey: 'text_to_video',
    supportLevel: 'supported',
    numericValue: null,
    textValue: null,
    structuredValue: null,
    evidenceSummary: 'Official documentation describes text-to-video generation.',
    limitationSummary: null,
    sourceId,
    verifiedAt: VERIFIED_AT,
    reviewDueAt: REVIEW_DUE_AT,
    createdAt: VERIFIED_AT,
    updatedAt: VERIFIED_AT,
    ...overrides,
  };
}

const fixtureIds: Record<
  AiVideoProvider,
  { offeringId: string; sourceId: string; factId: string }
> = {
  google_veo: {
    offeringId: 'a1000001-0001-4001-8001-000000000001',
    sourceId: 'b1000001-0001-4001-8001-000000000001',
    factId: 'c1000001-0001-4001-8001-000000000001',
  },
  openai_sora: {
    offeringId: 'a2000001-0001-4001-8001-000000000001',
    sourceId: 'b2000001-0001-4001-8001-000000000001',
    factId: 'c2000001-0001-4001-8001-000000000001',
  },
  runway: {
    offeringId: 'a3000001-0001-4001-8001-000000000001',
    sourceId: 'b3000001-0001-4001-8001-000000000001',
    factId: 'c3000001-0001-4001-8001-000000000001',
  },
  kling: {
    offeringId: 'a4000001-0001-4001-8001-000000000001',
    sourceId: 'b4000001-0001-4001-8001-000000000001',
    factId: 'c4000001-0001-4001-8001-000000000001',
  },
  adobe_firefly: {
    offeringId: 'a5000001-0001-4001-8001-000000000001',
    sourceId: 'b5000001-0001-4001-8001-000000000001',
    factId: 'c5000001-0001-4001-8001-000000000001',
  },
};

const officialUrls: Record<AiVideoProvider, string> = {
  google_veo: 'https://ai.google.dev/gemini-api/docs/veo',
  openai_sora: 'https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation',
  runway: 'https://docs.dev.runwayml.com/guides/using-the-api/',
  kling: 'https://app.klingai.com/global/dev/document-api/apiReference/model/textToVideo',
  adobe_firefly: 'https://developer.adobe.com/audio-video-firefly-services/',
};

function buildCatalogueRepository(options?: { sunsettingSora?: boolean }) {
  const repository = new FakeProviderCatalogueRepository();
  const providerIds: AiVideoProvider[] = [
    'google_veo',
    'openai_sora',
    'runway',
    'kling',
    'adobe_firefly',
  ];

  for (const providerId of providerIds) {
    const { offeringId, sourceId, factId } = fixtureIds[providerId];
    repository.seedProvider(
      providerRecord(providerId, {
        lifecycleStatus:
          options?.sunsettingSora && providerId === 'openai_sora' ? 'sunsetting' : 'active',
        catalogueNotice:
          options?.sunsettingSora && providerId === 'openai_sora'
            ? 'OpenAI Sora is sunsetting.'
            : null,
      }),
    );
    repository.seedOffering(
      offeringRecord(offeringId, providerId, {
        id: offeringId,
        offeringKey: providerId === 'adobe_firefly' ? 'reframe-api' : `${providerId}-primary`,
        offeringType: providerId === 'adobe_firefly' ? 'api_service' : 'model',
        officialIdentifier: providerId === 'adobe_firefly' ? null : `${providerId}-model`,
      }),
    );
    repository.seedSources(providerId, [
      sourceRecord(sourceId, providerId, officialUrls[providerId], {
        id: sourceId,
        offeringId,
      }),
    ]);
    repository.seedFacts(offeringId, [factRecord(factId, offeringId, sourceId, { id: factId })]);
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
  sunsettingSora?: boolean;
  fixture?: typeof mockResultWorkspaceFixture;
}) {
  const projectRepository = new FakeProjectRepository();
  const briefRepository = new FakeVideoBriefRepository();
  const providerCatalogueRepository = buildCatalogueRepository({
    sunsettingSora: options?.sunsettingSora,
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

  it('sorts providers alphabetically by display name', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.providers.map((provider) => provider.displayName)).toEqual([
        'Adobe Firefly',
        'Google Veo',
        'Kling',
        'OpenAI Sora',
        'Runway',
      ]);
    }
  });

  it('returns exactly five providers', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.providers).toHaveLength(5);
    }
  });

  it('preserves unknown catalogue lifecycle states without ranking', async () => {
    const { service } = createService({ sunsettingSora: true });
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const sora = result.data.providers.find((provider) => provider.id === 'openai_sora');
      expect(sora?.lifecycleStatus).toBe('sunsetting');
      expect(sora?.catalogueNotice).toBe('OpenAI Sora is sunsetting.');
    }
  });

  it('keeps sunsetting provider state visible', async () => {
    const { service } = createService({ sunsettingSora: true });
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(
        result.data.providers.some(
          (provider) =>
            provider.id === 'openai_sora' && provider.lifecycleStatus === 'sunsetting',
        ),
      ).toBe(true);
    }
  });

  it('does not select a provider', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('selectedProvider');
      expect(result.data.providers.every((provider) => provider.referenceState === 'catalogue_reference')).toBe(
        true,
      );
    }
  });

  it('does not create provider ranking metadata', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('recommendationScore');
      expect(result.data).not.toHaveProperty('winningProvider');
      for (const provider of result.data.providers) {
        expect(provider).not.toHaveProperty('rank');
        expect(provider).not.toHaveProperty('matchPercentage');
      }
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

  it('keeps continuity, audio, and quality sections marked as sample', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.continuityItems.every((item) => item.isSample)).toBe(true);
      expect(result.data.audioEditingItems.every((item) => item.isSample)).toBe(true);
      expect(result.data.qualityItems.every((item) => item.isSample)).toBe(true);
    }
  });

  it('exposes mixed section origins truthfully', async () => {
    const { service } = createService();
    const result = await service.loadWorkspace(ownerA, projectId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sectionOrigins.scenes).toBe('deterministic_rule_engine');
      expect(result.data.sectionOrigins.prompts).toBe('static_fixture');
      expect(result.data.sectionOrigins.providers).toBe('catalogue_snapshot');
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
