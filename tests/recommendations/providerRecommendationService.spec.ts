import { describe, expect, it, vi } from 'vitest';
import type { AiVideoProvider } from '../../src/domain/constants.js';
import { calculateComplexityRiskAssessment } from '../../src/domain/complexityRiskAssessment.js';
import type {
  CatalogueCapabilityFact,
  CatalogueOffering,
  CatalogueProvider,
  CatalogueSource,
} from '../../src/domain/providerCatalogue.js';
import { createDefaultProductionRequirements } from '../../src/domain/productionRequirements.js';
import { decomposeDurationIntoScenes } from '../../src/domain/sceneDecomposition.js';
import type { PartialVideoBriefDraft } from '../../src/domain/videoBriefDraft.js';
import type {
  ProviderCatalogueRepository,
  ProviderCatalogueRepositoryResult,
} from '../../src/server/providers/provider-catalogue-repository.js';
import {
  ProviderRecommendationService,
  createProviderRecommendationService,
} from '../../src/server/recommendations/provider-recommendation-service.js';
import {
  FIXTURE_IDS,
  OFFICIAL_URLS,
  buildDeterministicRecommendationCatalogue,
  buildSunsettingSoraFixture,
  factRecord,
  offeringRecord,
  providerRecord,
  sourceRecord,
} from './catalogueFixtures.js';

const COMPLETED_AT = '2026-07-04T12:00:00+00:00';

function buildBrief(overrides: Partial<PartialVideoBriefDraft> = {}): PartialVideoBriefDraft {
  return {
    id: '44444444-4444-4444-4444-444444444444',
    projectId: '33333333-3333-3333-3333-333333333333',
    sourceType: 'idea',
    sourceText: 'A compelling summer product launch concept with secret brief text.',
    sourceUrl: 'https://example.com/product-page',
    workingTitle: 'Summer Launch',
    objective: 'Showcase the new product line.',
    targetAudience: 'Urban professionals',
    publishingDestination: 'youtube',
    aspectRatio: '16:9',
    videoCategory: 'product_advertisement',
    durationSeconds: 30,
    visualStyle: 'Cinematic',
    tone: 'Upbeat',
    productionRequirements: createDefaultProductionRequirements(),
    budgetPriority: 'balanced',
    qualityPriority: 'highest_quality',
    userConstraints: null,
    completedAt: COMPLETED_AT,
    createdAt: COMPLETED_AT,
    updatedAt: COMPLETED_AT,
    ...overrides,
  };
}

function buildComplexityAssessment(brief: PartialVideoBriefDraft) {
  const decomposition = decomposeDurationIntoScenes(brief.durationSeconds ?? 30);
  return calculateComplexityRiskAssessment({
    durationSeconds: brief.durationSeconds ?? 30,
    sceneCount: decomposition.scenes.length,
    sourceType: brief.sourceType ?? 'idea',
    userConstraints: brief.userConstraints ?? null,
    productionRequirements: {
      ...createDefaultProductionRequirements(),
      ...(brief.productionRequirements ?? {}),
    },
  });
}

class FakeProviderCatalogueRepository implements ProviderCatalogueRepository {
  private providers = new Map<AiVideoProvider, CatalogueProvider>();
  private offerings = new Map<string, CatalogueOffering>();
  private facts = new Map<string, CatalogueCapabilityFact[]>();
  private sources = new Map<AiVideoProvider, CatalogueSource[]>();
  private shouldFail = false;
  private returnEmptyProviders = false;

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

  setReturnEmptyProviders(value: boolean) {
    this.returnEmptyProviders = value;
  }

  async listProviders(): Promise<ProviderCatalogueRepositoryResult<CatalogueProvider[]>> {
    if (this.shouldFail) {
      return { ok: false, code: 'persistence_error' };
    }
    if (this.returnEmptyProviders) {
      return { ok: true, data: [] };
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

function buildServiceInput(brief: PartialVideoBriefDraft) {
  const decomposition = decomposeDurationIntoScenes(brief.durationSeconds ?? 30);
  return {
    brief,
    sceneDecomposition: decomposition,
    complexityRiskAssessment: buildComplexityAssessment(brief),
  };
}

describe('ProviderRecommendationService', () => {
  it('1. valid completed brief and catalogue succeed', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const service = createProviderRecommendationService(repository);
    const result = await service.recommendForCompletedBrief(buildServiceInput(buildBrief()));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.algorithmVersion).toBe('provider-recommendation-v1');
      expect(result.data.origin).toBe('deterministic_evidence_engine');
    }
  });

  it('2. draft brief returns brief_required', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const service = new ProviderRecommendationService(repository);
    const result = await service.recommendForCompletedBrief(
      buildServiceInput(buildBrief({ completedAt: null })),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('brief_required');
    }
  });

  it('3. missing completion timestamp returns brief_required', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const service = new ProviderRecommendationService(repository);
    const brief = buildBrief();
    brief.completedAt = undefined;
    const result = await service.recommendForCompletedBrief(buildServiceInput(brief));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('brief_required');
    }
  });

  it('4. invalid catalogue maps safely', async () => {
    const repository = new FakeProviderCatalogueRepository();
    repository.setReturnEmptyProviders(true);
    const service = new ProviderRecommendationService(repository);
    const result = await service.recommendForCompletedBrief(buildServiceInput(buildBrief()));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('catalogue_invalid');
    }
  });

  it('5. missing catalogue maps safely', async () => {
    const repository = new FakeProviderCatalogueRepository();
    repository.setShouldFail(true);
    const service = new ProviderRecommendationService(repository);
    const result = await service.recommendForCompletedBrief(buildServiceInput(buildBrief()));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('catalogue_unavailable');
    }
  });

  it('6. scene duration needs use decomposition', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const service = new ProviderRecommendationService(repository);
    const brief = buildBrief({ durationSeconds: 45 });
    const decomposition = decomposeDurationIntoScenes(45);
    const maxSceneDuration = Math.max(...decomposition.scenes.map((scene) => scene.durationSeconds));

    const result = await service.recommendForCompletedBrief({
      brief,
      sceneDecomposition: decomposition,
      complexityRiskAssessment: buildComplexityAssessment(brief),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const durationNeed = result.data.requestedNeeds.find(
        (need) => need.key === 'maximum_scene_duration',
      );
      expect(durationNeed?.rationale).toContain(`${maxSceneDuration} seconds`);
    }
  });

  it('7. complexity score does not directly alter fit score', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const service = new ProviderRecommendationService(repository);
    const brief = buildBrief({
      productionRequirements: {
        ...createDefaultProductionRequirements(),
        lipSync: true,
        dialogue: true,
      },
    });
    const decomposition = decomposeDurationIntoScenes(30);
    const lowComplexity = calculateComplexityRiskAssessment({
      durationSeconds: 30,
      sceneCount: decomposition.scenes.length,
      sourceType: 'idea',
      userConstraints: null,
      productionRequirements: createDefaultProductionRequirements(),
    });
    const highComplexity = buildComplexityAssessment(brief);

    const baseline = await service.recommendForCompletedBrief({
      brief: buildBrief(),
      sceneDecomposition: decomposition,
      complexityRiskAssessment: lowComplexity,
    });
    const varied = await service.recommendForCompletedBrief({
      brief: buildBrief(),
      sceneDecomposition: decomposition,
      complexityRiskAssessment: highComplexity,
    });

    expect(baseline.ok).toBe(true);
    expect(varied.ok).toBe(true);
    if (baseline.ok && varied.ok) {
      expect(baseline.data.primaryRecommendation?.evidenceBackedFitScore).toBe(
        varied.data.primaryRecommendation?.evidenceBackedFitScore,
      );
    }
  });

  it('8. execution-risk score does not directly alter fit score', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const service = new ProviderRecommendationService(repository);
    const decomposition = decomposeDurationIntoScenes(30);
    const minimal = calculateComplexityRiskAssessment({
      durationSeconds: 30,
      sceneCount: decomposition.scenes.length,
      sourceType: 'idea',
      userConstraints: null,
      productionRequirements: createDefaultProductionRequirements(),
    });
    const heavy = calculateComplexityRiskAssessment({
      durationSeconds: 30,
      sceneCount: decomposition.scenes.length,
      sourceType: 'idea',
      userConstraints: null,
      productionRequirements: {
        ...createDefaultProductionRequirements(),
        exactTextVisibility: true,
        logoAccuracy: true,
        lipSync: true,
      },
    });

    const minimalResult = await service.recommendForCompletedBrief({
      brief: buildBrief(),
      sceneDecomposition: decomposition,
      complexityRiskAssessment: minimal,
    });
    const heavyResult = await service.recommendForCompletedBrief({
      brief: buildBrief(),
      sceneDecomposition: decomposition,
      complexityRiskAssessment: heavy,
    });

    expect(minimalResult.ok).toBe(true);
    expect(heavyResult.ok).toBe(true);
    if (minimalResult.ok && heavyResult.ok) {
      expect(minimalResult.data.alternatives.map((item) => item.providerId)).toEqual(
        heavyResult.data.alternatives.map((item) => item.providerId),
      );
    }
  });

  it('9. provider lifecycle affects eligibility', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const sora = buildSunsettingSoraFixture();
    repository.seedProvider(sora.provider);
    repository.seedOffering(sora.offering);
    repository.seedFacts(sora.offering.id, sora.facts);
    repository.seedSources('openai_sora', [sora.source]);

    const service = new ProviderRecommendationService(repository);
    const result = await service.recommendForCompletedBrief(buildServiceInput(buildBrief()));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.ineligible.some((candidate) => candidate.providerId === 'openai_sora')).toBe(
        true,
      );
    }
  });

  it('10. offering lifecycle affects eligibility', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const { offeringId } = FIXTURE_IDS.runway;
    repository.seedOffering(
      offeringRecord(offeringId, 'runway', {
        id: offeringId,
        lifecycleStatus: 'deprecated',
        recommendationEligible: false,
      }),
    );

    const service = new ProviderRecommendationService(repository);
    const result = await service.recommendForCompletedBrief(buildServiceInput(buildBrief()));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.ineligible.some((candidate) => candidate.offeringId === offeringId)).toBe(true);
    }
  });

  it('11. Sora sunsetting excludes normal recommendation', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const service = new ProviderRecommendationService(repository);
    const result = await service.recommendForCompletedBrief(buildServiceInput(buildBrief()));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const ranked = [
        result.data.primaryRecommendation,
        ...result.data.leadingAlternatives,
        ...result.data.alternatives,
      ]
        .filter((candidate) => candidate !== null)
        .map((candidate) => candidate.providerId);
      expect(ranked).not.toContain('openai_sora');
    }
  });

  it('12. provider catalogue ordering does not alter result', async () => {
    const repositoryA = new FakeProviderCatalogueRepository();
    const repositoryB = new FakeProviderCatalogueRepository();
    const catalogue = buildDeterministicRecommendationCatalogue();

    for (const provider of catalogue.providers) {
      repositoryA.seedProvider(provider);
      repositoryB.seedProvider(provider);
    }
    for (const offering of catalogue.offerings) {
      repositoryA.seedOffering(offering);
      repositoryB.seedOffering(offering);
    }
    for (const [offeringId, facts] of Object.entries(catalogue.factsByOfferingId)) {
      repositoryA.seedFacts(offeringId, facts);
      repositoryB.seedFacts(offeringId, facts);
    }
    for (const [providerId, sources] of Object.entries(catalogue.sourcesByProviderId)) {
      repositoryA.seedSources(providerId as AiVideoProvider, sources);
      repositoryB.seedSources(providerId as AiVideoProvider, [...sources].reverse());
    }

    const serviceA = new ProviderRecommendationService(repositoryA);
    const serviceB = new ProviderRecommendationService(repositoryB);
    const input = buildServiceInput(buildBrief());
    const resultA = await serviceA.recommendForCompletedBrief(input);
    const resultB = await serviceB.recommendForCompletedBrief(input);

    expect(resultA.ok).toBe(true);
    expect(resultB.ok).toBe(true);
    if (resultA.ok && resultB.ok) {
      expect(resultA.data.recommendationStatus).toBe(resultB.data.recommendationStatus);
      expect(resultA.data.primaryRecommendation?.providerId).toBe(
        resultB.data.primaryRecommendation?.providerId,
      );
    }
  });

  it('13. provider facts do not mutate', async () => {
    const repository = new FakeProviderCatalogueRepository();
    const catalogue = seedFromDeterministicCatalogue(repository);
    const snapshot = structuredClone(catalogue.factsByOfferingId);
    const service = new ProviderRecommendationService(repository);
    await service.recommendForCompletedBrief(buildServiceInput(buildBrief()));
    expect(catalogue.factsByOfferingId).toEqual(snapshot);
  });

  it('14. brief does not mutate', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const service = new ProviderRecommendationService(repository);
    const brief = buildBrief();
    const snapshot = structuredClone(brief);
    await service.recommendForCompletedBrief(buildServiceInput(brief));
    expect(brief).toEqual(snapshot);
  });

  it('15. scene decomposition does not mutate', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const service = new ProviderRecommendationService(repository);
    const decomposition = decomposeDurationIntoScenes(30);
    const snapshot = structuredClone(decomposition);
    await service.recommendForCompletedBrief({
      brief: buildBrief(),
      sceneDecomposition: decomposition,
      complexityRiskAssessment: buildComplexityAssessment(buildBrief()),
    });
    expect(decomposition).toEqual(snapshot);
  });

  it('16. no repository write occurs', () => {
    const source = ProviderRecommendationService.prototype.recommendForCompletedBrief.toString();
    expect(source).not.toContain('.insert(');
    expect(source).not.toContain('.update(');
    expect(source).not.toContain('.delete(');
  });

  it('17. no external request occurs', () => {
    const source = createProviderRecommendationService.toString();
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('axios');
  });

  it('18. no provider SDK is used', () => {
    const source = createProviderRecommendationService.toString();
    expect(source.toLowerCase()).not.toContain('openai');
    expect(source.toLowerCase()).not.toContain('runway');
  });

  it('19. output is deterministic', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const service = new ProviderRecommendationService(repository);
    const input = buildServiceInput(buildBrief());
    const first = await service.recommendForCompletedBrief(input);
    const second = await service.recommendForCompletedBrief(input);
    expect(first).toEqual(second);
  });

  it('20. raw user text is not copied into recommendation explanations', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const service = new ProviderRecommendationService(repository);
    const secret = 'SECRET_BRIEF_TEXT_SHOULD_NOT_APPEAR';
    const result = await service.recommendForCompletedBrief(
      buildServiceInput(buildBrief({ sourceText: secret })),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.stringify(result.data)).not.toContain(secret);
    }
  });

  it('21. source URLs are not fetched', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fetch should not run'));
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const service = new ProviderRecommendationService(repository);
    const result = await service.recommendForCompletedBrief(buildServiceInput(buildBrief()));
    expect(result.ok).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('22. safe insufficiency result is possible', async () => {
    const repository = new FakeProviderCatalogueRepository();
    const providerId: AiVideoProvider = 'google_veo';
    const { offeringId, sourceId, factId } = FIXTURE_IDS.google_veo;
    repository.seedProvider(providerRecord(providerId));
    repository.seedOffering(offeringRecord(offeringId, providerId, { id: offeringId }));
    repository.seedSources(providerId, [
      sourceRecord(sourceId, providerId, OFFICIAL_URLS.google_veo, { id: sourceId, offeringId }),
    ]);
    repository.seedFacts(offeringId, [factRecord(factId, offeringId, sourceId, { id: factId })]);

    const service = new ProviderRecommendationService(repository);
    const result = await service.recommendForCompletedBrief(buildServiceInput(buildBrief()));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(['insufficient_evidence', 'no_eligible_candidate', 'close_alternatives']).toContain(
        result.data.recommendationStatus,
      );
    }
  });

  it('23. safe no-eligible result is possible', async () => {
    const repository = new FakeProviderCatalogueRepository();
    const providerId: AiVideoProvider = 'google_veo';
    const { offeringId, sourceId, factId } = FIXTURE_IDS.google_veo;
    repository.seedProvider(
      providerRecord(providerId, {
        lifecycleStatus: 'unavailable',
        recommendationEligible: false,
      }),
    );
    repository.seedOffering(
      offeringRecord(offeringId, providerId, {
        id: offeringId,
        lifecycleStatus: 'unavailable',
        recommendationEligible: false,
      }),
    );
    repository.seedSources(providerId, [
      sourceRecord(sourceId, providerId, OFFICIAL_URLS.google_veo, { id: sourceId, offeringId }),
    ]);
    repository.seedFacts(offeringId, [factRecord(factId, offeringId, sourceId, { id: factId })]);

    const service = new ProviderRecommendationService(repository);
    const result = await service.recommendForCompletedBrief(buildServiceInput(buildBrief()));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.recommendationStatus).toBe('no_eligible_candidate');
    }
  });

  it('24. supporting services are separate from primary ranking', async () => {
    const repository = new FakeProviderCatalogueRepository();
    seedFromDeterministicCatalogue(repository);
    const service = new ProviderRecommendationService(repository);
    const result = await service.recommendForCompletedBrief(
      buildServiceInput(
        buildBrief({
          productionRequirements: {
            ...createDefaultProductionRequirements(),
            lipSync: true,
          },
        }),
      ),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const supporting of result.data.supportingServices) {
        expect(supporting.tier).toBe('supporting_service');
        const rankedIds = [
          result.data.primaryRecommendation,
          ...result.data.leadingAlternatives,
          ...result.data.alternatives,
        ]
          .filter((candidate) => candidate !== null)
          .map((candidate) => candidate.offeringId);
        expect(rankedIds).not.toContain(supporting.offeringId);
      }
    }
  });
});
