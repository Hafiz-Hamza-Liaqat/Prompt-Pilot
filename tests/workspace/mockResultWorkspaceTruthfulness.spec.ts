import { describe, expect, it } from 'vitest';
import {
  assertWorkspaceTruthfulness,
  MockResultWorkspaceViewModelSchema,
  WORKSPACE_PREVIEW_TITLE,
  WORKSPACE_SAMPLE_DISCLAIMER,
  WORKSPACE_SECTION_ORIGINS,
} from '../../src/domain/mockResultWorkspace.js';
import { calculateComplexityRiskAssessment } from '../../src/domain/complexityRiskAssessment.js';
import { decomposeDurationIntoScenes } from '../../src/domain/sceneDecomposition.js';
import { createDefaultProductionRequirements } from '../../src/domain/productionRequirements.js';
import { mockResultWorkspaceFixture } from '../../src/fixtures/mock-result-workspace.js';
import {
  containsRetiredProductName,
  RETIRED_PRODUCT_NAMES,
} from '../../src/domain/providerCatalogue.js';

const PROJECT_ID = '33333333-3333-3333-3333-333333333333';
const BRIEF_ID = '44444444-4444-4444-4444-444444444444';

function buildTruthfulViewModel() {
  return MockResultWorkspaceViewModelSchema.parse({
    mode: 'hybrid_preview',
    dataOrigin: 'mixed',
    isDecisionReady: false,
    fixtureVersion: 'workspace-v3',
    sampleDisclaimer: WORKSPACE_SAMPLE_DISCLAIMER,
    previewTitle: WORKSPACE_PREVIEW_TITLE,
    sectionOrigins: WORKSPACE_SECTION_ORIGINS,
    activeSection: 'overview',
    project: {
      id: PROJECT_ID,
      title: 'Summer Launch',
      description: null,
      status: 'active',
    },
    brief: {
      id: BRIEF_ID,
      projectId: PROJECT_ID,
      workingTitle: 'Summer Launch Brief',
      objective: 'Showcase the new product line.',
      targetAudience: 'Urban professionals',
      publishingDestination: 'youtube',
      aspectRatio: '16:9',
      videoCategory: 'product_advertisement',
      durationSeconds: 30,
      visualStyle: 'Cinematic',
      tone: 'Upbeat',
      budgetPriority: 'balanced',
      qualityPriority: 'highest_quality',
      enabledRequirementLabels: [],
      sourceType: 'idea',
      sourcePreview: 'A compelling concept.',
      sourceCharacterCount: 20,
      sourceUrl: null,
      completedAt: '2026-07-04T12:00:00+00:00',
    },
    providers: [
      {
        id: 'adobe_firefly',
        displayName: 'Adobe Firefly',
        lifecycleStatus: 'active',
        apiAccessStatus: 'public',
        freshness: 'fresh',
        catalogueNotice: null,
        sunsetAt: null,
        referenceState: 'catalogue_reference',
      },
      {
        id: 'google_veo',
        displayName: 'Google Veo',
        lifecycleStatus: 'active',
        apiAccessStatus: 'public',
        freshness: 'fresh',
        catalogueNotice: null,
        sunsetAt: null,
        referenceState: 'catalogue_reference',
      },
      {
        id: 'kling',
        displayName: 'Kling',
        lifecycleStatus: 'active',
        apiAccessStatus: 'public',
        freshness: 'fresh',
        catalogueNotice: null,
        sunsetAt: null,
        referenceState: 'catalogue_reference',
      },
      {
        id: 'openai_sora',
        displayName: 'OpenAI Sora',
        lifecycleStatus: 'sunsetting',
        apiAccessStatus: 'preview',
        freshness: 'fresh',
        catalogueNotice: 'Sora is sunsetting.',
        sunsetAt: null,
        referenceState: 'catalogue_reference',
      },
      {
        id: 'runway',
        displayName: 'Runway',
        lifecycleStatus: 'active',
        apiAccessStatus: 'public',
        freshness: 'fresh',
        catalogueNotice: null,
        sunsetAt: null,
        referenceState: 'catalogue_reference',
      },
    ],
    sceneDecomposition: decomposeDurationIntoScenes(30),
    complexityRiskAssessment: calculateComplexityRiskAssessment({
      durationSeconds: 30,
      sceneCount: 3,
      sourceType: 'idea',
      userConstraints: null,
      productionRequirements: createDefaultProductionRequirements(),
    }),
    samplePromptSections: mockResultWorkspaceFixture.samplePromptSections,
    continuityItems: mockResultWorkspaceFixture.continuityItems,
    audioEditingItems: mockResultWorkspaceFixture.audioEditingItems,
  });
}

function collectFixtureText(): string {
  return JSON.stringify(mockResultWorkspaceFixture).toLowerCase();
}

describe('workspace disclaimer wording', () => {
  it('uses the approved sample disclaimer constant', () => {
    expect(WORKSPACE_SAMPLE_DISCLAIMER).toBe(mockResultWorkspaceFixture.sampleDisclaimer);
    expect(WORKSPACE_SAMPLE_DISCLAIMER).toContain('static demonstration data');
  });

  it('uses the approved preview title', () => {
    expect(WORKSPACE_PREVIEW_TITLE).toBe('Planning workspace preview');
  });

  it('states remaining sections use static data', () => {
    expect(WORKSPACE_SAMPLE_DISCLAIMER.toLowerCase()).toContain('static demonstration data');
    expect(WORKSPACE_SAMPLE_DISCLAIMER.toLowerCase()).toContain('recommended');
  });

  it('does not claim assessments are AI-generated', () => {
    const model = buildTruthfulViewModel();
    expect(model.complexityRiskAssessment.isAiGenerated).toBe(false);
    expect(model.complexityRiskAssessment.complexity.score).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(model.complexityRiskAssessment).toLowerCase()).not.toContain(
      'success probability',
    );
  });
});

describe('retired product names', () => {
  it('fixture contains no retired product names', () => {
    const fixtureText = collectFixtureText();
    for (const name of RETIRED_PRODUCT_NAMES) {
      expect(fixtureText).not.toContain(name);
      expect(containsRetiredProductName(name)).toBe(true);
    }
  });

  it('disclaimer and preview title contain no retired names', () => {
    const copy = `${WORKSPACE_SAMPLE_DISCLAIMER} ${WORKSPACE_PREVIEW_TITLE}`.toLowerCase();
    expect(copy).not.toContain('prompt pilot pro');
    expect(copy).not.toContain('video pilot');
    expect(copy).not.toContain('ai video generator');
  });
});

describe('media generation claims', () => {
  it('fixture does not claim media was generated', () => {
    const fixtureText = collectFixtureText();
    expect(fixtureText).not.toMatch(/\bgenerated video\b/);
    expect(fixtureText).not.toMatch(/\brendered output\b/);
    expect(fixtureText).not.toMatch(/\bcreate video\b/);
  });

  it('fixture explicitly negates generation where audio is mentioned', () => {
    const audioSection = mockResultWorkspaceFixture.samplePromptSections.find(
      (section) => section.key === 'audio_notes',
    );
    expect(audioSection?.sampleContent.toLowerCase()).toContain('no dialogue or voiceover is generated');
  });

  it('prompt sections defer executable generation', () => {
    const promptSection = mockResultWorkspaceFixture.samplePromptSections.find(
      (section) => section.key === 'scene_objective',
    );
    expect(promptSection?.sampleContent.toLowerCase()).toContain('preview');
  });
});

describe('assertWorkspaceTruthfulness', () => {
  it('passes for a valid workspace view model', () => {
    const model = buildTruthfulViewModel();
    expect(() => assertWorkspaceTruthfulness(model)).not.toThrow();
  });

  it('throws when forbidden properties are present', () => {
    const model = buildTruthfulViewModel();
    const polluted = {
      ...model,
      recommendationScore: 0.9,
    } as typeof model & { recommendationScore: number };

    expect(() => assertWorkspaceTruthfulness(polluted)).toThrow(
      'Forbidden workspace property: recommendationScore',
    );
  });

  it('throws for each prohibited planning-output property', () => {
    const model = buildTruthfulViewModel();
    const forbidden = [
      'matchPercentage',
      'riskScore',
      'qualityScore',
      'selectedProvider',
      'winningProvider',
      'generationJobId',
      'artifactId',
      'downloadUrl',
      'generatedAt',
      'estimatedCost',
    ] as const;

    for (const key of forbidden) {
      const polluted = { ...model, [key]: 'bad' } as typeof model & Record<string, string>;
      expect(() => assertWorkspaceTruthfulness(polluted)).toThrow(
        `Forbidden workspace property: ${key}`,
      );
    }
  });
});
