import type { AiVideoProvider, AspectRatio } from '../../src/domain/constants.js';
import type {
  CatalogueCapabilityFact,
  CatalogueCapabilityKey,
  CatalogueOffering,
  CatalogueProvider,
  CatalogueSource,
} from '../../src/domain/providerCatalogue.js';
import type { ProductionRequirements } from '../../src/domain/productionRequirements.js';
import { createDefaultProductionRequirements } from '../../src/domain/productionRequirements.js';
import type { ProviderRecommendationCatalogue } from '../../src/domain/providerRecommendationEngine.js';
import type { CalculateProviderRecommendationInput } from '../../src/domain/providerRecommendationEngine.js';
import { decomposeDurationIntoScenes } from '../../src/domain/sceneDecomposition.js';

export const VERIFIED_AT = '2026-07-04T12:00:00+00:00';
export const REVIEW_DUE_AT = '2026-08-03T12:00:00+00:00';
export const DUE_SOON_REVIEW_AT = '2026-07-08T12:00:00+00:00';
export const OVERDUE_REVIEW_AT = '2026-07-01T12:00:00+00:00';
export const SORA_SUNSET_AT = '2026-09-24T00:00:00+00:00';

export const OFFICIAL_URLS: Record<AiVideoProvider, string> = {
  google_veo: 'https://ai.google.dev/gemini-api/docs/veo',
  openai_sora: 'https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation',
  runway: 'https://docs.dev.runwayml.com/guides/using-the-api/',
  kling: 'https://app.klingai.com/global/dev/document-api/apiReference/model/textToVideo',
  adobe_firefly: 'https://developer.adobe.com/audio-video-firefly-services/',
};

export const FIXTURE_IDS: Record<
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

export const RUNWAY_SECONDARY_OFFERING_ID = 'a3000002-0001-4001-8001-000000000002';

const PROVIDER_DEFAULTS: Record<AiVideoProvider, Pick<CatalogueProvider, 'displayName' | 'vendorName'>> =
  {
    google_veo: { displayName: 'Google Veo', vendorName: 'Google' },
    openai_sora: { displayName: 'OpenAI Sora', vendorName: 'OpenAI' },
    runway: { displayName: 'Runway', vendorName: 'Runway' },
    kling: { displayName: 'Kling', vendorName: 'Kuaishou' },
    adobe_firefly: { displayName: 'Adobe Firefly', vendorName: 'Adobe' },
  };

export function providerRecord(
  id: AiVideoProvider,
  overrides: Partial<CatalogueProvider> = {},
): CatalogueProvider {
  return {
    id,
    displayName: PROVIDER_DEFAULTS[id].displayName,
    vendorName: PROVIDER_DEFAULTS[id].vendorName,
    summary: `${PROVIDER_DEFAULTS[id].displayName} summary for Prompt Pilot recommendation testing.`,
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

export function offeringRecord(
  id: string,
  providerId: AiVideoProvider,
  overrides: Partial<CatalogueOffering> = {},
): CatalogueOffering {
  return {
    id,
    providerId,
    offeringKey: `${providerId}-primary`,
    displayName: `${providerId} offering`,
    offeringType: providerId === 'adobe_firefly' ? 'api_service' : 'model',
    ownershipType: 'first_party',
    officialIdentifier: providerId === 'adobe_firefly' ? null : `${providerId}-model`,
    summary: `${providerId} offering summary for Prompt Pilot recommendation testing.`,
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

export function sourceRecord(
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

export function factRecord(
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

export function buildAspectRatioListFact(
  id: string,
  offeringId: string,
  sourceId: string,
  ratios: AspectRatio[],
  supportLevel: 'supported' | 'limited' = 'supported',
): CatalogueCapabilityFact {
  return factRecord(id, offeringId, sourceId, {
    capabilityKey: 'supported_aspect_ratios',
    supportLevel,
    structuredValue: ratios,
    evidenceSummary: 'Official documentation lists supported aspect ratios.',
    limitationSummary:
      supportLevel === 'limited' ? 'Aspect ratio support is documented with workflow restrictions.' : null,
  });
}

export function buildMaxDurationFact(
  id: string,
  offeringId: string,
  sourceId: string,
  maxSeconds: number,
  supportLevel: 'supported' | 'limited' = 'supported',
): CatalogueCapabilityFact {
  return factRecord(id, offeringId, sourceId, {
    capabilityKey: 'max_duration_seconds',
    supportLevel,
    numericValue: maxSeconds,
    evidenceSummary: `Official documentation states a per-generation maximum of ${maxSeconds} seconds.`,
    limitationSummary:
      supportLevel === 'limited' ? 'Duration limits vary by workflow tier.' : null,
  });
}

export function buildBooleanCapabilityFact(
  id: string,
  offeringId: string,
  sourceId: string,
  capabilityKey: CatalogueCapabilityKey,
  supportLevel: CatalogueCapabilityFact['supportLevel'],
): CatalogueCapabilityFact {
  return factRecord(id, offeringId, sourceId, {
    capabilityKey,
    supportLevel,
    evidenceSummary: `Official documentation records ${capabilityKey.replaceAll('_', ' ')} support.`,
    limitationSummary:
      supportLevel === 'limited' ? 'Capability is available with documented restrictions.' : null,
  });
}

function baselineEligibleFacts(
  offeringId: string,
  sourceId: string,
  factPrefix: string,
  aspectRatios: AspectRatio[] = ['16:9', '9:16', '1:1'],
  maxDurationSeconds = 60,
): CatalogueCapabilityFact[] {
  return [
    factRecord(`${factPrefix}-001`, offeringId, sourceId, { id: `${factPrefix}-001` }),
    buildAspectRatioListFact(`${factPrefix}-002`, offeringId, sourceId, aspectRatios),
    buildMaxDurationFact(`${factPrefix}-003`, offeringId, sourceId, maxDurationSeconds),
  ];
}

export function buildMinimalCatalogue(): ProviderRecommendationCatalogue {
  const providerId: AiVideoProvider = 'google_veo';
  const { offeringId, sourceId, factId } = FIXTURE_IDS.google_veo;

  const provider = providerRecord(providerId);
  const offering = offeringRecord(offeringId, providerId, { id: offeringId });
  const source = sourceRecord(sourceId, providerId, OFFICIAL_URLS.google_veo, {
    id: sourceId,
    offeringId,
  });

  return {
    providers: [provider],
    offerings: [offering],
    factsByOfferingId: {
      [offeringId]: [factRecord(factId, offeringId, sourceId, { id: factId })],
    },
    sourcesByProviderId: {
      [providerId]: [source],
    },
  };
}

export function buildSunsettingSoraFixture(): {
  provider: CatalogueProvider;
  offering: CatalogueOffering;
  source: CatalogueSource;
  facts: CatalogueCapabilityFact[];
} {
  const providerId: AiVideoProvider = 'openai_sora';
  const { offeringId, sourceId } = FIXTURE_IDS.openai_sora;

  const provider = providerRecord(providerId, {
    lifecycleStatus: 'sunsetting',
    apiAccessStatus: 'sunsetting',
    recommendationEligible: false,
    sunsetAt: SORA_SUNSET_AT,
  });
  const offering = offeringRecord(offeringId, providerId, {
    id: offeringId,
    lifecycleStatus: 'sunsetting',
    apiAccessStatus: 'sunsetting',
    recommendationEligible: false,
    sunsetAt: SORA_SUNSET_AT,
  });
  const source = sourceRecord(sourceId, providerId, OFFICIAL_URLS.openai_sora, {
    id: sourceId,
    offeringId,
  });
  const facts = baselineEligibleFacts(offeringId, sourceId, 'c2000001');

  return { provider, offering, source, facts: [facts[0]!] };
}

export function buildRunwayMultiOfferingFixture(): {
  provider: CatalogueProvider;
  primaryOffering: CatalogueOffering;
  secondaryOffering: CatalogueOffering;
  source: CatalogueSource;
  primaryFacts: CatalogueCapabilityFact[];
  secondaryFacts: CatalogueCapabilityFact[];
} {
  const providerId: AiVideoProvider = 'runway';
  const { offeringId, sourceId } = FIXTURE_IDS.runway;

  const provider = providerRecord(providerId);
  const primaryOffering = offeringRecord(offeringId, providerId, {
    id: offeringId,
    offeringKey: 'gen-4',
    displayName: 'Runway Gen-4',
  });
  const secondaryOffering = offeringRecord(RUNWAY_SECONDARY_OFFERING_ID, providerId, {
    id: RUNWAY_SECONDARY_OFFERING_ID,
    offeringKey: 'gen-3-alpha',
    displayName: 'Runway Gen-3 Alpha',
    ownershipType: 'third_party_hosted',
  });
  const source = sourceRecord(sourceId, providerId, OFFICIAL_URLS.runway, {
    id: sourceId,
    offeringId,
  });

  const primaryFacts = [
    ...baselineEligibleFacts(offeringId, sourceId, 'c3000001', ['16:9', '9:16', '1:1'], 60),
    buildBooleanCapabilityFact(
      'c3000004-0001-4001-8001-000000000004',
      offeringId,
      sourceId,
      'lip_sync',
      'supported',
    ),
  ];
  const secondaryFacts = [
    factRecord('c3000005-0001-4001-8001-000000000001', RUNWAY_SECONDARY_OFFERING_ID, sourceId, {
      id: 'c3000005-0001-4001-8001-000000000001',
      supportLevel: 'limited',
      limitationSummary: 'Text-to-video is limited to hosted third-party model workflows.',
    }),
    buildAspectRatioListFact(
      'c3000005-0001-4001-8001-000000000002',
      RUNWAY_SECONDARY_OFFERING_ID,
      sourceId,
      ['16:9'],
      'limited',
    ),
    buildMaxDurationFact(
      'c3000005-0001-4001-8001-000000000003',
      RUNWAY_SECONDARY_OFFERING_ID,
      sourceId,
      30,
      'limited',
    ),
  ];

  return {
    provider,
    primaryOffering,
    secondaryOffering,
    source,
    primaryFacts,
    secondaryFacts,
  };
}

export function buildDeterministicRecommendationCatalogue(): ProviderRecommendationCatalogue {
  const providers: CatalogueProvider[] = [];
  const offerings: CatalogueOffering[] = [];
  const factsByOfferingId: Record<string, CatalogueCapabilityFact[]> = {};
  const sourcesByProviderId = {} as Record<AiVideoProvider, CatalogueSource[]>;

  const google = FIXTURE_IDS.google_veo;
  providers.push(providerRecord('google_veo'));
  offerings.push(
    offeringRecord(google.offeringId, 'google_veo', {
      id: google.offeringId,
      offeringKey: 'veo-3',
      displayName: 'Google Veo 3',
    }),
  );
  sourcesByProviderId.google_veo = [
    sourceRecord(google.sourceId, 'google_veo', OFFICIAL_URLS.google_veo, {
      id: google.sourceId,
      offeringId: google.offeringId,
    }),
  ];
  factsByOfferingId[google.offeringId] = baselineEligibleFacts(
    google.offeringId,
    google.sourceId,
    'c1000001',
    ['16:9', '9:16', '1:1'],
    60,
  );

  const soraFixture = buildSunsettingSoraFixture();
  providers.push(soraFixture.provider);
  offerings.push(soraFixture.offering);
  sourcesByProviderId.openai_sora = [soraFixture.source];
  factsByOfferingId[soraFixture.offering.id] = soraFixture.facts;

  const runwayFixture = buildRunwayMultiOfferingFixture();
  providers.push(runwayFixture.provider);
  offerings.push(runwayFixture.primaryOffering, runwayFixture.secondaryOffering);
  sourcesByProviderId.runway = [runwayFixture.source];
  factsByOfferingId[runwayFixture.primaryOffering.id] = runwayFixture.primaryFacts;
  factsByOfferingId[runwayFixture.secondaryOffering.id] = runwayFixture.secondaryFacts;

  const kling = FIXTURE_IDS.kling;
  providers.push(providerRecord('kling'));
  offerings.push(
    offeringRecord(kling.offeringId, 'kling', {
      id: kling.offeringId,
      offeringKey: 'kling-v2',
      displayName: 'Kling V2',
    }),
  );
  sourcesByProviderId.kling = [
    sourceRecord(kling.sourceId, 'kling', OFFICIAL_URLS.kling, {
      id: kling.sourceId,
      offeringId: kling.offeringId,
    }),
  ];
  factsByOfferingId[kling.offeringId] = baselineEligibleFacts(
    kling.offeringId,
    kling.sourceId,
    'c4000001',
    ['16:9', '9:16'],
    45,
  );

  const adobe = FIXTURE_IDS.adobe_firefly;
  providers.push(providerRecord('adobe_firefly'));
  offerings.push(
    offeringRecord(adobe.offeringId, 'adobe_firefly', {
      id: adobe.offeringId,
      offeringKey: 'reframe-api',
      displayName: 'Adobe Reframe API',
    }),
  );
  sourcesByProviderId.adobe_firefly = [
    sourceRecord(adobe.sourceId, 'adobe_firefly', OFFICIAL_URLS.adobe_firefly, {
      id: adobe.sourceId,
      offeringId: adobe.offeringId,
    }),
  ];
  factsByOfferingId[adobe.offeringId] = [
    factRecord(adobe.factId, adobe.offeringId, adobe.sourceId, {
      id: adobe.factId,
      supportLevel: 'limited',
      limitationSummary: 'Video generation is limited to reframing workflows.',
    }),
    buildAspectRatioListFact(
      'c5000002-0001-4001-8001-000000000002',
      adobe.offeringId,
      adobe.sourceId,
      ['16:9', '9:16'],
      'limited',
    ),
    buildMaxDurationFact(
      'c5000003-0001-4001-8001-000000000003',
      adobe.offeringId,
      adobe.sourceId,
      30,
      'limited',
    ),
  ];

  return {
    providers,
    offerings,
    factsByOfferingId,
    sourcesByProviderId,
  };
}

export function buildRecommendationBriefInput(
  overrides: Partial<CalculateProviderRecommendationInput['brief']> = {},
): CalculateProviderRecommendationInput['brief'] {
  return {
    sourceType: 'idea',
    aspectRatio: '16:9',
    durationSeconds: 30,
    productionRequirements: createDefaultProductionRequirements(),
    ...overrides,
  };
}

export function buildRecommendationCalculateInput(
  catalogue: ProviderRecommendationCatalogue = buildDeterministicRecommendationCatalogue(),
  overrides: {
    brief?: Partial<CalculateProviderRecommendationInput['brief']>;
    sceneDecomposition?: CalculateProviderRecommendationInput['sceneDecomposition'];
  } = {},
): CalculateProviderRecommendationInput {
  const brief = buildRecommendationBriefInput(overrides.brief);
  const durationSeconds = brief.durationSeconds;

  return {
    brief,
    sceneDecomposition: overrides.sceneDecomposition ?? decomposeDurationIntoScenes(durationSeconds),
    catalogue,
  };
}

export function buildCatalogueInputFromRecords(input: {
  providers: CatalogueProvider[];
  offerings: CatalogueOffering[];
  factsByOfferingId: Record<string, CatalogueCapabilityFact[]>;
  sourcesByProviderId: Record<AiVideoProvider, CatalogueSource[]>;
}): ProviderRecommendationCatalogue {
  return {
    providers: [...input.providers],
    offerings: [...input.offerings],
    factsByOfferingId: { ...input.factsByOfferingId },
    sourcesByProviderId: { ...input.sourcesByProviderId },
  };
}

export function withProductionRequirements(
  requirements: ProductionRequirements,
): Partial<CalculateProviderRecommendationInput['brief']> {
  return { productionRequirements: requirements };
}
