import {
  AI_VIDEO_PROVIDERS,
  type AiVideoProvider,
} from '@/domain/constants';
import {
  CatalogueCapabilityFactSchema,
  CatalogueOfferingSchema,
  CatalogueProviderSchema,
  CatalogueSourceSchema,
  getFreshnessState,
  type CatalogueCapabilityFact,
  type CatalogueOffering,
  type CatalogueProvider,
  type CatalogueSource,
  type FreshnessState,
} from '@/domain/providerCatalogue';
import type {
  ProviderCatalogueRepository,
  ProviderCatalogueRepositoryResult,
} from './provider-catalogue-repository';

export type ProviderCatalogueServiceErrorCode = 'persistence_error' | 'not_found';

export type ProviderCatalogueServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ProviderCatalogueServiceErrorCode };

export type ProviderCatalogueListItem = {
  provider: CatalogueProvider;
  offeringCount: number;
  freshness: FreshnessState;
  cautionStates: string[];
};

export type ProviderCatalogueDetail = {
  provider: CatalogueProvider;
  offerings: Array<{
    offering: CatalogueOffering;
    facts: CatalogueCapabilityFact[];
    freshness: FreshnessState;
    cautionStates: string[];
  }>;
  sources: CatalogueSource[];
  providerFreshness: FreshnessState;
  cautionStates: string[];
};

function mapRepositoryError<T>(
  result: ProviderCatalogueRepositoryResult<T>,
): ProviderCatalogueServiceResult<T> {
  if (result.ok) {
    return result;
  }

  return { ok: false, code: result.code };
}

function deriveCautionStates(
  lifecycleStatus: CatalogueProvider['lifecycleStatus'],
  freshness: FreshnessState,
  recommendationEligible: boolean,
): string[] {
  const states: string[] = [];

  if (lifecycleStatus === 'sunsetting') {
    states.push('sunsetting');
  }

  if (lifecycleStatus === 'deprecated') {
    states.push('deprecated');
  }

  if (lifecycleStatus === 'unavailable') {
    states.push('unavailable');
  }

  if (freshness === 'overdue') {
    states.push('review_overdue');
  }

  if (freshness === 'due_soon') {
    states.push('review_due_soon');
  }

  if (!recommendationEligible && lifecycleStatus === 'sunsetting') {
    states.push('recommendation_ineligible');
  }

  return states;
}

function sortProviders(providers: CatalogueProvider[]): CatalogueProvider[] {
  const order = new Map(AI_VIDEO_PROVIDERS.map((id, index) => [id, index]));

  return [...providers].sort(
    (left, right) => (order.get(left.id) ?? 999) - (order.get(right.id) ?? 999),
  );
}

export class ProviderCatalogueService {
  constructor(private readonly repository: ProviderCatalogueRepository) {}

  async listProviders(): Promise<ProviderCatalogueServiceResult<ProviderCatalogueListItem[]>> {
    const providersResult = await this.repository.listProviders();

    if (!providersResult.ok) {
      return mapRepositoryError(providersResult);
    }

    const sorted = sortProviders(providersResult.data);
    const items: ProviderCatalogueListItem[] = [];

    for (const provider of sorted) {
      const offeringsResult = await this.repository.listOfferingsByProvider(provider.id);

      if (!offeringsResult.ok) {
        return mapRepositoryError(offeringsResult);
      }

      const freshness = getFreshnessState(provider.verifiedAt, provider.reviewDueAt);

      items.push({
        provider,
        offeringCount: offeringsResult.data.length,
        freshness,
        cautionStates: deriveCautionStates(
          provider.lifecycleStatus,
          freshness,
          provider.recommendationEligible,
        ),
      });
    }

    return { ok: true, data: items };
  }

  async getProviderDetail(
    providerId: AiVideoProvider,
  ): Promise<ProviderCatalogueServiceResult<ProviderCatalogueDetail>> {
    const providerResult = await this.repository.getProviderById(providerId);

    if (!providerResult.ok) {
      return mapRepositoryError(providerResult);
    }

    const [offeringsResult, sourcesResult] = await Promise.all([
      this.repository.listOfferingsByProvider(providerId),
      this.repository.listSourcesByProvider(providerId),
    ]);

    if (!offeringsResult.ok) {
      return mapRepositoryError(offeringsResult);
    }

    if (!sourcesResult.ok) {
      return mapRepositoryError(sourcesResult);
    }

    const offeringsWithFacts: ProviderCatalogueDetail['offerings'] = [];

    for (const offering of offeringsResult.data) {
      const factsResult = await this.repository.listCapabilityFactsByOffering(offering.id);

      if (!factsResult.ok) {
        return mapRepositoryError(factsResult);
      }

      const freshness = getFreshnessState(offering.verifiedAt, offering.reviewDueAt);

      offeringsWithFacts.push({
        offering,
        facts: factsResult.data,
        freshness,
        cautionStates: deriveCautionStates(
          offering.lifecycleStatus,
          freshness,
          offering.recommendationEligible,
        ),
      });
    }

    const providerFreshness = getFreshnessState(
      providerResult.data.verifiedAt,
      providerResult.data.reviewDueAt,
    );

    return {
      ok: true,
      data: {
        provider: providerResult.data,
        offerings: offeringsWithFacts,
        sources: sourcesResult.data,
        providerFreshness,
        cautionStates: deriveCautionStates(
          providerResult.data.lifecycleStatus,
          providerFreshness,
          providerResult.data.recommendationEligible,
        ),
      },
    };
  }

  parseProviderRecord(input: unknown): CatalogueProvider {
    return CatalogueProviderSchema.parse(input);
  }

  parseOfferingRecord(input: unknown): CatalogueOffering {
    return CatalogueOfferingSchema.parse(input);
  }

  parseCapabilityFactRecord(input: unknown): CatalogueCapabilityFact {
    return CatalogueCapabilityFactSchema.parse(input);
  }

  parseSourceRecord(input: unknown): CatalogueSource {
    return CatalogueSourceSchema.parse(input);
  }
}

export function createProviderCatalogueService(
  repository: ProviderCatalogueRepository,
): ProviderCatalogueService {
  return new ProviderCatalogueService(repository);
}
