'use client';

import { useActionState } from 'react';
import {
  initialBriefFormState,
  saveObjectiveStepAction,
} from '@/app/projects/[projectId]/brief/actions';
import { BriefActionMessage } from '@/components/briefs/brief-action-message';
import { useBriefFormRedirect } from '@/components/briefs/use-brief-form-redirect';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';

type ObjectiveStepFormProps = {
  projectId: string;
  draft: PartialVideoBriefDraft;
};

export function ObjectiveStepForm({ projectId, draft }: ObjectiveStepFormProps) {
  const [state, formAction] = useActionState(saveObjectiveStepAction, initialBriefFormState);
  useBriefFormRedirect(state);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border p-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="space-y-2">
        <Label htmlFor="workingTitle">Working title</Label>
        <Input
          id="workingTitle"
          name="workingTitle"
          required
          maxLength={120}
          defaultValue={
            (state.values?.workingTitle as string | undefined) ?? draft.workingTitle ?? ''
          }
        />
        {state.fieldErrors?.workingTitle ? (
          <p className="text-sm text-destructive">{state.fieldErrors.workingTitle}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="objective">Objective</Label>
        <Textarea
          id="objective"
          name="objective"
          rows={4}
          required
          maxLength={1000}
          defaultValue={(state.values?.objective as string | undefined) ?? draft.objective ?? ''}
        />
        {state.fieldErrors?.objective ? (
          <p className="text-sm text-destructive">{state.fieldErrors.objective}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetAudience">Target audience</Label>
        <Input
          id="targetAudience"
          name="targetAudience"
          required
          maxLength={500}
          defaultValue={
            (state.values?.targetAudience as string | undefined) ?? draft.targetAudience ?? ''
          }
        />
        {state.fieldErrors?.targetAudience ? (
          <p className="text-sm text-destructive">{state.fieldErrors.targetAudience}</p>
        ) : null}
      </div>

      <BriefActionMessage status={state.status} />
      <SubmitButton pendingText="Saving objective...">Save and continue</SubmitButton>
    </form>
  );
}
