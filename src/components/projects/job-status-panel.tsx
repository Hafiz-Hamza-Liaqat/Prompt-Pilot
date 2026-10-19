'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getJobStatusAction } from '@/app/projects/[projectId]/reference/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { resolveJobFailureRemediationCopy, JOB_STATUS_POLL_INTERVAL_MS } from '@/config/job-status';
import {
  mapStartAnalysisFormToSessionHint,
  resolveDisplayedJobStatus,
  resolveJobStatusPresentationState,
  shouldContinueJobStatusPolling,
  type JobStatusViewModel,
  type SessionJobStatusHint,
} from '@/domain/workspace/job-status-display';
import type { StartAnalysisJobFormState } from '@/app/projects/[projectId]/reference/form-state';

type JobStatusPanelProps = {
  projectId: string;
  referenceId?: string;
  startAnalysisState?: StartAnalysisJobFormState;
  pollEnabled?: boolean;
};

function buildSessionHint(
  startAnalysisState: StartAnalysisJobFormState | undefined,
  referenceId: string | undefined,
): SessionJobStatusHint | null {
  if (!referenceId || !startAnalysisState) {
    return null;
  }

  return mapStartAnalysisFormToSessionHint({
    status: startAnalysisState.status,
    jobId: startAnalysisState.jobId,
    referenceId: referenceId as SessionJobStatusHint['referenceId'],
    terminalState: startAnalysisState.terminalState,
    failure: startAnalysisState.failure,
    message: startAnalysisState.message,
  });
}

export function JobStatusPanel({
  projectId,
  referenceId,
  startAnalysisState,
  pollEnabled = true,
}: JobStatusPanelProps) {
  const router = useRouter();
  const [activeJob, setActiveJob] = useState<JobStatusViewModel | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const previousActiveJobRef = useRef<JobStatusViewModel | null>(null);
  const refreshedForSessionRef = useRef(false);

  const sessionHint = buildSessionHint(startAnalysisState, referenceId);
  const displayedJob = resolveDisplayedJobStatus(activeJob, sessionHint);
  const presentationState = resolveJobStatusPresentationState(activeJob, sessionHint);

  const pollJobStatus = useCallback(async () => {
    const result = await getJobStatusAction({ projectId });

    if (!result.ok) {
      setPollError(result.message ?? 'Unable to load analysis job status.');
      return;
    }

    setPollError(null);
    setActiveJob(result.activeJob);
  }, [projectId]);

  useEffect(() => {
    if (!pollEnabled) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void pollJobStatus();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [pollEnabled, pollJobStatus]);

  useEffect(() => {
    if (!pollEnabled) {
      return;
    }

    if (!shouldContinueJobStatusPolling(activeJob)) {
      return;
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') {
        return;
      }
      void pollJobStatus();
    }, JOB_STATUS_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeJob, pollEnabled, pollJobStatus]);

  useEffect(() => {
    const previousActiveJob = previousActiveJobRef.current;

    if (previousActiveJob !== null && activeJob === null) {
      router.refresh();
    }

    previousActiveJobRef.current = activeJob;
  }, [activeJob, router]);

  useEffect(() => {
    if (presentationState === 'completed' && !refreshedForSessionRef.current) {
      router.refresh();
      refreshedForSessionRef.current = true;
    }
  }, [presentationState, router]);

  if (presentationState === 'idle' && pollError === null) {
    return null;
  }

  if (presentationState === 'idle' && pollError !== null) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load job status</AlertTitle>
        <AlertDescription>{pollError}</AlertDescription>
      </Alert>
    );
  }

  if (displayedJob === null) {
    return null;
  }

  if (presentationState === 'running') {
    return (
      <div className="space-y-3 rounded-lg border border-border p-4" aria-live="polite">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-foreground">Reference analysis in progress</h3>
          <p className="text-sm text-muted-foreground">
            {displayedJob.progressLabel} — persisted job progress only. Prompt Pilot does not
            generate video in this step.
          </p>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${displayedJob.progressPercent}%` }}
              role="progressbar"
              aria-valuenow={displayedJob.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Analysis progress ${displayedJob.progressPercent}%`}
            />
          </div>
          <p className="text-xs text-muted-foreground">{displayedJob.progressPercent}% complete</p>
        </div>
        {pollError ? <p className="text-sm text-destructive">{pollError}</p> : null}
      </div>
    );
  }

  if (presentationState === 'completed') {
    return (
      <Alert aria-live="polite">
        <AlertTitle>Analysis complete</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            {sessionHint?.message ??
              'Reference analysis completed. Open the workspace to review persisted results.'}
          </p>
          {displayedJob.cacheHit ? (
            <p className="text-sm text-muted-foreground">
              Prompt Pilot reused a matching persisted analysis result for this reference.
            </p>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${projectId}/workspace?section=analysis`}>Open workspace</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const remediation = displayedJob.failure
    ? resolveJobFailureRemediationCopy(displayedJob.failure)
    : null;

  return (
    <Alert variant="destructive" aria-live="polite">
      <AlertTitle>Analysis did not complete</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{displayedJob.failure?.message ?? startAnalysisState?.message ?? 'Analysis failed.'}</p>
        {displayedJob.failure ? (
          <p className="text-sm text-muted-foreground">Failure code: {displayedJob.failure.code}</p>
        ) : null}
        {remediation ? <p className="text-sm">{remediation}</p> : null}
      </AlertDescription>
    </Alert>
  );
}
