import type { JobState } from '@/domain/canonical';
import type { AnalysisViewModel } from '@/domain/workspace/analysis-display';

export type AnalysisSectionPresentationState = 'populated' | 'empty' | 'running' | 'failed';

const FAILED_JOB_STATES = new Set<JobState>(['failed', 'retry_pending']);

const RUNNING_JOB_STATES = new Set<JobState>([
  'created',
  'validated',
  'queued',
  'preparing',
  'uploading',
  'fingerprinting',
  'analyzing',
  'generating_packages',
  'saving',
]);

export type AnalysisSectionStateInput = {
  analysis: AnalysisViewModel | null;
  activeJobState: JobState | null;
};

export function resolveAnalysisSectionState(
  input: AnalysisSectionStateInput,
): AnalysisSectionPresentationState {
  if (input.analysis !== null) {
    return 'populated';
  }

  if (input.activeJobState !== null && FAILED_JOB_STATES.has(input.activeJobState)) {
    return 'failed';
  }

  if (input.activeJobState !== null && RUNNING_JOB_STATES.has(input.activeJobState)) {
    return 'running';
  }

  return 'empty';
}
