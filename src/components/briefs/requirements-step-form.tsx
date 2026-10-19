'use client';

import { useActionState } from 'react';
import { saveRequirementsStepAction } from '@/app/projects/[projectId]/brief/actions';
import { initialBriefFormState } from '@/app/projects/[projectId]/brief/form-state';
import { BriefActionMessage } from '@/components/briefs/brief-action-message';
import { useBriefFormRedirect } from '@/components/briefs/use-brief-form-redirect';
import { SubmitButton } from '@/components/forms/submit-button';
import { PRODUCTION_REQUIREMENT_OPTIONS } from '@/config/video-brief-wizard';
import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';

type RequirementsStepFormProps = {
  projectId: string;
  draft: PartialVideoBriefDraft;
};

export function RequirementsStepForm({ projectId, draft }: RequirementsStepFormProps) {
  const [state, formAction] = useActionState(saveRequirementsStepAction, initialBriefFormState);
  useBriefFormRedirect(state);
  const requirements = draft.productionRequirements;

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border p-4">
      <input type="hidden" name="projectId" value={projectId} />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">Production requirements</legend>
        {PRODUCTION_REQUIREMENT_OPTIONS.map((option) => {
          const savedValue = requirements?.[option.value] ?? false;
          const stateValue = state.values?.[option.value];
          const checked =
            typeof stateValue === 'boolean' ? stateValue : savedValue;

          return (
            <label key={option.value} className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name={option.value}
                defaultChecked={checked}
                className="mt-1"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </fieldset>

      <BriefActionMessage status={state.status} />
      <SubmitButton pendingText="Saving requirements...">Save and continue</SubmitButton>
    </form>
  );
}
