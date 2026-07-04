import { describe, expect, it } from 'vitest';
import type { AiVideoProvider } from '../../src/domain/constants.js';
import type {
  CatalogueCapabilityFact,
  CatalogueOffering,
  CatalogueProvider,
  CatalogueSource,
} from '../../src/domain/providerCatalogue.js';
import type {
  ProviderCatalogueRepository,
  ProviderCatalogueRepositoryResult,
} from '../../src/server/providers/provider-catalogue-repository.js';
import { ProviderCatalogueService } from '../../src/server/providers/provider-catalogue-service.js';

const VERIFIED_AT = '2026-07-04T12:00:00+00:00';
const REVIEW_DUE_AT = '2026-08-03T12:00:00+00:00';
const DUE_SOON_REVIEW_AT = '2026-07-08T12:00:00+00:00';
const OVERDUE_REVIEW_AT = '2026-07-01T12:00:00+00:00';

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

class FakeProviderCatalogueRepository implements ProviderCatalogueRepository {
  private providers = new Map<AiVideoProvider, CatalogueProvider>();
  private offerings = new Map<string, CatalogueOffering>();
  private facts = new Map<string, CatalogueCapabilityFact[]>();
  private sources = new Map<AiVideoProvider, CatalogueSource[]>();
  private shouldFail = false;
  private missingProvider: AiVideoProvider | null = null;

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

  setMissingProvider(providerId: AiVideoProvider | null) {
    this.missingProvider = providerId;
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

    if (this.missingProvider === providerId) {
      return { ok: false, code: 'not_found' };
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

function buildDefaultRepository() {
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

    repository.seedProvider(providerRecord(providerId));
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
    repository.seedFacts(offeringId, [
      factRecord(factId, offeringId, sourceId, { id: factId }),
    ]);
  }

  return repository;
}

const officialUrls: Record<AiVideoProvider, string> = {
  google_veo: 'https://ai.google.dev/gemini-api/docs/veo',
  openai_sora: 'https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation',
  runway: 'https://docs.dev.runwayml.com/guides/using-the-api/',
  kling: 'https://app.klingai.com/global/dev/document-api/apiReference/model/textToVideo',
  adobe_firefly: 'https://developer.adobe.com/audio-video-firefly-services/',
};

describe('ProviderCatalogueService', () => {
  it('lists exactly five providers from valid repository data', async () => {
    const service = new ProviderCatalogueService(buildDefaultRepository());
    const result = await service.listProviders();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(5);
    }
  });

  it('returns providers in deterministic enum order', async () => {
    const repository = buildDefaultRepository();
    repository.seedProvider(
      providerRecord('runway', {
        verifiedAt: '2020-01-01T00:00:00+00:00',
      }),
    );

    const service = new ProviderCatalogueService(repository);
    const result = await service.listProviders();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.map((item) => item.provider.id)).toEqual([
        'google_veo',
        'openai_sora',
        'runway',
        'kling',
        'adobe_firefly',
      ]);
    }
  });

  it('returns not found for unknown providers', async () => {
    const repository = buildDefaultRepository();
    repository.setMissingProvider('google_veo');
    const service = new ProviderCatalogueService(repository);

    const result = await service.getProviderDetail('google_veo');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('not_found');
    }
  });

  it('rejects invalid provider records during parsing', () => {
    const service = new ProviderCatalogueService(buildDefaultRepository());

    expect(() =>
      service.parseProviderRecord({
        id: 'google_veo',
        displayName: ' ',
        vendorName: 'Google',
        summary: 'Too short',
        lifecycleStatus: 'active',
        apiAccessStatus: 'public',
        recommendationEligible: true,
        sunsetAt: null,
        catalogueNotice: null,
        verifiedAt: VERIFIED_AT,
        reviewDueAt: REVIEW_DUE_AT,
        createdAt: VERIFIED_AT,
        updatedAt: VERIFIED_AT,
      }),
    ).toThrow();
  });

  it('rejects invalid offering records during parsing', () => {
    const service = new ProviderCatalogueService(buildDefaultRepository());

    expect(() =>
      service.parseOfferingRecord({
        id: '11111111-1111-1111-1111-111111111111',
        providerId: 'google_veo',
        offeringKey: 'Bad Key',
        displayName: 'Veo',
        offeringType: 'model',
        ownershipType: 'first_party',
        officialIdentifier: 'veo',
        summary: 'Valid offering summary for schema testing.',
        lifecycleStatus: 'active',
        apiAccessStatus: 'public',
        recommendationEligible: true,
        sunsetAt: null,
        verifiedAt: VERIFIED_AT,
        reviewDueAt: VERIFIED_AT,
        createdAt: VERIFIED_AT,
        updatedAt: VERIFIED_AT,
      }),
    ).toThrow();
  });

  it('rejects invalid capability fact records during parsing', () => {
    const service = new ProviderCatalogueService(buildDefaultRepository());

    expect(() =>
      service.parseCapabilityFactRecord({
        id: '11111111-1111-1111-1111-111111111111',
        offeringId: '22222222-2222-2222-2222-222222222222',
        capabilityKey: 'text_to_video',
        supportLevel: 'limited',
        numericValue: null,
        textValue: null,
        structuredValue: null,
        evidenceSummary: 'Evidence without limitation text.',
        limitationSummary: null,
        sourceId: '33333333-3333-3333-3333-333333333333',
        verifiedAt: VERIFIED_AT,
        reviewDueAt: REVIEW_DUE_AT,
        createdAt: VERIFIED_AT,
        updatedAt: VERIFIED_AT,
      }),
    ).toThrow();
  });

  it('preserves unknown support levels in provider detail', async () => {
    const repository = buildDefaultRepository();
    const { offeringId, sourceId } = fixtureIds.google_veo;

    repository.seedFacts(offeringId, [
      factRecord('c1000002-0001-4001-8001-000000000002', offeringId, sourceId, {
        id: 'c1000002-0001-4001-8001-000000000002',
        capabilityKey: 'dialogue',
        supportLevel: 'unknown',
        evidenceSummary: 'No explicit official dialogue statement was verified.',
      }),
    ]);

    const service = new ProviderCatalogueService(repository);
    const result = await service.getProviderDetail('google_veo');

    expect(result.ok).toBe(true);
    if (result.ok) {
      const dialogueFact = result.data.offerings[0]?.facts.find(
        (fact) => fact.capabilityKey === 'dialogue',
      );
      expect(dialogueFact?.supportLevel).toBe('unknown');
    }
  });

  it('preserves limitation text for limited capability facts', async () => {
    const repository = buildDefaultRepository();
    const { offeringId, sourceId } = fixtureIds.runway;

    repository.seedFacts(offeringId, [
      factRecord('c3000002-0001-4001-8001-000000000002', offeringId, sourceId, {
        id: 'c3000002-0001-4001-8001-000000000002',
        capabilityKey: 'lip_sync',
        supportLevel: 'limited',
        limitationSummary: 'Limited to character performance workflows rather than general lip sync.',
      }),
    ]);

    const service = new ProviderCatalogueService(repository);
    const result = await service.getProviderDetail('runway');

    expect(result.ok).toBe(true);
    if (result.ok) {
      const lipSyncFact = result.data.offerings[0]?.facts.find(
        (fact) => fact.capabilityKey === 'lip_sync',
      );
      expect(lipSyncFact?.supportLevel).toBe('limited');
      expect(lipSyncFact?.limitationSummary).toContain('character performance');
    }
  });

  it('groups sources by provider in provider detail', async () => {
    const service = new ProviderCatalogueService(buildDefaultRepository());
    const result = await service.getProviderDetail('runway');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sources.length).toBeGreaterThan(0);
      expect(result.data.sources.every((source) => source.providerId === 'runway')).toBe(true);
    }
  });

  it('returns offering-linked sources alongside provider-level sources', async () => {
    const repository = buildDefaultRepository();
    const { offeringId } = fixtureIds.kling;

    repository.seedSources('kling', [
      sourceRecord('b4000002-0001-4001-8001-000000000002', 'kling', officialUrls.kling, {
        offeringId: null,
      }),
      sourceRecord('b4000003-0001-4001-8001-000000000003', 'kling', officialUrls.kling, {
        offeringId,
      }),
    ]);

    const service = new ProviderCatalogueService(repository);
    const result = await service.getProviderDetail('kling');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sources.some((source) => source.offeringId === null)).toBe(true);
      expect(result.data.sources.some((source) => source.offeringId === offeringId)).toBe(true);
    }
  });

  it('marks fresh records using verification and review dates', async () => {
    const service = new ProviderCatalogueService(buildDefaultRepository());
    const result = await service.listProviders();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.every((item) => item.freshness === 'fresh')).toBe(true);
    }
  });

  it('marks due-soon records inside the review window', async () => {
    const repository = buildDefaultRepository();
    repository.seedProvider(
      providerRecord('kling', {
        reviewDueAt: DUE_SOON_REVIEW_AT,
      }),
    );

    const service = new ProviderCatalogueService(repository);
    const result = await service.listProviders();

    expect(result.ok).toBe(true);
    if (result.ok) {
      const kling = result.data.find((item) => item.provider.id === 'kling');
      expect(kling?.freshness).toBe('due_soon');
    }
  });

  it('marks overdue records after the review due date', async () => {
    const repository = buildDefaultRepository();
    repository.seedProvider(
      providerRecord('adobe_firefly', {
        reviewDueAt: OVERDUE_REVIEW_AT,
      }),
    );

    const service = new ProviderCatalogueService(repository);
    const result = await service.listProviders();

    expect(result.ok).toBe(true);
    if (result.ok) {
      const adobe = result.data.find((item) => item.provider.id === 'adobe_firefly');
      expect(adobe?.freshness).toBe('overdue');
      expect(adobe?.cautionStates).toContain('review_overdue');
    }
  });

  it('derives sunsetting caution state for sunsetting providers', async () => {
    const repository = buildDefaultRepository();
    repository.seedProvider(
      providerRecord('openai_sora', {
        lifecycleStatus: 'sunsetting',
        apiAccessStatus: 'sunsetting',
        recommendationEligible: false,
        sunsetAt: '2026-09-24T00:00:00+00:00',
      }),
    );

    const service = new ProviderCatalogueService(repository);
    const result = await service.getProviderDetail('openai_sora');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.cautionStates).toContain('sunsetting');
    }
  });

  it('keeps sunsetting providers recommendation ineligible', async () => {
    const repository = buildDefaultRepository();
    repository.seedProvider(
      providerRecord('openai_sora', {
        lifecycleStatus: 'sunsetting',
        apiAccessStatus: 'sunsetting',
        recommendationEligible: false,
      }),
    );

    const service = new ProviderCatalogueService(repository);
    const result = await service.getProviderDetail('openai_sora');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.provider.recommendationEligible).toBe(false);
      expect(result.data.cautionStates).toContain('recommendation_ineligible');
    }
  });

  it('keeps deprecated offerings recommendation ineligible', async () => {
    const repository = buildDefaultRepository();
    const { offeringId } = fixtureIds.runway;

    repository.seedOffering(
      offeringRecord(offeringId, 'runway', {
        id: offeringId,
        lifecycleStatus: 'deprecated',
        recommendationEligible: false,
      }),
    );

    const service = new ProviderCatalogueService(repository);
    const result = await service.getProviderDetail('runway');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.offerings[0]?.offering.recommendationEligible).toBe(false);
      expect(result.data.offerings[0]?.cautionStates).toContain('deprecated');
    }
  });

  it('returns third-party-hosted ownership separately from first-party offerings', async () => {
    const repository = buildDefaultRepository();
    const hostedOfferingId = 'a3000005-0001-4001-8001-000000000005';

    repository.seedOffering(
      offeringRecord(hostedOfferingId, 'runway', {
        id: hostedOfferingId,
        offeringKey: 'hosted-model',
        ownershipType: 'third_party_hosted',
        displayName: 'Hosted third-party model',
      }),
    );

    const service = new ProviderCatalogueService(repository);
    const result = await service.getProviderDetail('runway');

    expect(result.ok).toBe(true);
    if (result.ok) {
      const ownershipTypes = result.data.offerings.map((entry) => entry.offering.ownershipType);
      expect(ownershipTypes).toContain('first_party');
      expect(ownershipTypes).toContain('third_party_hosted');
    }
  });

  it('accepts null official identifiers for service offerings', async () => {
    const service = new ProviderCatalogueService(buildDefaultRepository());
    const result = await service.getProviderDetail('adobe_firefly');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.offerings[0]?.offering.officialIdentifier).toBeNull();
    }
  });

  it('maps repository persistence errors to safe service failures', async () => {
    const repository = buildDefaultRepository();
    repository.setShouldFail(true);
    const service = new ProviderCatalogueService(repository);

    const result = await service.listProviders();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('persistence_error');
    }
  });

  it('does not create ranking fields in list results', async () => {
    const service = new ProviderCatalogueService(buildDefaultRepository());
    const result = await service.listProviders();

    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const item of result.data) {
        expect(item).not.toHaveProperty('rank');
        expect(item).not.toHaveProperty('ranking');
        expect(item).not.toHaveProperty('score');
      }
    }
  });

  it('does not create match percentage fields in detail results', async () => {
    const service = new ProviderCatalogueService(buildDefaultRepository());
    const result = await service.getProviderDetail('google_veo');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('matchPercentage');
      expect(result.data).not.toHaveProperty('fitScore');
      for (const entry of result.data.offerings) {
        expect(entry).not.toHaveProperty('matchPercentage');
      }
    }
  });

  it('does not create cost comparison fields in detail results', async () => {
    const service = new ProviderCatalogueService(buildDefaultRepository());
    const result = await service.getProviderDetail('google_veo');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('costComparison');
      expect(result.data).not.toHaveProperty('pricingScore');
    }
  });

  it('keeps provider source URLs on official HTTPS endpoints', async () => {
    const service = new ProviderCatalogueService(buildDefaultRepository());
    const result = await service.getProviderDetail('google_veo');

    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const source of result.data.sources) {
        expect(source.url.startsWith('https://')).toBe(true);
      }
    }
  });
});
