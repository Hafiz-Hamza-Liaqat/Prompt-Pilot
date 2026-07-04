import { describe, expect, it } from 'vitest';
import {
  ASPECT_RATIOS,
  BUDGET_PRIORITIES,
  PUBLISHING_DESTINATIONS,
  QUALITY_PRIORITIES,
  VIDEO_CATEGORIES,
} from '@/domain/constants';
import {
  BRIEF_ACTION_STATUSES,
  CompleteVideoBriefDraftSchema,
  PartialVideoBriefDraftSchema,
  WizardStepSchema,
  WIZARD_SOURCE_TYPES,
  briefIdSchema,
  destinationStepSchema,
  durationStepSchema,
  ideaSourceTextSchema,
  isBriefActionStatus,
  objectiveStepSchema,
  parseCheckboxValue,
  parseWizardStep,
  prioritiesStepSchema,
  requirementsStepSchema,
  scriptSourceTextSchema,
  sourceStepSchema,
  styleStepSchema,
  userConstraintsSchema,
  wizardSourceUrlSchema,
  workingTitleSchema,
} from '@/domain/videoBriefDraft';

const projectId = '33333333-3333-3333-3333-333333333333';
const briefId = '11111111-1111-1111-1111-111111111111';
const now = '2026-07-04T12:00:00.000Z';

const validIdeaText = 'A compelling summer product launch concept for urban professionals.';
const validScriptText = 'Scene one opens on a city skyline at dawn with a calm narration.';
const validUrl = 'https://example.com/product';

const emptyRequirements = {
  characterConsistency: false,
  productConsistency: false,
  logoAccuracy: false,
  exactTextVisibility: false,
  nativeAudio: false,
  dialogue: false,
  voiceover: false,
  lipSync: false,
  multipleLocations: false,
  cameraControl: false,
  firstLastFrameControl: false,
  videoExtension: false,
  referenceImages: false,
  commercialUse: false,
};

function completeDraftInput(overrides: Record<string, unknown> = {}) {
  return {
    id: briefId,
    projectId,
    sourceType: 'idea',
    sourceText: validIdeaText,
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
      ...emptyRequirements,
      voiceover: true,
      commercialUse: true,
    },
    budgetPriority: 'balanced',
    qualityPriority: 'highest_quality',
    userConstraints: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('source step schemas', () => {
  it('validates idea source text', () => {
    expect(ideaSourceTextSchema.parse(validIdeaText)).toBe(validIdeaText);
  });

  it('rejects short idea text', () => {
    expect(() => ideaSourceTextSchema.parse('too short')).toThrow();
  });

  it('validates script source text', () => {
    expect(scriptSourceTextSchema.parse(validScriptText)).toBe(validScriptText);
  });

  it('rejects script text over 20,000 characters', () => {
    expect(() => scriptSourceTextSchema.parse('a'.repeat(20_001))).toThrow();
  });

  it('validates product URLs', () => {
    expect(
      sourceStepSchema.parse({
        sourceType: 'product_url',
        sourceUrl: validUrl,
      }),
    ).toEqual({
      sourceType: 'product_url',
      sourceText: null,
      sourceUrl: validUrl,
    });
  });

  it('validates article URLs', () => {
    expect(
      sourceStepSchema.parse({
        sourceType: 'article_url',
        sourceUrl: 'https://example.com/article',
      }).sourceUrl,
    ).toBe('https://example.com/article');
  });

  it('rejects non-HTTP URLs', () => {
    expect(() => wizardSourceUrlSchema.parse('ftp://example.com/file')).toThrow();
  });

  it('rejects URLs with embedded credentials', () => {
    expect(() => wizardSourceUrlSchema.parse('https://user:pass@example.com/product')).toThrow();
  });

  it('rejects protocol-relative URLs', () => {
    expect(() => wizardSourceUrlSchema.parse('//example.com/product')).toThrow();
  });

  it('rejects or clears irrelevant source fields safely', () => {
    expect(
      sourceStepSchema.safeParse({
        sourceType: 'idea',
        sourceText: validIdeaText,
        sourceUrl: 'https://example.com/ignored',
      }).success,
    ).toBe(false);

    expect(
      sourceStepSchema.safeParse({
        sourceType: 'product_url',
        sourceUrl: validUrl,
        sourceText: 'This text should not remain on a URL source step.',
      }).success,
    ).toBe(false);

    expect(
      sourceStepSchema.parse({
        sourceType: 'idea',
        sourceText: validIdeaText,
      }),
    ).toEqual({
      sourceType: 'idea',
      sourceText: validIdeaText,
      sourceUrl: null,
    });
  });

  it('excludes template from wizard source types', () => {
    expect(WIZARD_SOURCE_TYPES).not.toContain('template');
    expect(WIZARD_SOURCE_TYPES).toHaveLength(4);
  });
});

describe('objective step schemas', () => {
  it('accepts a valid working title', () => {
    expect(workingTitleSchema.parse('Summer Launch')).toBe('Summer Launch');
  });

  it('rejects an empty working title', () => {
    expect(() => workingTitleSchema.parse('   ')).toThrow();
  });

  it('rejects objectives below the minimum length', () => {
    expect(() =>
      objectiveStepSchema.parse({
        workingTitle: 'Launch',
        objective: 'Too short',
        targetAudience: 'Professionals',
      }),
    ).toThrow();
  });

  it('rejects target audiences below the minimum length', () => {
    expect(() =>
      objectiveStepSchema.parse({
        workingTitle: 'Launch',
        objective: 'Showcase the new product line to young professionals seeking quality.',
        targetAudience: 'A',
      }),
    ).toThrow();
  });
});

describe('destination and category schemas', () => {
  it('parses every publishing destination value', () => {
    for (const destination of PUBLISHING_DESTINATIONS) {
      expect(
        destinationStepSchema.parse({
          publishingDestination: destination,
          aspectRatio: '16:9',
        }).publishingDestination,
      ).toBe(destination);
    }
  });

  it('parses every aspect ratio value', () => {
    for (const aspectRatio of ASPECT_RATIOS) {
      expect(
        destinationStepSchema.parse({
          publishingDestination: 'youtube',
          aspectRatio,
        }).aspectRatio,
      ).toBe(aspectRatio);
    }
  });

  it('parses every video category value', () => {
    for (const videoCategory of VIDEO_CATEGORIES) {
      expect(
        CompleteVideoBriefDraftSchema.safeParse(
          completeDraftInput({ videoCategory }),
        ).success,
      ).toBe(true);
    }
  });
});

describe('duration step schema', () => {
  it('parses an authoritative duration preset', () => {
    expect(durationStepSchema.parse({ durationSeconds: 30 }).durationSeconds).toBe(30);
  });

  it('parses a valid custom duration', () => {
    expect(durationStepSchema.parse({ durationSeconds: 47 }).durationSeconds).toBe(47);
  });

  it('rejects decimal durations', () => {
    expect(() => durationStepSchema.parse({ durationSeconds: 30.5 })).toThrow();
  });

  it('rejects durations below five seconds', () => {
    expect(() => durationStepSchema.parse({ durationSeconds: 4 })).toThrow();
  });

  it('rejects durations above one hundred eighty seconds', () => {
    expect(() => durationStepSchema.parse({ durationSeconds: 181 })).toThrow();
  });
});

describe('style step schema', () => {
  it('validates visual style', () => {
    expect(
      styleStepSchema.parse({
        visualStyle: 'Cinematic',
        tone: 'Upbeat',
      }).visualStyle,
    ).toBe('Cinematic');
  });

  it('validates tone', () => {
    expect(
      styleStepSchema.parse({
        visualStyle: 'Cinematic',
        tone: 'Upbeat',
      }).tone,
    ).toBe('Upbeat');
  });
});

describe('requirements and priorities schemas', () => {
  it('maps checked checkbox values to true', () => {
    expect(parseCheckboxValue('on')).toBe(true);
    expect(parseCheckboxValue('true')).toBe(true);
  });

  it('maps missing checkbox values to false', () => {
    expect(parseCheckboxValue(null)).toBe(false);
    expect(parseCheckboxValue(undefined)).toBe(false);
  });

  it('does not treat arbitrary strings as checked values', () => {
    expect(parseCheckboxValue('yes')).toBe(false);
    expect(parseCheckboxValue('1')).toBe(false);
    expect(parseCheckboxValue('checked')).toBe(false);
  });

  it('keeps budget and quality priorities distinct enums', () => {
    expect(BUDGET_PRIORITIES).not.toEqual(QUALITY_PRIORITIES);
    expect(
      prioritiesStepSchema.parse({
        budgetPriority: 'balanced',
        qualityPriority: 'highest_quality',
        userConstraints: '',
      }),
    ).toEqual({
      budgetPriority: 'balanced',
      qualityPriority: 'highest_quality',
      userConstraints: null,
    });
  });

  it('normalizes empty constraints to null', () => {
    expect(userConstraintsSchema.parse('')).toBeNull();
    expect(userConstraintsSchema.parse(undefined)).toBeNull();
  });

  it('accepts a full requirements object', () => {
    expect(
      requirementsStepSchema.parse({
        productionRequirements: {
          ...emptyRequirements,
          voiceover: true,
        },
      }).productionRequirements.voiceover,
    ).toBe(true);
  });

  it('preserves non-empty constraints text', () => {
    expect(userConstraintsSchema.parse('Avoid on-screen text overlays.')).toBe(
      'Avoid on-screen text overlays.',
    );
  });
});

describe('draft and action-state contracts', () => {
  it('accepts a complete draft', () => {
    expect(CompleteVideoBriefDraftSchema.safeParse(completeDraftInput()).success).toBe(true);
  });

  it('rejects a complete draft missing a required field', () => {
    expect(
      CompleteVideoBriefDraftSchema.safeParse(
        completeDraftInput({ workingTitle: '   ' }),
      ).success,
    ).toBe(false);
  });

  it('rejects unknown action states', () => {
    expect(isBriefActionStatus('idle')).toBe(true);
    expect(isBriefActionStatus('validation_error')).toBe(true);
    expect(isBriefActionStatus('database exploded')).toBe(false);
  });

  it('accepts valid brief IDs', () => {
    expect(briefIdSchema.parse(briefId)).toBe(briefId);
  });

  it('accepts partial drafts with nullable fields', () => {
    expect(
      PartialVideoBriefDraftSchema.safeParse({
        id: briefId,
        projectId,
        createdAt: now,
        updatedAt: now,
      }).success,
    ).toBe(true);
  });

  it('parses valid wizard steps', () => {
    expect(parseWizardStep('review')).toBe('review');
    expect(WizardStepSchema.parse('source')).toBe('source');
  });

  it('recognizes every approved brief action status', () => {
    for (const status of BRIEF_ACTION_STATUSES) {
      expect(isBriefActionStatus(status)).toBe(true);
    }
  });

  it('allows line breaks in long idea text', () => {
    const multiline = `${validIdeaText}\nSecond paragraph with more detail.`;
    expect(ideaSourceTextSchema.parse(multiline)).toBe(multiline);
  });

  it('rejects invalid brief IDs', () => {
    expect(() => briefIdSchema.parse('not-a-uuid')).toThrow();
  });

  it('rejects inconsistent URL source drafts at completion time', () => {
    expect(
      CompleteVideoBriefDraftSchema.safeParse(
        completeDraftInput({
          sourceType: 'product_url',
          sourceText: validIdeaText,
          sourceUrl: null,
        }),
      ).success,
    ).toBe(false);
  });

  it('rejects invalid budget priorities in priorities step', () => {
    expect(() =>
      prioritiesStepSchema.parse({
        budgetPriority: 'cheapest_possible',
        qualityPriority: 'balanced',
        userConstraints: null,
      }),
    ).toThrow();
  });
});
