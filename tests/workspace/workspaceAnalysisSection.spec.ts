import { describe, expect, it } from 'vitest';
import {
  labelConfidenceClassification,
  labelReferenceKind,
  labelReferencePlatform,
  labelTranscriptSource,
  REFERENCE_KIND_LABELS,
} from '../../src/config/workspace-analysis-labels.js';
import { normalizeWorkspaceSection, WORKSPACE_SECTIONS } from '../../src/domain/mockResultWorkspace.js';
import { resolveAnalysisSectionState } from '../../src/domain/workspace/analysis-section-state.js';
import { mapAnalysisToViewModel } from '../../src/server/workspace/analysis-view-model.js';
import { validReferenceVideoAnalysisFixture } from '../fixtures/validReferenceVideoAnalysis.js';

describe('resolveAnalysisSectionState', () => {
  it('returns populated when analysis is present', () => {
    expect(
      resolveAnalysisSectionState({
        analysis: mapAnalysisToViewModel(validReferenceVideoAnalysisFixture),
        activeJobState: null,
      }),
    ).toBe('populated');
  });

  it('returns populated even when a job is still active', () => {
    expect(
      resolveAnalysisSectionState({
        analysis: mapAnalysisToViewModel(validReferenceVideoAnalysisFixture),
        activeJobState: 'analyzing',
      }),
    ).toBe('populated');
  });

  it('returns empty when analysis and job state are absent', () => {
    expect(
      resolveAnalysisSectionState({
        analysis: null,
        activeJobState: null,
      }),
    ).toBe('empty');
  });

  it('returns empty when the job has completed without analysis', () => {
    expect(
      resolveAnalysisSectionState({
        analysis: null,
        activeJobState: 'completed',
      }),
    ).toBe('empty');
  });

  it('returns running for active orchestration states', () => {
    for (const activeJobState of [
      'created',
      'queued',
      'analyzing',
      'generating_packages',
      'saving',
    ] as const) {
      expect(
        resolveAnalysisSectionState({
          analysis: null,
          activeJobState,
        }),
      ).toBe('running');
    }
  });

  it('returns failed for failed and retry_pending states', () => {
    expect(
      resolveAnalysisSectionState({
        analysis: null,
        activeJobState: 'failed',
      }),
    ).toBe('failed');

    expect(
      resolveAnalysisSectionState({
        analysis: null,
        activeJobState: 'retry_pending',
      }),
    ).toBe('failed');
  });
});

describe('workspace analysis labels', () => {
  it('maps canonical reference kinds to user-facing labels', () => {
    expect(labelReferenceKind('youtube_url')).toBe('YouTube URL');
    expect(REFERENCE_KIND_LABELS.youtube_url).toBe('YouTube URL');
  });

  it('maps canonical platform values to user-facing labels', () => {
    expect(labelReferencePlatform('youtube')).toBe('YouTube');
  });

  it('maps transcript source values to user-facing labels', () => {
    expect(labelTranscriptSource('platform_caption')).toBe('Platform caption');
  });

  it('maps confidence classifications to user-facing labels', () => {
    expect(labelConfidenceClassification('derived')).toBe('Derived');
  });

  it('does not contain generation claims in label config', () => {
    const serialized = JSON.stringify(REFERENCE_KIND_LABELS).toLowerCase();
    expect(serialized).not.toMatch(/\bgenerate (a )?video\b/);
  });
});

describe('workspace analysis view-model exposure', () => {
  it('exposes MVP fields without storageLocator', () => {
    const viewModel = mapAnalysisToViewModel(validReferenceVideoAnalysisFixture);

    expect(viewModel.metadata.referenceKind).toBe('youtube_url');
    expect(viewModel.media).not.toHaveProperty('storageLocator');
    expect(viewModel.scenes.sceneSegments.length).toBeGreaterThan(0);
    expect(viewModel.safety.transformationNotice.length).toBeGreaterThan(0);
  });
});

describe('workspace section enum', () => {
  it('includes analysis immediately after overview', () => {
    expect(WORKSPACE_SECTIONS[0]).toBe('overview');
    expect(WORKSPACE_SECTIONS[1]).toBe('analysis');
  });

  it('normalizes the analysis section slug', () => {
    expect(normalizeWorkspaceSection('analysis')).toBe('analysis');
  });
});
