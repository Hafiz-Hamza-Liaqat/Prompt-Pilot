import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';
import { createDefaultProductionRequirements } from '@/domain/productionRequirements';
import type { SceneDecomposition } from '@/domain/sceneDecomposition';
import type { ComplexityRiskAssessment } from '@/domain/complexityRiskAssessment';
import {
  calculateProviderRecommendation,
  ProviderRecommendationResultSchema,
  type ProviderRecommendationResult,
} from '@/domain/providerRecommendationEngine';
import type {
  CatalogueCapabilityFact,
  CatalogueOffering,
  CatalogueProvider,
  CatalogueSource,
} from '@/domain/providerCatalogue';
import type { AiVideoProvider } from '@/domain/constants';
import type { ProviderCatalogueRepository } from '@/server/providers/provider-catalogue-repository';

export type ProviderRecommendationServiceErrorCode =
  | 'brief_required'
  | 'catalogue_unavailable'
  | 'catalogue_invalid'
  | 'insufficient_evidence'
  | 'recommendation_error';

export type ProviderRecommendationServiceResult =
  | { ok: true; data: ProviderRecommendationResult }
  | { ok: false; code: ProviderRecommendationServiceErrorCode };

export type ProviderRecommendationServiceInput = {
  brief: PartialVideoBriefDraft;
  sceneDecomposition: SceneDecomposition;
  complexityRiskAssessment: ComplexityRiskAssessment;
};

function isCompletedBrief(
  brief: PartialVideoBriefDraft,
): brief is PartialVideoBriefDraft & {
  completedAt: string;
  durationSeconds: number;
  aspectRatio: NonNullable<PartialVideoBriefDraft['aspectRatio']>;
  sourceType: NonNullable<PartialVideoBriefDraft['sourceType']>;
  productionRequirements: NonNullable<PartialVideoBriefDraft['productionRequirements']>;
} {
  return Boolean(
    brief.completedAt &&
      brief.durationSeconds &&
      brief.aspectRatio &&
      brief.sourceType &&
      brief.productionRequirements,
  );
}

async function loadCatalogue(
  repository: ProviderCatalogueRepository,
): Promise<
  | {
      ok: true;
      data: {
        providers: CatalogueProvider[];
        offerings: CatalogueOffering[];
        factsByOfferingId: Record<string, CatalogueCapabilityFact[]>;
        sourcesByProviderId: Record<AiVideoProvider, CatalogueSource[]>;
      };
    }
  | { ok: false; code: 'catalogue_unavailable' | 'catalogue_invalid' }
> {
  const providersResult = await repository.listProviders();

  if (!providersResult.ok) {
    return { ok: false, code: 'catalogue_unavailable' };
  }

  if (providersResult.data.length === 0) {
    return { ok: false, code: 'catalogue_invalid' };
  }

  const offerings: CatalogueOffering[] = [];
  const factsByOfferingId: Record<string, CatalogueCapabilityFact[]> = {};
  const sourcesByProviderId = {} as Record<AiVideoProvider, CatalogueSource[]>;

  for (const provider of providersResult.data) {
    const [offeringsResult, sourcesResult] = await Promise.all([
      repository.listOfferingsByProvider(provider.id),
      repository.listSourcesByProvider(provider.id),
    ]);

    if (!offeringsResult.ok || !sourcesResult.ok) {
      return { ok: false, code: 'catalogue_unavailable' };
    }

    sourcesByProviderId[provider.id] = sourcesResult.data;

    for (const offering of offeringsResult.data) {
      offerings.push(offering);

      const factsResult = await repository.listCapabilityFactsByOffering(offering.id);

      if (!factsResult.ok) {
        return { ok: false, code: 'catalogue_unavailable' };
      }

      factsByOfferingId[offering.id] = factsResult.data;
    }
  }

  return {
    ok: true,
    data: {
      providers: providersResult.data,
      offerings,
      factsByOfferingId,
      sourcesByProviderId,
    },
  };
}

export class ProviderRecommendationService {
  constructor(private readonly repository: ProviderCatalogueRepository) {}

  async recommendForCompletedBrief(
    input: ProviderRecommendationServiceInput,
  ): Promise<ProviderRecommendationServiceResult> {
    void input.complexityRiskAssessment;

    if (!isCompletedBrief(input.brief)) {
      return { ok: false, code: 'brief_required' };
    }

    const catalogueResult = await loadCatalogue(this.repository);

    if (!catalogueResult.ok) {
      return { ok: false, code: catalogueResult.code };
    }

    try {
      const recommendation = calculateProviderRecommendation({
        brief: {
          sourceType: input.brief.sourceType,
          aspectRatio: input.brief.aspectRatio,
          durationSeconds: input.brief.durationSeconds,
          productionRequirements: {
            ...createDefaultProductionRequirements(),
            ...input.brief.productionRequirements,
          },
        },
        sceneDecomposition: input.sceneDecomposition,
        catalogue: catalogueResult.data,
      });

      const parsed = ProviderRecommendationResultSchema.parse(recommendation);

      if (
        parsed.recommendationStatus === 'insufficient_evidence' ||
        parsed.recommendationStatus === 'no_eligible_candidate'
      ) {
        return { ok: true, data: parsed };
      }

      return { ok: true, data: parsed };
    } catch {
      return { ok: false, code: 'recommendation_error' };
    }
  }
}

export function createProviderRecommendationService(
  repository: ProviderCatalogueRepository,
): ProviderRecommendationService {
  return new ProviderRecommendationService(repository);
}
