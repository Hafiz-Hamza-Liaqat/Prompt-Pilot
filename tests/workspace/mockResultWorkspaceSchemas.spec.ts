import { describe, expect, it } from 'vitest';
import { calculateComplexityRiskAssessment } from '../../src/domain/complexityRiskAssessment.js';
import { decomposeDurationIntoScenes } from '../../src/domain/sceneDecomposition.js';
import {
  DATA_ORIGINS,
  EVALUATION_STATES,
  MockPromptSectionKeySchema,
  MockPromptSectionSchema,
  MockResultWorkspaceStaticFixtureSchema,
  MockResultWorkspaceViewModelSchema,
  MOCK_PROMPT_SECTION_KEYS,
  PROVIDER_REFERENCE_STATES,
  ProviderReferenceStateSchema,
  SECTION_DATA_ORIGINS,
  WORKSPACE_FIXTURE_VERSION,
  WORKSPACE_MODES,
  WORKSPACE_PREVIEW_TITLE,
  WORKSPACE_SAMPLE_DISCLAIMER,
  WORKSPACE_SECTION_ORIGINS,
  WORKSPACE_SECTIONS,
  WorkspaceModeSchema,
  DataOriginSchema,
  SectionDataOriginSchema,
  EvaluationStateSchema,
  WorkspaceSectionSchema,
  WorkspaceSectionOriginsSchema,
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

function buildAssessment(durationSeconds = 30) {
  const decomposition = decomposeDurationIntoScenes(durationSeconds);
  return calculateComplexityRiskAssessment({
    durationSeconds,
    sceneCount: decomposition.sceneCount,
    sourceType: 'idea',
    userConstraints: null,
    productionRequirements: createDefaultProductionRequirements(),
  });
}

function validViewModel(overrides: Record<string, unknown> = {}) {
  return {
    mode: 'hybrid_preview' as const,
    dataOrigin: 'mixed' as const,
    isDecisionReady: false as const,
    fixtureVersion: WORKSPACE_FIXTURE_VERSION,
    sampleDisclaimer: WORKSPACE_SAMPLE_DISCLAIMER,
    previewTitle: WORKSPACE_PREVIEW_TITLE,
    sectionOrigins: WORKSPACE_SECTION_ORIGINS,
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
    sceneDecomposition: decomposeDurationIntoScenes(30),
    complexityRiskAssessment: buildAssessment(30),
    samplePromptSections: mockResultWorkspaceFixture.samplePromptSections,
    continuityItems: mockResultWorkspaceFixture.continuityItems,
    audioEditingItems: mockResultWorkspaceFixture.audioEditingItems,
    ...overrides,
  };
}

describe('workspace mode', () => {
  it('accepts only hybrid_preview', () => {
    expect(WORKSPACE_MODES).toEqual(['hybrid_preview']);
    expect(WorkspaceModeSchema.parse('hybrid_preview')).toBe('hybrid_preview');
    expect(() => WorkspaceModeSchema.parse('mock_preview')).toThrow();
  });
});

describe('data origin', () => {
  it('accepts only mixed at top level', () => {
    expect(DATA_ORIGINS).toEqual(['mixed']);
    expect(DataOriginSchema.parse('mixed')).toBe('mixed');
    expect(() => DataOriginSchema.parse('static_fixture')).toThrow();
  });

  it('defines approved section data origins', () => {
    expect(SECTION_DATA_ORIGINS).toEqual([
      'persisted_input',
      'catalogue_snapshot',
      'deterministic_rule_engine',
      'static_fixture',
    ]);
    for (const origin of SECTION_DATA_ORIGINS) {
      expect(() => SectionDataOriginSchema.parse(origin)).not.toThrow();
    }
  });

  it('maps each workspace section to an approved origin', () => {
    expect(WorkspaceSectionOriginsSchema.parse(WORKSPACE_SECTION_ORIGINS)).toEqual({
      overview: 'persisted_input',
      providers: 'catalogue_snapshot',
      scenes: 'deterministic_rule_engine',
      prompts: 'static_fixture',
      continuity: 'static_fixture',
      'audio-editing': 'static_fixture',
      quality: 'deterministic_rule_engine',
    });
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

describe('scene decomposition contract', () => {
  it('requires sceneDecomposition instead of sample scenes', () => {
    const parsed = MockResultWorkspaceViewModelSchema.parse(validViewModel());
    expect(parsed.sceneDecomposition.isAiGenerated).toBe(false);
    expect(parsed.sceneDecomposition.isPersisted).toBe(false);
    expect(parsed).not.toHaveProperty('sampleScenes');
  });

  it('rejects view models missing sceneDecomposition', () => {
    const withoutScenes = { ...validViewModel() };
    delete (withoutScenes as { sceneDecomposition?: unknown }).sceneDecomposition;
    expect(() => MockResultWorkspaceViewModelSchema.parse(withoutScenes)).toThrow();
  });
});

describe('complexity risk assessment contract', () => {
  it('requires complexityRiskAssessment instead of static quality items', () => {
    const parsed = MockResultWorkspaceViewModelSchema.parse(validViewModel());
    expect(parsed.complexityRiskAssessment.algorithmVersion).toBe('complexity-risk-v1');
    expect(parsed.complexityRiskAssessment.isAiGenerated).toBe(false);
    expect(parsed).not.toHaveProperty('qualityItems');
  });

  it('rejects view models missing complexityRiskAssessment', () => {
    const withoutAssessment = { ...validViewModel() };
    delete (withoutAssessment as { complexityRiskAssessment?: unknown }).complexityRiskAssessment;
    expect(() => MockResultWorkspaceViewModelSchema.parse(withoutAssessment)).toThrow();
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

  it('disclaimer references remaining static sections', () => {
    const disclaimer = mockResultWorkspaceFixture.sampleDisclaimer.toLowerCase();
    expect(disclaimer).toMatch(/static|demonstration/);
    expect(disclaimer).toContain('prompt');
  });

  it('disclaimer states no AI model or provider generated the plan', () => {
    const disclaimer = mockResultWorkspaceFixture.sampleDisclaimer.toLowerCase();
    expect(disclaimer).toContain('no ai model or provider');
  });

  it('uses the approved fixture version', () => {
    expect(mockResultWorkspaceFixture.fixtureVersion).toBe('workspace-v3');
  });

  it('does not include static quality items in the active fixture', () => {
    expect(mockResultWorkspaceFixture).not.toHaveProperty('qualityItems');
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
