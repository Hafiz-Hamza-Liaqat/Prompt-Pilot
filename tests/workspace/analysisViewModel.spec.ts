import { describe, expect, it } from 'vitest';
import type { ReferenceVideoAnalysis } from '../../src/domain/canonical/referenceVideoAnalysis.js';
import { mapAnalysisToViewModel } from '../../src/server/workspace/analysis-view-model.js';
import { validReferenceVideoAnalysisFixture } from '../fixtures/validReferenceVideoAnalysis.js';

function cloneFixture(): ReferenceVideoAnalysis {
  return structuredClone(validReferenceVideoAnalysisFixture);
}

describe('mapAnalysisToViewModel', () => {
  it('maps validReferenceVideoAnalysisFixture to MVP panels with canonical values', () => {
    const viewModel = mapAnalysisToViewModel(validReferenceVideoAnalysisFixture);

    expect(viewModel.summary.referenceKind).toBe('youtube_url');
    expect(viewModel.summary.pipelineVersion).toBe('1.0.0');
    expect(viewModel.summary.version.analysisVersion).toBe(1);
    expect(viewModel.metadata.title).toBe('Sample reference video');
    expect(viewModel.metadata.platform).toBe('youtube');
    expect(viewModel.transcript.transcriptSource).toBe('platform_caption');
    expect(viewModel.scenes.sceneCount).toBe(2);
    expect(viewModel.story.storySummary).toContain('product value');
    expect(viewModel.hooks.hookPattern).toBe('visual reveal');
    expect(viewModel.audience.audienceSignals).toEqual([
      'fitness lifestyle cues',
      'wellness product category',
    ]);
    expect(viewModel.cta.ctaPresent).toBe(true);
    expect(viewModel.camera.framingPatterns).toEqual(['medium close-up dominant']);
    expect(viewModel.editing.cutRate).toBe(14);
    expect(viewModel.safety.transformationNotice).toContain('transformative');
  });

  it('excludes storageLocator from the media panel', () => {
    const analysis = cloneFixture();
    analysis.media = {
      ...analysis.media,
      storageLocator: 's3://internal/bucket/object-key',
    };

    const viewModel = mapAnalysisToViewModel(analysis);

    expect(viewModel.media).not.toHaveProperty('storageLocator');
    expect(viewModel.media.mediaKind).toBe('video');
    expect(viewModel.media.hasVideoTrack).toBe(true);
  });

  it('preserves scene segment confidence classifications', () => {
    const viewModel = mapAnalysisToViewModel(validReferenceVideoAnalysisFixture);

    expect(viewModel.scenes.sceneSegments[0]?.confidence).toBe('derived');
    expect(viewModel.scenes.sceneSegments[1]?.confidence).toBe('derived');
  });

  it('maps empty optional transcript sections without error', () => {
    const analysis = cloneFixture();
    analysis.transcript = {
      transcriptSegments: [],
    };
    analysis.story = {};
    analysis.hooks = {};
    analysis.audience = { audienceSignals: [] };
    analysis.cta = { ctaPresent: false };

    const viewModel = mapAnalysisToViewModel(analysis);

    expect(viewModel.transcript.transcriptSegments).toEqual([]);
    expect(viewModel.transcript.transcriptText).toBeUndefined();
    expect(viewModel.story.storySummary).toBeUndefined();
    expect(viewModel.hooks.hookSummary).toBeUndefined();
    expect(viewModel.audience.audienceSignals).toEqual([]);
    expect(viewModel.cta.ctaPresent).toBe(false);
  });

  it('returns deterministic output for the same input', () => {
    const analysis = cloneFixture();
    const first = mapAnalysisToViewModel(analysis);
    const second = mapAnalysisToViewModel(analysis);

    expect(first).toEqual(second);
  });

  it('does not mutate the input analysis object', () => {
    const analysis = cloneFixture();
    const before = structuredClone(analysis);
    Object.freeze(analysis);
    Object.freeze(analysis.metadata);
    Object.freeze(analysis.media);
    Object.freeze(analysis.scenes.sceneSegments);

    mapAnalysisToViewModel(analysis);

    expect(analysis).toEqual(before);
  });

  it('does not expose fingerprint or entity identifiers in the view-model', () => {
    const viewModel = mapAnalysisToViewModel(validReferenceVideoAnalysisFixture);

    expect(viewModel).not.toHaveProperty('analysisId');
    expect(viewModel).not.toHaveProperty('referenceId');
    expect(viewModel).not.toHaveProperty('projectId');
    expect(viewModel).not.toHaveProperty('fingerprint');
    expect(viewModel).not.toHaveProperty('fingerprintId');
    expect(viewModel).not.toHaveProperty('seoSeeds');
  });
});
