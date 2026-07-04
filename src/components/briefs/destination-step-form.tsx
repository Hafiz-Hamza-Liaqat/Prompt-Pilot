'use client';

import { useActionState } from 'react';
import {
  initialBriefFormState,
  saveDestinationStepAction,
} from '@/app/projects/[projectId]/brief/actions';
import { BriefActionMessage } from '@/components/briefs/brief-action-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { Label } from '@/components/ui/label';
import { ASPECT_RATIO_OPTIONS, DESTINATION_OPTIONS } from '@/config/video-brief-wizard';
import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';

type DestinationStepFormProps = {
  projectId: string;
  draft: PartialVideoBriefDraft;
};

export function DestinationStepForm({ projectId, draft }: DestinationStepFormProps) {
  const [state, formAction] = useActionState(saveDestinationStepAction, initialBriefFormState);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border p-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="space-y-2">
        <Label htmlFor="publishingDestination">Publishing destination</Label>
        <select
          id="publishingDestination"
          name="publishingDestination"
          required
          defaultValue={
            (state.values?.publishingDestination as string | undefined) ??
            draft.publishingDestination ??
            ''
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a destination
          </option>
          {DESTINATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.publishingDestination ? (
          <p className="text-sm text-destructive">{state.fieldErrors.publishingDestination}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="aspectRatio">Aspect ratio</Label>
        <select
          id="aspectRatio"
          name="aspectRatio"
          required
          defaultValue={
            (state.values?.aspectRatio as string | undefined) ?? draft.aspectRatio ?? ''
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select an aspect ratio
          </option>
          {ASPECT_RATIO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.aspectRatio ? (
          <p className="text-sm text-destructive">{state.fieldErrors.aspectRatio}</p>
        ) : null}
      </div>

      <BriefActionMessage status={state.status} />
      <SubmitButton pendingText="Saving destination...">Save and continue</SubmitButton>
    </form>
  );
}
