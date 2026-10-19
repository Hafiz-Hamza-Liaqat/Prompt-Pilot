'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  initialReferenceIntakeFormState,
  initialStartAnalysisJobFormState,
  startAnalysisJobAction,
  submitReferenceIntakeAction,
} from '@/app/projects/[projectId]/reference/actions';
import { JobStatusPanel } from '@/components/projects/job-status-panel';
import { SubmitButton } from '@/components/forms/submit-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  REFERENCE_ATTESTATION_POLICY_COPY,
  REFERENCE_ATTESTATION_VERSION,
  REFERENCE_INTAKE_KINDS,
  REFERENCE_INTAKE_KIND_LABELS,
  type ReferenceIntakeKind,
} from '@/config/reference-intake';

type ReferenceIntakeFormProps = {
  projectId: string;
};

function StartAnalysisJobForm({
  projectId,
  referenceId,
  startState,
}: {
  projectId: string;
  referenceId: string;
  startState: typeof initialStartAnalysisJobFormState;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="space-y-4">
      <JobStatusPanel
        projectId={projectId}
        referenceId={referenceId}
        startAnalysisState={startState}
        pollEnabled={pending || startState.status !== 'idle'}
      />

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-foreground">Start reference analysis</h3>
        <p className="text-sm text-muted-foreground">
          Run the mock analysis pipeline for this saved reference. Prompt Pilot persists the job
          and analysis results before you open the workspace.
        </p>
      </div>

      {startState.status === 'validation_error' || startState.status === 'not_found' ? (
        <p className="text-sm text-destructive">{startState.message}</p>
      ) : null}

      {startState.status !== 'success' ? (
        <SubmitButton pendingText="Running analysis...">Start analysis</SubmitButton>
      ) : null}
    </div>
  );
}

function StartAnalysisSection({
  projectId,
  referenceId,
  referenceKind,
  startState,
  startFormAction,
}: {
  projectId: string;
  referenceId: string;
  referenceKind: string;
  startState: typeof initialStartAnalysisJobFormState;
  startFormAction: (formData: FormData) => void;
}) {
  return (
    <form action={startFormAction} className="space-y-4 rounded-lg border border-border p-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="referenceId" value={referenceId} />
      <input type="hidden" name="referenceKind" value={referenceKind} />
      <StartAnalysisJobForm
        projectId={projectId}
        referenceId={referenceId}
        startState={startState}
      />
    </form>
  );
}

export function ReferenceIntakeForm({ projectId }: ReferenceIntakeFormProps) {
  const [state, formAction] = useActionState(
    submitReferenceIntakeAction,
    initialReferenceIntakeFormState,
  );
  const [startState, startFormAction] = useActionState(
    startAnalysisJobAction,
    initialStartAnalysisJobFormState,
  );

  const [selectedKind, setSelectedKind] = useState<ReferenceIntakeKind>(
    (state.values?.referenceKind as ReferenceIntakeKind | undefined) ?? 'transcript',
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4 rounded-lg border border-border p-4">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="attestationVersion" value={REFERENCE_ATTESTATION_VERSION} />

        {state.status === 'success' ? (
          <Alert>
            <AlertTitle>Reference saved</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        {state.status === 'not_authenticated' || state.status === 'persistence_error' ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to submit reference</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        {state.status !== 'success' ? (
          <>
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">Reference kind</legend>
              {REFERENCE_INTAKE_KINDS.map((kind) => (
                <label key={kind} className="flex items-start gap-3 text-sm">
                  <input
                    type="radio"
                    name="referenceKind"
                    value={kind}
                    checked={selectedKind === kind}
                    onChange={() => setSelectedKind(kind)}
                    className="mt-1"
                  />
                  <span>{REFERENCE_INTAKE_KIND_LABELS[kind]}</span>
                </label>
              ))}
              {state.fieldErrors?.referenceKind ? (
                <p className="text-sm text-destructive">{state.fieldErrors.referenceKind}</p>
              ) : null}
            </fieldset>

            {selectedKind === 'youtube_url' ? (
              <div className="space-y-2">
                <Label htmlFor="canonicalUrl">YouTube URL</Label>
                <Input
                  id="canonicalUrl"
                  name="canonicalUrl"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  defaultValue={state.values?.canonicalUrl ?? ''}
                  required
                />
                {state.fieldErrors?.canonicalUrl ? (
                  <p className="text-sm text-destructive">{state.fieldErrors.canonicalUrl}</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="bodyText">
                  {selectedKind === 'transcript' ? 'Transcript text' : 'Script text'}
                </Label>
                <Textarea
                  id="bodyText"
                  name="bodyText"
                  rows={selectedKind === 'script' ? 10 : 8}
                  defaultValue={state.values?.bodyText ?? ''}
                  required
                />
                {state.fieldErrors?.bodyText ? (
                  <p className="text-sm text-destructive">{state.fieldErrors.bodyText}</p>
                ) : null}
              </div>
            )}

            <div className="space-y-2 rounded-md border border-border p-3">
              <p className="text-sm text-muted-foreground">{REFERENCE_ATTESTATION_POLICY_COPY}</p>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="attestationAccepted"
                  defaultChecked={state.values?.attestationAccepted ?? false}
                  required
                  className="mt-1"
                />
                <span>I accept the rights attestation above.</span>
              </label>
              {state.fieldErrors?.attestationAccepted ? (
                <p className="text-sm text-destructive">{state.fieldErrors.attestationAccepted}</p>
              ) : null}
            </div>

            <SubmitButton pendingText="Saving reference...">Save reference</SubmitButton>
          </>
        ) : null}
      </form>

      {state.status === 'success' && state.referenceId && state.referenceKind ? (
        <StartAnalysisSection
          projectId={projectId}
          referenceId={state.referenceId}
          referenceKind={state.referenceKind}
          startState={startState}
          startFormAction={startFormAction}
        />
      ) : null}
    </div>
  );
}
