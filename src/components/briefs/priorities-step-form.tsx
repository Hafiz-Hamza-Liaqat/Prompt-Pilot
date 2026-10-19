'use client';

import { useActionState } from 'react';
import { savePrioritiesStepAction } from '@/app/projects/[projectId]/brief/actions';
import { initialBriefFormState } from '@/app/projects/[projectId]/brief/form-state';
import { BriefActionMessage } from '@/components/briefs/brief-action-message';
import { useBriefFormRedirect } from '@/components/briefs/use-brief-form-redirect';
import { SubmitButton } from '@/components/forms/submit-button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BUDGET_PRIORITY_OPTIONS, QUALITY_PRIORITY_OPTIONS } from '@/config/video-brief-wizard';
import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';

type PrioritiesStepFormProps = {
  projectId: string;
  draft: PartialVideoBriefDraft;
};

export function PrioritiesStepForm({ projectId, draft }: PrioritiesStepFormProps) {
  const [state, formAction] = useActionState(savePrioritiesStepAction, initialBriefFormState);
  useBriefFormRedirect(state);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border p-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="space-y-2">
        <Label htmlFor="budgetPriority">Budget priority</Label>
        <select
          id="budgetPriority"
          name="budgetPriority"
          required
          defaultValue={
            (state.values?.budgetPriority as string | undefined) ?? draft.budgetPriority ?? ''
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a budget priority
          </option>
          {BUDGET_PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.budgetPriority ? (
          <p className="text-sm text-destructive">{state.fieldErrors.budgetPriority}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="qualityPriority">Quality priority</Label>
        <select
          id="qualityPriority"
          name="qualityPriority"
          required
          defaultValue={
            (state.values?.qualityPriority as string | undefined) ?? draft.qualityPriority ?? ''
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a quality priority
          </option>
          {QUALITY_PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.qualityPriority ? (
          <p className="text-sm text-destructive">{state.fieldErrors.qualityPriority}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="userConstraints">Optional constraints</Label>
        <Textarea
          id="userConstraints"
          name="userConstraints"
          rows={4}
          maxLength={2000}
          defaultValue={
            (state.values?.userConstraints as string | undefined) ?? draft.userConstraints ?? ''
          }
        />
        {state.fieldErrors?.userConstraints ? (
          <p className="text-sm text-destructive">{state.fieldErrors.userConstraints}</p>
        ) : null}
      </div>

      <BriefActionMessage status={state.status} />
      <SubmitButton pendingText="Saving priorities...">Save and continue</SubmitButton>
    </form>
  );
}
