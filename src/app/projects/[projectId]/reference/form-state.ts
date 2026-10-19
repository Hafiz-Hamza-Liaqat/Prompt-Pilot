import type { EntityId } from '@/domain/canonical/primitives';
import type { ReferenceKind } from '@/domain/canonical';
import type { JobFailure } from '@/domain/canonical/job';
import type { JobState } from '@/domain/canonical/constants';

export type ReferenceIntakeActionStatus =
  | 'idle'
  | 'success'
  | 'validation_error'
  | 'not_authenticated'
  | 'invalid_url'
  | 'persistence_error';

export type ReferenceIntakeFormState = {
  status: ReferenceIntakeActionStatus;
  referenceId?: EntityId;
  attestationId?: EntityId;
  referenceKind?: ReferenceKind;
  fieldErrors?: Record<string, string | undefined>;
  message?: string;
  values?: {
    referenceKind?: string;
    bodyText?: string;
    canonicalUrl?: string;
    attestationAccepted?: boolean;
  };
};

export const initialReferenceIntakeFormState: ReferenceIntakeFormState = {
  status: 'idle',
};

export type StartAnalysisJobActionStatus =
  | 'idle'
  | 'success'
  | 'validation_error'
  | 'not_authenticated'
  | 'not_found'
  | 'conflict'
  | 'error';

export type StartAnalysisJobFormState = {
  status: StartAnalysisJobActionStatus;
  jobId?: EntityId;
  analysisId?: EntityId;
  terminalState?: JobState;
  failure?: JobFailure;
  fieldErrors?: Record<string, string | undefined>;
  message?: string;
};

export const initialStartAnalysisJobFormState: StartAnalysisJobFormState = {
  status: 'idle',
};
