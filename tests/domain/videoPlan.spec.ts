import { describe, expect, it } from 'vitest';
import { VideoPlanSchema } from '../../src/domain/videoPlan.js';
import { validVideoPlanFixture } from '../fixtures/validVideoPlan.js';

function cloneFixture() {
  return structuredClone(validVideoPlanFixture);
}

function parsePlan(data: unknown) {
  return VideoPlanSchema.safeParse(data);
}

describe('VideoPlanSchema', () => {
  it('parses the valid complete fixture successfully', () => {
    const result = parsePlan(validVideoPlanFixture);
    expect(result.success).toBe(true);
  });

  it('rejects an unsupported AI-video provider', () => {
    const data = cloneFixture();
    data.providerRecommendations[0]!.providerId = 'invalid_provider' as typeof data.providerRecommendations[0]['providerId'];
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects an unsupported publishing destination', () => {
    const data = cloneFixture();
    data.videoBrief.publishingDestination = 'snapchat' as typeof data.videoBrief.publishingDestination;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects an unsupported video category', () => {
    const data = cloneFixture();
    data.videoBrief.videoCategory = 'brand_film' as typeof data.videoBrief.videoCategory;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects a duration below five seconds', () => {
    const data = cloneFixture();
    data.videoBrief.durationSeconds = 4;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects a duration above 180 seconds', () => {
    const data = cloneFixture();
    data.videoBrief.durationSeconds = 181;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects an empty scene timeline', () => {
    const data = cloneFixture();
    data.sceneTimeline = [];
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects a scene ending before it starts', () => {
    const data = cloneFixture();
    data.sceneTimeline[0]!.endSecond = 0;
    data.sceneTimeline[0]!.durationSeconds = 0;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects a scene duration mismatch', () => {
    const data = cloneFixture();
    data.sceneTimeline[0]!.durationSeconds = 5;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects overlapping scenes', () => {
    const data = cloneFixture();
    data.sceneTimeline[1]!.startSecond = 7;
    data.sceneTimeline[1]!.endSecond = 14;
    data.sceneTimeline[1]!.durationSeconds = 7;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects a gap before the first scene', () => {
    const data = cloneFixture();
    data.sceneTimeline[0]!.startSecond = 2;
    data.sceneTimeline[0]!.endSecond = 10;
    data.sceneTimeline[0]!.durationSeconds = 8;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects a final scene that does not reach the requested duration', () => {
    const data = cloneFixture();
    data.sceneTimeline[3]!.endSecond = 28;
    data.sceneTimeline[3]!.durationSeconds = 5;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects a total scene duration mismatch', () => {
    const data = cloneFixture();
    data.sceneTimeline[3]!.endSecond = 29;
    data.sceneTimeline[3]!.durationSeconds = 6;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects duplicate scene numbers', () => {
    const data = cloneFixture();
    data.sceneTimeline[1]!.sceneNumber = 1;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects non-sequential scene numbers', () => {
    const data = cloneFixture();
    data.sceneTimeline[2]!.sceneNumber = 5;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects duplicate generation order values', () => {
    const data = cloneFixture();
    data.sceneTimeline[1]!.generationOrder = 1;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects a compiled-prompt scene identifier mismatch', () => {
    const data = cloneFixture();
    data.sceneTimeline[0]!.compiledPrompts[0]!.sceneId = 'scene-wrong';
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects a scene recommended provider missing from recommendations', () => {
    const data = cloneFixture();
    data.sceneTimeline[0]!.recommendedProvider = 'google_veo';
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects a compiled-prompt provider missing from recommendations', () => {
    const data = cloneFixture();
    data.sceneTimeline[0]!.compiledPrompts[0]!.provider = 'adobe_firefly';
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects duplicate recommendation providers', () => {
    const data = cloneFixture();
    data.providerRecommendations[1]!.providerId = 'runway';
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects an ineligible primary provider', () => {
    const data = cloneFixture();
    data.providerRecommendations[0]!.eligible = false;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects a primary provider with a disqualification reason', () => {
    const data = cloneFixture();
    data.providerRecommendations[0]!.disqualificationReasons = ['Does not support required aspect ratio'];
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects an unknown continuity-lock reference', () => {
    const data = cloneFixture();
    data.sceneTimeline[0]!.continuityLockIds.push('missing-lock');
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects mismatched project identifiers', () => {
    const data = cloneFixture();
    data.projectId = 'project-mismatch';
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects updatedAt earlier than createdAt', () => {
    const data = cloneFixture();
    data.updatedAt = '2026-07-03T10:00:00.000Z';
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid HTTP/HTTPS source reference URL', () => {
    const data = cloneFixture();
    data.videoBrief.sourceAnalysis.sourceReferences = [
      { label: 'Bad source', url: 'ftp://example.com/page' },
    ];
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects empty required prompt content', () => {
    const data = cloneFixture();
    data.sceneTimeline[0]!.compiledPrompts[0]!.mainPrompt = '   ';
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects a quality score outside 0 through 100', () => {
    const data = cloneFixture();
    data.qualityAudit.overallReadinessScore = 101;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('accepts qualityPriority fastest', () => {
    const data = cloneFixture();
    data.videoBrief.qualityPriority = 'fastest';
    const result = parsePlan(data);
    expect(result.success).toBe(true);
  });

  it('accepts qualityPriority balanced', () => {
    const data = cloneFixture();
    data.videoBrief.qualityPriority = 'balanced';
    const result = parsePlan(data);
    expect(result.success).toBe(true);
  });

  it('accepts qualityPriority highest_quality', () => {
    const data = cloneFixture();
    data.videoBrief.qualityPriority = 'highest_quality';
    const result = parsePlan(data);
    expect(result.success).toBe(true);
  });

  it('rejects qualityPriority free_only', () => {
    const data = cloneFixture();
    data.videoBrief.qualityPriority = 'free_only' as typeof data.videoBrief.qualityPriority;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('rejects qualityPriority low_cost', () => {
    const data = cloneFixture();
    data.videoBrief.qualityPriority = 'low_cost' as typeof data.videoBrief.qualityPriority;
    const result = parsePlan(data);
    expect(result.success).toBe(false);
  });

  it('accepts budgetPriority free_only', () => {
    const data = cloneFixture();
    data.videoBrief.budgetPriority = 'free_only';
    const result = parsePlan(data);
    expect(result.success).toBe(true);
  });

  it('accepts budgetPriority low_cost', () => {
    const data = cloneFixture();
    data.videoBrief.budgetPriority = 'low_cost';
    const result = parsePlan(data);
    expect(result.success).toBe(true);
  });
});
