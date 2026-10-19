import type { ReferenceKind, SemanticVersion } from '@/domain/canonical';
import type { AnalysisVersion } from '@/domain/canonical/analysisVersion';
import type { ReferenceVideoAnalysis } from '@/domain/canonical/referenceVideoAnalysis';
import type { IsoDateTime } from '@/domain/common';

/** Display-safe media panel — excludes internal {@link storageLocator}. */
export type AnalysisMediaViewModel = Omit<ReferenceVideoAnalysis['media'], 'storageLocator'>;

/** Lightweight analysis identity for workspace display (canonical values only). */
export type AnalysisSummaryViewModel = {
  referenceKind: ReferenceKind;
  pipelineVersion: SemanticVersion;
  createdAt: IsoDateTime;
  version: AnalysisVersion;
};

/**
 * MVP workspace analysis display model (PP-11A).
 * Presentation-neutral: canonical field values only; UI labels deferred to components.
 */
export type AnalysisViewModel = {
  summary: AnalysisSummaryViewModel;
  metadata: ReferenceVideoAnalysis['metadata'];
  media: AnalysisMediaViewModel;
  transcript: ReferenceVideoAnalysis['transcript'];
  timeline: ReferenceVideoAnalysis['timeline'];
  scenes: ReferenceVideoAnalysis['scenes'];
  story: ReferenceVideoAnalysis['story'];
  hooks: ReferenceVideoAnalysis['hooks'];
  audience: ReferenceVideoAnalysis['audience'];
  cta: ReferenceVideoAnalysis['cta'];
  camera: ReferenceVideoAnalysis['camera'];
  editing: ReferenceVideoAnalysis['editing'];
  safety: ReferenceVideoAnalysis['safety'];
};
