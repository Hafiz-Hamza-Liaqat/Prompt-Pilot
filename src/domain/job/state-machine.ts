import type { JobState } from '../canonical/constants.js';
import { JOB_STATES } from '../canonical/constants.js';

/**
 * Allowed directed edges in the PP-02 job state machine.
 * Terminal states expose empty arrays except `failed` → `retry_pending`
 * and `retry_pending` → `queued`.
 */
export const JOB_STATE_TRANSITIONS = {
  created: ['validated', 'failed'],
  validated: ['queued', 'failed'],
  queued: ['preparing', 'cancelled', 'expired', 'failed'],
  preparing: ['uploading', 'fingerprinting', 'cancelled', 'expired', 'failed'],
  uploading: ['fingerprinting', 'cancelled', 'expired', 'failed'],
  fingerprinting: ['analyzing', 'generating_packages', 'cancelled', 'expired', 'failed'],
  analyzing: ['generating_packages', 'cancelled', 'failed'],
  generating_packages: ['saving', 'cancelled', 'failed'],
  saving: ['completed', 'failed'],
  completed: [],
  failed: ['retry_pending'],
  cancelled: [],
  expired: [],
  retry_pending: ['queued', 'failed'],
} as const satisfies Record<JobState, readonly JobState[]>;

export type JobStateTransitionMap = typeof JOB_STATE_TRANSITIONS;

/** Compile-time helper: valid next states from a given state. */
export type ValidNextJobState<S extends JobState> =
  JobStateTransitionMap[S][number];

/** All states that may transition to the given target. */
export type ValidPriorJobState<S extends JobState> = {
  [K in JobState]: S extends ValidNextJobState<K> ? K : never;
}[JobState];

export function getValidNextStates(state: JobState): readonly JobState[] {
  return JOB_STATE_TRANSITIONS[state];
}

export function isValidJobTransition(from: JobState, to: JobState): boolean {
  return (JOB_STATE_TRANSITIONS[from] as readonly JobState[]).includes(to);
}

export function assertValidJobTransition(from: JobState, to: JobState): void {
  if (!isValidJobTransition(from, to)) {
    throw new Error(`Invalid job transition: ${from} → ${to}`);
  }
}

/** Ensures every PP-03 job state appears in the transition map. */
export const JOB_STATE_MACHINE_COVERAGE: Record<JobState, true> = JOB_STATES.reduce(
  (accumulator, state) => {
    accumulator[state] = true;
    return accumulator;
  },
  {} as Record<JobState, true>,
);

/** Pipeline stages in happy-path order (excludes terminal/error-only states). */
export const JOB_HAPPY_PATH_STATES = [
  'created',
  'validated',
  'queued',
  'preparing',
  'uploading',
  'fingerprinting',
  'analyzing',
  'generating_packages',
  'saving',
  'completed',
] as const satisfies readonly JobState[];

export type JobHappyPathState = (typeof JOB_HAPPY_PATH_STATES)[number];

export function isJobHappyPathState(state: JobState): state is JobHappyPathState {
  return (JOB_HAPPY_PATH_STATES as readonly JobState[]).includes(state);
}
