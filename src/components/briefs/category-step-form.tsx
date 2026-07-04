'use client';

import { useActionState } from 'react';
import {
  initialBriefFormState,
  saveCategoryStepAction,
} from '@/app/projects/[projectId]/brief/actions';
import { BriefActionMessage } from '@/components/briefs/brief-action-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { Label } from '@/components/ui/label';
import { CATEGORY_OPTIONS } from '@/config/video-brief-wizard';
import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';

type CategoryStepFormProps = {
  projectId: string;
  draft: PartialVideoBriefDraft;
};

export function CategoryStepForm({ projectId, draft }: CategoryStepFormProps) {
  const [state, formAction] = useActionState(saveCategoryStepAction, initialBriefFormState);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border p-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="space-y-2">
        <Label htmlFor="videoCategory">Video category</Label>
        <select
          id="videoCategory"
          name="videoCategory"
          required
          defaultValue={
            (state.values?.videoCategory as string | undefined) ?? draft.videoCategory ?? ''
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.videoCategory ? (
          <p className="text-sm text-destructive">{state.fieldErrors.videoCategory}</p>
        ) : null}
      </div>

      <BriefActionMessage status={state.status} />
      <SubmitButton pendingText="Saving category...">Save and continue</SubmitButton>
    </form>
  );
}
