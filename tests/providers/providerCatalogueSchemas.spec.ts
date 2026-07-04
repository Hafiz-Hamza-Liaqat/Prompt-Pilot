import { describe, expect, it } from 'vitest';
import { AI_VIDEO_PROVIDERS } from '../../src/domain/constants.js';
import {
  API_ACCESS_STATUSES,
  assertApprovedProviderCatalogue,
  BOOLEAN_CATALOGUE_CAPABILITY_KEYS,
  CatalogueCapabilityFactSchema,
  CatalogueOfferingSchema,
  CatalogueProviderSchema,
  CatalogueSourceSchema,
  CATALOGUE_CAPABILITY_KEYS,
  containsRetiredProductName,
  isOfficialHostForProvider,
  LIFECYCLE_STATUSES,
  LIST_CATALOGUE_CAPABILITY_KEYS,
  NUMERIC_CATALOGUE_CAPABILITY_KEYS,
  OFFERING_TYPES,
  OFFICIAL_SOURCE_HOSTS,
  OWNERSHIP_TYPES,
  RETIRED_PRODUCT_NAMES,
  SOURCE_KINDS,
  SUPPORT_LEVELS,
} from '../../src/domain/providerCatalogue.js';

const VERIFIED_AT = '2026-07-04T12:00:00+00:00';
const REVIEW_DUE_AT = '2026-08-03T12:00:00+00:00';
const OFFERING_ID = 'a1000001-0001-4001-8001-000000000001';
const SOURCE_ID = 'b1000001-0001-4001-8001-000000000001';
const FACT_ID = 'c1000001-0001-4001-8001-000000000001';

function validProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 'google_veo',
    displayName: 'Google Veo',
    vendorName: 'Google',
    summary:
      'Google Veo is a cinematic video generation model family available through the Gemini API.',
    lifecycleStatus: 'preview',
    apiAccessStatus: 'preview',
    recommendationEligible: false,
    sunsetAt: null,
    catalogueNotice: null,
    verifiedAt: VERIFIED_AT,
    reviewDueAt: REVIEW_DUE_AT,
    createdAt: VERIFIED_AT,
    updatedAt: VERIFIED_AT,
    ...overrides,
  };
}

function validOffering(overrides: Record<string, unknown> = {}) {
  return {
    id: OFFERING_ID,
    providerId: 'google_veo',
    offeringKey: 'veo-3-1',
    displayName: 'Veo 3.1',
    offeringType: 'model_family',
    ownershipType: 'first_party',
    officialIdentifier: 'veo-3.1-generate-preview',
    summary:
      'Veo 3.1 is Google current cinematic video model family in paid preview via the Gemini API.',
    lifecycleStatus: 'preview',
    apiAccessStatus: 'preview',
    recommendationEligible: false,
    sunsetAt: null,
    verifiedAt: VERIFIED_AT,
    reviewDueAt: REVIEW_DUE_AT,
    createdAt: VERIFIED_AT,
    updatedAt: VERIFIED_AT,
    ...overrides,
  };
}

function validSource(overrides: Record<string, unknown> = {}) {
  return {
    id: SOURCE_ID,
    providerId: 'google_veo',
    offeringId: OFFERING_ID,
    sourceKind: 'developer_docs',
    title: 'Generate videos with Veo 3.1 in Gemini API',
    url: 'https://ai.google.dev/gemini-api/docs/veo',
    publishedOrUpdatedAt: null,
    verifiedAt: VERIFIED_AT,
    createdAt: VERIFIED_AT,
    ...overrides,
  };
}

function validCapabilityFact(overrides: Record<string, unknown> = {}) {
  return {
    id: FACT_ID,
    offeringId: OFFERING_ID,
    capabilityKey: 'text_to_video',
    supportLevel: 'supported',
    numericValue: null,
    textValue: null,
    structuredValue: null,
    evidenceSummary: 'Official Veo documentation describes text-to-video generation.',
    limitationSummary: null,
    sourceId: SOURCE_ID,
    verifiedAt: VERIFIED_AT,
    reviewDueAt: REVIEW_DUE_AT,
    createdAt: VERIFIED_AT,
    updatedAt: VERIFIED_AT,
    ...overrides,
  };
}

describe('approved provider IDs', () => {
  it('defines exactly five approved provider IDs', () => {
    expect(AI_VIDEO_PROVIDERS).toHaveLength(5);
    expect(AI_VIDEO_PROVIDERS).toEqual([
      'google_veo',
      'openai_sora',
      'runway',
      'kling',
      'adobe_firefly',
    ]);
  });

  it('requires provider IDs to be unique', () => {
    expect(new Set(AI_VIDEO_PROVIDERS).size).toBe(AI_VIDEO_PROVIDERS.length);
    expect(() => assertApprovedProviderCatalogue(AI_VIDEO_PROVIDERS)).not.toThrow();
  });

  it('rejects unknown provider IDs', () => {
    expect(() => CatalogueProviderSchema.parse(validProvider({ id: 'seedance' }))).toThrow();
    expect(() =>
      assertApprovedProviderCatalogue([
        'google_veo',
        'openai_sora',
        'runway',
        'kling',
        'google_veo',
      ]),
    ).toThrow('Provider IDs must be unique');
    expect(() => assertApprovedProviderCatalogue(['google_veo'])).toThrow(
      'Expected exactly 5 approved providers',
    );
    expect(() => assertApprovedProviderCatalogue([...AI_VIDEO_PROVIDERS, 'seedance'])).toThrow(
      'Expected exactly 5 approved providers',
    );
  });
});

describe('lifecycle and access enums', () => {
  it('validates lifecycle values', () => {
    for (const status of LIFECYCLE_STATUSES) {
      expect(CatalogueProviderSchema.parse(validProvider({ lifecycleStatus: status })).lifecycleStatus).toBe(
        status,
      );
    }
    expect(() => CatalogueProviderSchema.parse(validProvider({ lifecycleStatus: 'beta' }))).toThrow();
  });

  it('validates API access values', () => {
    for (const status of API_ACCESS_STATUSES) {
      expect(CatalogueProviderSchema.parse(validProvider({ apiAccessStatus: status })).apiAccessStatus).toBe(
        status,
      );
    }
    expect(() => CatalogueProviderSchema.parse(validProvider({ apiAccessStatus: 'private_beta' }))).toThrow();
  });

  it('validates offering types', () => {
    for (const offeringType of OFFERING_TYPES) {
      expect(
        CatalogueOfferingSchema.parse(validOffering({ offeringType })).offeringType,
      ).toBe(offeringType);
    }
    expect(() => CatalogueOfferingSchema.parse(validOffering({ offeringType: 'plugin' }))).toThrow();
  });

  it('validates ownership values', () => {
    for (const ownershipType of OWNERSHIP_TYPES) {
      expect(
        CatalogueOfferingSchema.parse(validOffering({ ownershipType })).ownershipType,
      ).toBe(ownershipType);
    }
    expect(() =>
      CatalogueOfferingSchema.parse(validOffering({ ownershipType: 'community' })),
    ).toThrow();
  });

  it('validates support levels', () => {
    for (const supportLevel of SUPPORT_LEVELS) {
      const fact = validCapabilityFact({
        supportLevel,
        limitationSummary: supportLevel === 'limited' ? 'Limited to preview access only.' : null,
      });
      expect(CatalogueCapabilityFactSchema.parse(fact).supportLevel).toBe(supportLevel);
    }
    expect(() =>
      CatalogueCapabilityFactSchema.parse(validCapabilityFact({ supportLevel: 'maybe' })),
    ).toThrow();
  });

  it('treats unknown and unsupported as distinct support levels', () => {
    const unknownFact = CatalogueCapabilityFactSchema.parse(
      validCapabilityFact({
        capabilityKey: 'dialogue',
        supportLevel: 'unknown',
        evidenceSummary: 'No explicit official statement was verified during research.',
      }),
    );
    const unsupportedFact = CatalogueCapabilityFactSchema.parse(
      validCapabilityFact({
        capabilityKey: 'logo_accuracy',
        supportLevel: 'unsupported',
        evidenceSummary: 'Official documentation states logo-accurate rendering is not supported.',
      }),
    );

    expect(unknownFact.supportLevel).toBe('unknown');
    expect(unsupportedFact.supportLevel).toBe('unsupported');
    expect(unknownFact.supportLevel).not.toBe(unsupportedFact.supportLevel);
  });
});

describe('capability fact evidence rules', () => {
  it('requires a source for supported capability facts', () => {
    expect(() =>
      CatalogueCapabilityFactSchema.parse(
        validCapabilityFact({ sourceId: 'not-a-uuid', supportLevel: 'supported' }),
      ),
    ).toThrow();
  });

  it('requires limitation text for limited capability facts', () => {
    expect(() =>
      CatalogueCapabilityFactSchema.parse(
        validCapabilityFact({
          supportLevel: 'limited',
          limitationSummary: null,
        }),
      ),
    ).toThrow(/limitation/i);
  });

  it('requires explicit evidence text for unsupported capability facts', () => {
    expect(() =>
      CatalogueCapabilityFactSchema.parse(
        validCapabilityFact({
          supportLevel: 'unsupported',
          evidenceSummary: '',
        }),
      ),
    ).toThrow();
  });
});

describe('recommendation eligibility constraints', () => {
  it('rejects recommendation eligibility for sunsetting providers', () => {
    expect(() =>
      CatalogueProviderSchema.parse(
        validProvider({ lifecycleStatus: 'sunsetting', recommendationEligible: true }),
      ),
    ).toThrow(/recommendation eligible/i);
  });

  it('rejects recommendation eligibility for deprecated providers', () => {
    expect(() =>
      CatalogueProviderSchema.parse(
        validProvider({ lifecycleStatus: 'deprecated', recommendationEligible: true }),
      ),
    ).toThrow(/recommendation eligible/i);
  });

  it('rejects recommendation eligibility for unavailable providers', () => {
    expect(() =>
      CatalogueProviderSchema.parse(
        validProvider({ lifecycleStatus: 'unavailable', recommendationEligible: true }),
      ),
    ).toThrow(/recommendation eligible/i);
  });
});

describe('official source URL validation', () => {
  it('accepts HTTPS official URLs on approved hosts', () => {
    expect(
      CatalogueSourceSchema.parse(
        validSource({ url: 'https://ai.google.dev/gemini-api/docs/veo' }),
      ).url,
    ).toMatch(/^https:\/\//);
    expect(isOfficialHostForProvider('google_veo', 'https://ai.google.dev/gemini-api/docs/veo')).toBe(
      true,
    );
  });

  it('rejects HTTP URLs', () => {
    expect(() =>
      CatalogueSourceSchema.parse(
        validSource({ url: 'http://ai.google.dev/gemini-api/docs/veo' }),
      ),
    ).toThrow(/HTTPS/i);
  });

  it('rejects credential-bearing URLs', () => {
    expect(() =>
      CatalogueSourceSchema.parse(
        validSource({ url: 'https://user:secret@ai.google.dev/gemini-api/docs/veo' }),
      ),
    ).toThrow(/credentials/i);
  });

  it('rejects unapproved hosts', () => {
    expect(() =>
      CatalogueSourceSchema.parse(
        validSource({ url: 'https://example.com/unofficial-docs' }),
      ),
    ).toThrow(/approved/i);
    expect(isOfficialHostForProvider('google_veo', 'https://example.com/docs')).toBe(false);
  });
});

describe('verification and review dates', () => {
  it('requires verification timestamps on catalogue records', () => {
    expect(() => CatalogueProviderSchema.parse(validProvider({ verifiedAt: undefined }))).toThrow();
    expect(() => CatalogueOfferingSchema.parse(validOffering({ verifiedAt: undefined }))).toThrow();
    expect(() =>
      CatalogueCapabilityFactSchema.parse(validCapabilityFact({ verifiedAt: undefined })),
    ).toThrow();
    expect(() => CatalogueSourceSchema.parse(validSource({ verifiedAt: undefined }))).toThrow();
  });

  it('requires review due dates to follow verification dates', () => {
    expect(() =>
      CatalogueProviderSchema.parse(
        validProvider({
          verifiedAt: REVIEW_DUE_AT,
          reviewDueAt: VERIFIED_AT,
        }),
      ),
    ).toThrow(/follow verification/i);
  });
});

describe('typed capability payloads', () => {
  it('requires numeric values for supported numeric capabilities', () => {
    expect(() =>
      CatalogueCapabilityFactSchema.parse(
        validCapabilityFact({
          capabilityKey: 'max_duration_seconds',
          supportLevel: 'supported',
          numericValue: null,
        }),
      ),
    ).toThrow(/numeric value/i);

    const parsed = CatalogueCapabilityFactSchema.parse(
      validCapabilityFact({
        capabilityKey: 'max_duration_seconds',
        supportLevel: 'supported',
        numericValue: 8,
      }),
    );
    expect(parsed.numericValue).toBe(8);
  });

  it('requires structured values for supported list capabilities', () => {
    expect(() =>
      CatalogueCapabilityFactSchema.parse(
        validCapabilityFact({
          capabilityKey: 'supported_aspect_ratios',
          supportLevel: 'supported',
          structuredValue: null,
        }),
      ),
    ).toThrow(/structured values/i);

    const parsed = CatalogueCapabilityFactSchema.parse(
      validCapabilityFact({
        capabilityKey: 'supported_aspect_ratios',
        supportLevel: 'supported',
        structuredValue: ['16:9', '9:16'],
      }),
    );
    expect(parsed.structuredValue).toEqual(['16:9', '9:16']);
  });

  it('rejects numeric payloads on boolean capability facts', () => {
    expect(() =>
      CatalogueCapabilityFactSchema.parse(
        validCapabilityFact({
          capabilityKey: 'text_to_video',
          numericValue: 1,
        }),
      ),
    ).toThrow(/numeric payloads/i);
  });

  it('partitions capability keys into numeric, list, and boolean groups', () => {
    expect(NUMERIC_CATALOGUE_CAPABILITY_KEYS).toEqual(['max_duration_seconds']);
    expect(LIST_CATALOGUE_CAPABILITY_KEYS).toEqual([
      'supported_aspect_ratios',
      'supported_resolutions',
    ]);
    expect(BOOLEAN_CATALOGUE_CAPABILITY_KEYS.length + NUMERIC_CATALOGUE_CAPABILITY_KEYS.length +
      LIST_CATALOGUE_CAPABILITY_KEYS.length).toBe(CATALOGUE_CAPABILITY_KEYS.length);
  });
});

describe('display and identifier rules', () => {
  it('requires non-empty provider display names', () => {
    expect(() => CatalogueProviderSchema.parse(validProvider({ displayName: '  ' }))).toThrow();
    expect(CatalogueProviderSchema.parse(validProvider()).displayName).toBe('Google Veo');
  });

  it('requires machine-safe offering keys', () => {
    expect(CatalogueOfferingSchema.parse(validOffering()).offeringKey).toBe('veo-3-1');
    expect(() =>
      CatalogueOfferingSchema.parse(validOffering({ offeringKey: 'Bad Key!' })),
    ).toThrow();
  });

  it('allows null official identifiers for service offerings', () => {
    const parsed = CatalogueOfferingSchema.parse(
      validOffering({
        offeringType: 'api_service',
        offeringKey: 'reframe-api',
        displayName: 'Reframe API',
        officialIdentifier: null,
      }),
    );
    expect(parsed.officialIdentifier).toBeNull();
  });
});

describe('retired product names and forbidden ranking fields', () => {
  it('rejects retired product names in catalogue descriptions', () => {
    for (const name of RETIRED_PRODUCT_NAMES) {
      expect(containsRetiredProductName(name)).toBe(true);
      expect(() =>
        CatalogueProviderSchema.parse(validProvider({ displayName: `Catalogue for ${name}` })),
      ).toThrow(/retired product names/i);
    }
  });

  it('does not define provider ranking fields on catalogue schemas', () => {
    const parsedRecords = [
      CatalogueProviderSchema.parse(validProvider()),
      CatalogueOfferingSchema.parse(validOffering()),
      CatalogueCapabilityFactSchema.parse(validCapabilityFact()),
      CatalogueSourceSchema.parse(validSource()),
    ];

    for (const record of parsedRecords) {
      for (const key of Object.keys(record)) {
        expect(key).not.toMatch(/rank/i);
        expect(key).not.toMatch(/score/i);
        expect(key).not.toMatch(/match/i);
        expect(key).not.toMatch(/cost/i);
      }
    }
  });

  it('does not define recommendation score fields on catalogue schemas', () => {
    const provider = CatalogueProviderSchema.parse({
      ...validProvider(),
      recommendationScore: 99,
      fitScore: 88,
    });
    const fact = CatalogueCapabilityFactSchema.parse({
      ...validCapabilityFact(),
      fitScore: 88,
    });

    expect(provider).not.toHaveProperty('recommendationScore');
    expect(provider).not.toHaveProperty('fitScore');
    expect(fact).not.toHaveProperty('fitScore');
  });
});

describe('source kinds and host mapping', () => {
  it('validates approved source kinds', () => {
    for (const sourceKind of SOURCE_KINDS) {
      expect(
        CatalogueSourceSchema.parse(validSource({ sourceKind })).sourceKind,
      ).toBe(sourceKind);
    }
    expect(() => CatalogueSourceSchema.parse(validSource({ sourceKind: 'blog' }))).toThrow();
  });

  it('maps each approved provider to official source hosts', () => {
    expect(Object.keys(OFFICIAL_SOURCE_HOSTS).sort()).toEqual([...AI_VIDEO_PROVIDERS].sort());
    expect(OFFICIAL_SOURCE_HOSTS.runway).toContain('docs.dev.runwayml.com');
  });
});
