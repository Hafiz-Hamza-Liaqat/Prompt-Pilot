import { describe, expect, it } from 'vitest';
import {
  DATA_ORIGINS,
  EVALUATION_STATES,
  MockPromptSectionKeySchema,
  MockPromptSectionSchema,
  MockResultWorkspaceStaticFixtureSchema,
  MockResultWorkspaceViewModelSchema,
  MockSceneSchema,
  MOCK_PROMPT_SECTION_KEYS,
  MOCK_SCENE_IDS,
  PROVIDER_REFERENCE_STATES,
  ProviderReferenceStateSchema,
  WORKSPACE_FIXTURE_VERSION,
  WORKSPACE_MODES,
  WORKSPACE_PREVIEW_TITLE,
  WORKSPACE_SAMPLE_DISCLAIMER,
  WORKSPACE_SECTIONS,
  WorkspaceModeSchema,
  DataOriginSchema,
  EvaluationStateSchema,
  WorkspaceSectionSchema,
  createSourcePreview,
  deriveContinuityEvaluationState,
  mapEnabledRequirementLabels,
  normalizeWorkspaceSection,
} from '../../src/domain/mockResultWorkspace.js';
import { mockResultWorkspaceFixture } from '../../src/fixtures/mock-result-workspace.js';
import { createDefaultProductionRequirements } from '../../src/domain/productionRequirements.js';

const PROJECT_ID = '33333333-3333-3333-3333-333333333333';
const BRIEF_ID = '44444444-4444-4444-4444-444444444444';
const COMPLETED_AT = '2026-07-04T12:00:00+00:00';

function validProjectSummary() {
  return {
    id: PROJECT_ID,
    title: 'Summer Launch',
    description: 'A product launch campaign.',
    status: 'active' as const,
  };
}

function validBriefSummary() {
  return {
    id: BRIEF_ID,
    projectId: PROJECT_ID,
    workingTitle: 'Summer Launch Brief',
    objective: 'Showcase the new product line.',
    targetAudience: 'Urban professionals aged 25-35',
    publishingDestination: 'youtube',
    aspectRatio: '16:9',
    videoCategory: 'product_advertisement',
    durationSeconds: 30,
    visualStyle: 'Cinematic',
    tone: 'Upbeat',
    budgetPriority: 'balanced',
    qualityPriority: 'highest_quality',
    enabledRequirementLabels: ['Voiceover narration'],
    sourceType: 'idea',
    sourcePreview: 'A compelling summer product launch concept.',
    sourceCharacterCount: 42,
    sourceUrl: null,
    completedAt: COMPLETED_AT,
  };
}

function validProviderReference(overrides: Record<string, unknown> = {}) {
  return {
    id: 'google_veo',
    displayName: 'Google Veo',
    lifecycleStatus: 'active',
    apiAccessStatus: 'public',
    freshness: 'fresh',
    catalogueNotice: null,
    sunsetAt: null,
    referenceState: 'catalogue_reference' as const,
    ...overrides,
  };
}

function validViewModel(overrides: Record<string, unknown> = {}) {
  return {
    mode: 'mock_preview' as const,
    dataOrigin: 'static_fixture' as const,
    isDecisionReady: false as const,
    fixtureVersion: WORKSPACE_FIXTURE_VERSION,
    sampleDisclaimer: WORKSPACE_SAMPLE_DISCLAIMER,
    previewTitle: WORKSPACE_PREVIEW_TITLE,
    activeSection: 'overview' as const,
    project: validProjectSummary(),
    brief: validBriefSummary(),
    providers: [
      validProviderReference({ id: 'adobe_firefly', displayName: 'Adobe Firefly' }),
      validProviderReference({ id: 'google_veo', displayName: 'Google Veo' }),
      validProviderReference({ id: 'kling', displayName: 'Kling' }),
      validProviderReference({ id: 'openai_sora', displayName: 'OpenAI Sora' }),
      validProviderReference({ id: 'runway', displayName: 'Runway' }),
    ],
    sampleScenes: mockResultWorkspaceFixture.sampleScenes,
    samplePromptSections: mockResultWorkspaceFixture.samplePromptSections,
    continuityItems: mockResultWorkspaceFixture.continuityItems,
    audioEditingItems: mockResultWorkspaceFixture.audioEditingItems,
    qualityItems: mockResultWorkspaceFixture.qualityItems,
    ...overrides,
  };
}

describe('workspace mode', () => {
  it('accepts only mock_preview', () => {
    expect(WORKSPACE_MODES).toEqual(['mock_preview']);
    expect(WorkspaceModeSchema.parse('mock_preview')).toBe('mock_preview');
    expect(() => WorkspaceModeSchema.parse('live')).toThrow();
  });
});

describe('data origin', () => {
  it('accepts only static_fixture', () => {
    expect(DATA_ORIGINS).toEqual(['static_fixture']);
    expect(DataOriginSchema.parse('static_fixture')).toBe('static_fixture');
    expect(() => DataOriginSchema.parse('database')).toThrow();
  });
});

describe('decision readiness', () => {
  it('requires isDecisionReady to be false', () => {
    expect(() =>
      MockResultWorkspaceViewModelSchema.parse(validViewModel({ isDecisionReady: true })),
    ).toThrow();
    expect(
      MockResultWorkspaceViewModelSchema.parse(validViewModel()).isDecisionReady,
    ).toBe(false);
  });
});

describe('workspace sections', () => {
  it('defines exactly seven sections', () => {
    expect(WORKSPACE_SECTIONS).toHaveLength(7);
  });

  it('keeps section values unique', () => {
    expect(new Set(WORKSPACE_SECTIONS).size).toBe(WORKSPACE_SECTIONS.length);
  });

  it('falls back invalid sections to overview', () => {
    expect(normalizeWorkspaceSection('scenes')).toBe('scenes');
    expect(normalizeWorkspaceSection('invalid')).toBe('overview');
    expect(normalizeWorkspaceSection(undefined)).toBe('overview');
  });

  it('validates each approved section value', () => {
    for (const section of WORKSPACE_SECTIONS) {
      expect(WorkspaceSectionSchema.parse(section)).toBe(section);
    }
  });
});

describe('mock scene contract', () => {
  it('fixture contains exactly four sample scenes', () => {
    expect(mockResultWorkspaceFixture.sampleScenes).toHaveLength(4);
    expect(MOCK_SCENE_IDS).toHaveLength(4);
  });

  it('uses sequential unique scene order', () => {
    const orders = mockResultWorkspaceFixture.sampleScenes.map((scene) => scene.order);
    expect(orders).toEqual([1, 2, 3, 4]);
    expect(new Set(orders).size).toBe(4);
  });

  it('marks every sample scene with isSample true', () => {
    for (const scene of mockResultWorkspaceFixture.sampleScenes) {
      expect(scene.isSample).toBe(true);
    }
  });

  it('rejects scenes with isSample false', () => {
    const scene = {
      ...mockResultWorkspaceFixture.sampleScenes[0],
      isSample: false,
    };
    expect(() => MockSceneSchema.parse(scene)).toThrow();
  });

  it('keeps sample scene ids free of provider identifiers', () => {
    for (const scene of mockResultWorkspaceFixture.sampleScenes) {
      expect(scene.id.includes('provider')).toBe(false);
    }
    for (const sceneId of MOCK_SCENE_IDS) {
      expect(sceneId.includes('provider')).toBe(false);
    }
  });

  it('does not include generated timestamps on scenes', () => {
    for (const scene of mockResultWorkspaceFixture.sampleScenes) {
      expect(scene).not.toHaveProperty('generatedAt');
      expect(scene).not.toHaveProperty('createdAt');
    }
  });
});

describe('mock prompt sections', () => {
  it('uses unique approved prompt-section keys', () => {
    const keys = mockResultWorkspaceFixture.samplePromptSections.map((section) => section.key);
    expect(keys).toEqual([...MOCK_PROMPT_SECTION_KEYS]);
    expect(new Set(keys).size).toBe(MOCK_PROMPT_SECTION_KEYS.length);
  });

  it('marks every prompt section as sample', () => {
    for (const section of mockResultWorkspaceFixture.samplePromptSections) {
      expect(section.isSample).toBe(true);
      expect(() => MockPromptSectionSchema.parse(section)).not.toThrow();
    }
  });

  it('rejects unknown prompt-section keys', () => {
    expect(() =>
      MockPromptSectionSchema.parse({
        key: 'provider_syntax',
        label: 'Provider syntax',
        sampleContent: 'Invalid key.',
        isSample: true,
      }),
    ).toThrow();
    expect(MockPromptSectionKeySchema.options).not.toContain('provider_syntax');
  });
});

describe('provider reference state', () => {
  it('allows catalogue_reference only', () => {
    expect(PROVIDER_REFERENCE_STATES).toEqual(['catalogue_reference']);
    expect(ProviderReferenceStateSchema.parse('catalogue_reference')).toBe('catalogue_reference');
    expect(() => ProviderReferenceStateSchema.parse('recommended')).toThrow();
  });

  it('does not define recommendation states', () => {
    expect(PROVIDER_REFERENCE_STATES).not.toContain('recommended');
    expect(PROVIDER_REFERENCE_STATES).not.toContain('best_match');
    expect(PROVIDER_REFERENCE_STATES).not.toContain('winner');
  });
});

describe('evaluation states', () => {
  it('defines approved evaluation states only', () => {
    expect(EVALUATION_STATES).toEqual([
      'not_evaluated',
      'future_evaluation',
      'brief_available',
      'relevant',
      'not_requested',
    ]);
  });

  it('does not define passing or scoring states', () => {
    for (const state of ['passed', 'failed', 'verified', 'score'] as const) {
      expect(EVALUATION_STATES).not.toContain(state);
      expect(() => EvaluationStateSchema.parse(state)).toThrow();
    }
  });

  it('fixture uses only approved evaluation states', () => {
    const allItems = [
      ...mockResultWorkspaceFixture.continuityItems,
      ...mockResultWorkspaceFixture.audioEditingItems,
      ...mockResultWorkspaceFixture.qualityItems,
    ];

    for (const item of allItems) {
      expect(EVALUATION_STATES).toContain(item.evaluationState);
    }
  });
});

describe('forbidden workspace properties', () => {
  const forbiddenKeys = [
    'recommendationScore',
    'matchPercentage',
    'riskScore',
    'qualityScore',
    'estimatedCost',
    'selectedProvider',
    'winningProvider',
    'generationJobId',
    'artifactId',
    'downloadUrl',
    'generatedAt',
  ] as const;

  it.each(forbiddenKeys)('rejects view model with %s', (key) => {
    expect(() =>
      MockResultWorkspaceViewModelSchema.parse(validViewModel({ [key]: 'forbidden' })),
    ).toThrow();
  });
});

describe('static fixture schema', () => {
  it('validates the committed fixture', () => {
    expect(() =>
      MockResultWorkspaceStaticFixtureSchema.parse(mockResultWorkspaceFixture),
    ).not.toThrow();
  });

  it('requires a non-empty sample disclaimer', () => {
    expect(mockResultWorkspaceFixture.sampleDisclaimer.trim().length).toBeGreaterThan(0);
  });

  it('disclaimer references static or sample data', () => {
    const disclaimer = mockResultWorkspaceFixture.sampleDisclaimer.toLowerCase();
    expect(disclaimer).toMatch(/static|demonstration|sample/);
  });

  it('disclaimer states data was not generated or calculated', () => {
    const disclaimer = mockResultWorkspaceFixture.sampleDisclaimer.toLowerCase();
    expect(disclaimer).toMatch(/not been generated|have not been generated/);
    expect(disclaimer).toMatch(/calculated|recommended/);
  });

  it('uses the approved fixture version', () => {
    expect(mockResultWorkspaceFixture.fixtureVersion).toBe('mock-v1');
  });
});

describe('real summary acceptance', () => {
  it('accepts real project and brief summaries in the view model', () => {
    const parsed = MockResultWorkspaceViewModelSchema.parse(validViewModel());
    expect(parsed.project.title).toBe('Summer Launch');
    expect(parsed.brief.workingTitle).toBe('Summer Launch Brief');
    expect(parsed.brief.completedAt).toBe(COMPLETED_AT);
  });

  it('preserves provider lifecycle and access states', () => {
    const parsed = MockResultWorkspaceViewModelSchema.parse(
      validViewModel({
        providers: [
          validProviderReference({
            id: 'openai_sora',
            displayName: 'OpenAI Sora',
            lifecycleStatus: 'sunsetting',
            apiAccessStatus: 'preview',
            catalogueNotice: 'Sora is sunsetting.',
          }),
          ...validViewModel().providers.slice(1),
        ],
      }),
    );

    const sora = parsed.providers.find((provider) => provider.id === 'openai_sora');
    expect(sora?.lifecycleStatus).toBe('sunsetting');
    expect(sora?.apiAccessStatus).toBe('preview');
    expect(sora?.catalogueNotice).toBe('Sora is sunsetting.');
  });
});

describe('domain helpers', () => {
  it('truncates long source previews', () => {
    const longText = 'A'.repeat(200);
    const result = createSourcePreview(longText, 160);
    expect(result.characterCount).toBe(200);
    expect(result.preview.endsWith('…')).toBe(true);
    expect(result.preview.length).toBeLessThan(longText.length);
  });

  it('maps enabled production requirement labels', () => {
    const requirements = {
      ...createDefaultProductionRequirements(),
      voiceover: true,
      dialogue: true,
    };
    const labels = mapEnabledRequirementLabels(requirements);
    expect(labels).toContain('Voiceover narration');
    expect(labels).toContain('Spoken dialogue');
  });

  it('derives continuity evaluation state from requirements', () => {
    const requirements = {
      ...createDefaultProductionRequirements(),
      characterConsistency: true,
    };
    expect(deriveContinuityEvaluationState('characterConsistency', requirements)).toBe('relevant');
    expect(deriveContinuityEvaluationState('characterConsistency', null)).toBe('not_requested');
  });
});
