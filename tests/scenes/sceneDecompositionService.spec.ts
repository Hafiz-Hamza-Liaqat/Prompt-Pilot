import { describe, expect, it } from 'vitest';
import { createDefaultProductionRequirements } from '../../src/domain/productionRequirements.js';
import type { PartialVideoBriefDraft } from '../../src/domain/videoBriefDraft.js';
import {
  createSceneDecompositionService,
  decomposeBriefDuration,
  decomposeCompletedBrief,
} from '../../src/server/scenes/scene-decomposition-service.js';

const COMPLETED_AT = '2026-07-04T12:00:00+00:00';

function buildBrief(overrides: Partial<PartialVideoBriefDraft> = {}): PartialVideoBriefDraft {
  return {
    id: '44444444-4444-4444-4444-444444444444',
    projectId: '33333333-3333-3333-3333-333333333333',
    sourceType: 'idea',
    sourceText: 'A compelling summer product launch concept.',
    sourceUrl: 'https://example.com/source',
    workingTitle: 'Summer Launch',
    objective: 'Showcase the new product line.',
    targetAudience: 'Urban professionals',
    publishingDestination: 'youtube',
    aspectRatio: '16:9',
    videoCategory: 'product_advertisement',
    durationSeconds: 30,
    visualStyle: 'Cinematic',
    tone: 'Upbeat',
    productionRequirements: createDefaultProductionRequirements(),
    budgetPriority: 'balanced',
    qualityPriority: 'highest_quality',
    userConstraints: null,
    completedAt: COMPLETED_AT,
    createdAt: COMPLETED_AT,
    updatedAt: COMPLETED_AT,
    ...overrides,
  };
}

describe('SceneDecompositionService', () => {
  const service = createSceneDecompositionService();

  it('succeeds for completed brief with valid duration', () => {
    const result = service.decomposeCompletedBrief(buildBrief());
    expect(result.ok).toBe(true);
  });

  it('returns brief required for draft brief', () => {
    const result = decomposeCompletedBrief(buildBrief({ completedAt: null }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('brief_required');
    }
  });

  it('returns brief required when completion timestamp is missing', () => {
    const result = decomposeBriefDuration({ completedAt: null, durationSeconds: 30 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('brief_required');
    }
  });

  it('returns two scenes for five-second brief', () => {
    const result = decomposeCompletedBrief(buildBrief({ durationSeconds: 5 }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sceneCount).toBe(2);
    }
  });

  it('returns six scenes for sixty-second brief', () => {
    const result = decomposeCompletedBrief(buildBrief({ durationSeconds: 60 }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sceneCount).toBe(6);
    }
  });

  it('returns twelve scenes for one-hundred-eighty-second brief', () => {
    const result = decomposeCompletedBrief(buildBrief({ durationSeconds: 180 }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sceneCount).toBe(12);
    }
  });

  it('matches result duration to brief duration', () => {
    const result = decomposeCompletedBrief(buildBrief({ durationSeconds: 45 }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.totalDurationSeconds).toBe(45);
    }
  });

  it('returns deterministic output', () => {
    const first = decomposeCompletedBrief(buildBrief({ durationSeconds: 60 }));
    const second = decomposeCompletedBrief(buildBrief({ durationSeconds: 60 }));
    expect(first).toEqual(second);
  });

  it('marks output as not AI-generated', () => {
    const result = decomposeCompletedBrief(buildBrief());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.isAiGenerated).toBe(false);
    }
  });

  it('marks output as not persisted', () => {
    const result = decomposeCompletedBrief(buildBrief());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.isPersisted).toBe(false);
    }
  });

  it('performs no repository mutation', () => {
    const source = createSceneDecompositionService.toString();
    expect(source).not.toContain('repository');
    expect(source).not.toContain('.insert(');
    expect(source).not.toContain('.update(');
    expect(source).not.toContain('.delete(');
  });

  it('has no provider dependency', () => {
    const source = createSceneDecompositionService.toString();
    expect(source).not.toContain('provider');
    expect(source).not.toContain('catalogue');
  });

  it('makes no external request', () => {
    const source = createSceneDecompositionService.toString();
    expect(source).not.toContain('fetch(');
  });

  it('maps invalid duration safely', () => {
    const result = decomposeCompletedBrief(buildBrief({ durationSeconds: 4 }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('invalid_duration');
    }
  });

  it('does not require full brief text', () => {
    const result = decomposeCompletedBrief(
      buildBrief({ sourceText: null, objective: null, workingTitle: null }),
    );
    expect(result.ok).toBe(true);
  });

  it('does not fetch source URL', () => {
    const source = createSceneDecompositionService.toString();
    expect(source).not.toContain('sourceUrl');
    expect(source).not.toContain('fetch(');
  });

  it('does not alter scene count by video category', () => {
    const baseline = decomposeCompletedBrief(buildBrief({ durationSeconds: 60 }));
    const variant = decomposeCompletedBrief(
      buildBrief({ durationSeconds: 60, videoCategory: 'explainer' }),
    );
    expect(baseline).toEqual(variant);
  });

  it('does not alter scene count by publishing destination', () => {
    const baseline = decomposeCompletedBrief(buildBrief({ durationSeconds: 60 }));
    const variant = decomposeCompletedBrief(
      buildBrief({ durationSeconds: 60, publishingDestination: 'instagram_reels' }),
    );
    expect(baseline).toEqual(variant);
  });

  it('does not alter scene count by production requirements', () => {
    const baseline = decomposeCompletedBrief(buildBrief({ durationSeconds: 60 }));
    const variant = decomposeCompletedBrief(
      buildBrief({
        durationSeconds: 60,
        productionRequirements: {
          ...createDefaultProductionRequirements(),
          voiceover: true,
          dialogue: true,
          characterConsistency: true,
        },
      }),
    );
    expect(baseline).toEqual(variant);
  });

  it('does not alter scene count by budget priority', () => {
    const baseline = decomposeCompletedBrief(buildBrief({ durationSeconds: 60 }));
    const variant = decomposeCompletedBrief(
      buildBrief({ durationSeconds: 60, budgetPriority: 'low_cost' }),
    );
    expect(baseline).toEqual(variant);
  });

  it('does not alter scene count by quality priority', () => {
    const baseline = decomposeCompletedBrief(buildBrief({ durationSeconds: 60 }));
    const variant = decomposeCompletedBrief(
      buildBrief({ durationSeconds: 60, qualityPriority: 'fastest' }),
    );
    expect(baseline).toEqual(variant);
  });

  it('returns no complexity or risk values', () => {
    const result = decomposeCompletedBrief(buildBrief());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('complexityScore');
      expect(result.data).not.toHaveProperty('riskScore');
      expect(result.data).not.toHaveProperty('qualityScore');
    }
  });
});
