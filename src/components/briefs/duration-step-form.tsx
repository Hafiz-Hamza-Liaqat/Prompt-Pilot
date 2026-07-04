'use client';

import { useActionState } from 'react';
import {
  initialBriefFormState,
  saveDurationStepAction,
} from '@/app/projects/[projectId]/brief/actions';
import { BriefActionMessage } from '@/components/briefs/brief-action-message';
import { useBriefFormRedirect } from '@/components/briefs/use-brief-form-redirect';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DURATION_PRESET_OPTIONS } from '@/config/video-brief-wizard';
import { MAX_DURATION_SECONDS, MIN_DURATION_SECONDS } from '@/domain/constants';
import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';

type DurationStepFormProps = {
  projectId: string;
  draft: PartialVideoBriefDraft;
};

export function DurationStepForm({ projectId, draft }: DurationStepFormProps) {
  const [state, formAction] = useActionState(saveDurationStepAction, initialBriefFormState);
  useBriefFormRedirect(state);
  const currentValue =
    (state.values?.durationSeconds as string | undefined) ??
    (draft.durationSeconds !== null && draft.durationSeconds !== undefined
      ? String(draft.durationSeconds)
      : '');

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border p-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="space-y-2">
        <Label htmlFor="durationSeconds">Target duration (seconds)</Label>
        <select
          id="durationPreset"
          defaultValue={
            DURATION_PRESET_OPTIONS.some((option) => option.value === currentValue)
              ? currentValue
              : 'custom'
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          onChange={(event) => {
            const input = document.getElementById('durationSeconds') as HTMLInputElement | null;
            if (!input) return;
            if (event.target.value === 'custom') return;
            input.value = event.target.value;
          }}
        >
          {DURATION_PRESET_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          <option value="custom">Custom duration</option>
        </select>
        <Input
          id="durationSeconds"
          name="durationSeconds"
          type="number"
          min={MIN_DURATION_SECONDS}
          max={MAX_DURATION_SECONDS}
          step={1}
          required
          defaultValue={currentValue}
        />
        <p className="text-sm text-muted-foreground">
          Enter whole seconds between {MIN_DURATION_SECONDS} and {MAX_DURATION_SECONDS}.
        </p>
        {state.fieldErrors?.durationSeconds ? (
          <p className="text-sm text-destructive">{state.fieldErrors.durationSeconds}</p>
        ) : null}
      </div>

      <BriefActionMessage status={state.status} />
      <SubmitButton pendingText="Saving duration...">Save and continue</SubmitButton>
    </form>
  );
}
