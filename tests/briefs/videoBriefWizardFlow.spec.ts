import { describe, expect, it } from 'vitest';
import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';
import {
  WIZARD_INPUT_STEPS,
  WIZARD_STEPS,
  getFirstIncompleteStep,
  getNextStep,
  getPreviousStep,
  getProgressPercentage,
  getReachableSteps,
  getStepIndex,
  parseWizardStep,
} from '@/domain/videoBriefDraft';

const projectId = '33333333-3333-3333-3333-333333333333';
const now = '2026-07-04T12:00:00.000Z';

function emptyDraft(overrides: Partial<PartialVideoBriefDraft> = {}): PartialVideoBriefDraft {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    projectId,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function draftWithSource(): PartialVideoBriefDraft {
  return emptyDraft({
    sourceType: 'idea',
    sourceText: 'A compelling summer product launch concept for urban professionals.',
    sourceUrl: null,
  });
}

function draftThroughObjective(): PartialVideoBriefDraft {
  return {
    ...draftWithSource(),
    workingTitle: 'Summer Launch',
    objective: 'Showcase the new product line to young professionals seeking quality.',
    targetAudience: 'Urban professionals aged 25-35',
  };
}

describe('wizard step order', () => {
  it('orders all nine steps correctly', () => {
    expect([...WIZARD_STEPS]).toEqual([
      'source',
      'objective',
      'destination',
      'category',
      'duration',
      'style',
      'requirements',
      'priorities',
      'review',
    ]);
  });

  it('uses unique step values', () => {
    expect(new Set(WIZARD_STEPS).size).toBe(WIZARD_STEPS.length);
  });

  it('returns the previous step for each step after source', () => {
    expect(getPreviousStep('objective')).toBe('source');
    expect(getPreviousStep('destination')).toBe('objective');
    expect(getPreviousStep('review')).toBe('priorities');
  });

  it('returns null for the first step previous helper', () => {
    expect(getPreviousStep('source')).toBeNull();
  });

  it('returns the next step for each step before review', () => {
    expect(getNextStep('source')).toBe('objective');
    expect(getNextStep('priorities')).toBe('review');
  });

  it('returns null for the review step next helper', () => {
    expect(getNextStep('review')).toBeNull();
  });

  it('rejects invalid step values through the safe parser', () => {
    expect(parseWizardStep('generate')).toBeNull();
    expect(parseWizardStep(undefined)).toBeNull();
  });
});

describe('first incomplete step', () => {
  it('returns source for an empty draft', () => {
    expect(getFirstIncompleteStep(emptyDraft())).toBe('source');
  });

  it('advances to objective after source is complete', () => {
    expect(getFirstIncompleteStep(draftWithSource())).toBe('objective');
  });

  it('advances to destination after objective is complete', () => {
    expect(getFirstIncompleteStep(draftThroughObjective())).toBe('destination');
  });
});

describe('reachability and progress', () => {
  it('blocks later steps before prerequisites are saved', () => {
    const reachable = getReachableSteps(emptyDraft());
    expect(reachable).toEqual(['source']);
    expect(reachable).not.toContain('objective');
    expect(reachable).not.toContain('review');
  });

  it('allows completed earlier steps to remain reachable', () => {
    const reachable = getReachableSteps(draftThroughObjective());
    expect(reachable).toContain('source');
    expect(reachable).toContain('objective');
    expect(reachable).toContain('destination');
    expect(reachable).not.toContain('category');
  });

  it('never reports progress above 100 percent', () => {
    const fullDraft = emptyDraft({
      sourceType: 'idea',
      sourceText: 'A compelling summer product launch concept for urban professionals.',
      sourceUrl: null,
      workingTitle: 'Summer Launch',
      objective: 'Showcase the new product line to young professionals seeking quality.',
      targetAudience: 'Urban professionals aged 25-35',
      publishingDestination: 'youtube',
      aspectRatio: '16:9',
      videoCategory: 'product_advertisement',
      durationSeconds: 30,
      visualStyle: 'Cinematic',
      tone: 'Upbeat',
      productionRequirements: {
        characterConsistency: false,
        productConsistency: false,
        logoAccuracy: false,
        exactTextVisibility: false,
        nativeAudio: false,
        dialogue: false,
        voiceover: true,
        lipSync: false,
        multipleLocations: false,
        cameraControl: false,
        firstLastFrameControl: false,
        videoExtension: false,
        referenceImages: false,
        commercialUse: true,
      },
      budgetPriority: 'balanced',
      qualityPriority: 'highest_quality',
      userConstraints: null,
    });

    expect(getProgressPercentage(fullDraft)).toBeLessThanOrEqual(100);
    expect(getProgressPercentage(fullDraft)).toBe(100);
  });

  it('measures saved input-step completion rather than AI generation progress', () => {
    const halfComplete = draftThroughObjective();
    const percentage = getProgressPercentage(halfComplete);
    const expected = Math.round((2 / WIZARD_INPUT_STEPS.length) * 100);

    expect(percentage).toBe(expected);
    expect(percentage).toBeLessThan(100);
    expect(getStepIndex('review')).toBe(WIZARD_STEPS.length - 1);
  });
});
