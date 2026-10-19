'use client';

import { useActionState } from 'react';
import { saveStyleStepAction } from '@/app/projects/[projectId]/brief/actions';
import { initialBriefFormState } from '@/app/projects/[projectId]/brief/form-state';
import { BriefActionMessage } from '@/components/briefs/brief-action-message';
import { useBriefFormRedirect } from '@/components/briefs/use-brief-form-redirect';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';

type StyleStepFormProps = {
  projectId: string;
  draft: PartialVideoBriefDraft;
};

export function StyleStepForm({ projectId, draft }: StyleStepFormProps) {
  const [state, formAction] = useActionState(saveStyleStepAction, initialBriefFormState);
  useBriefFormRedirect(state);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border p-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="space-y-2">
        <Label htmlFor="visualStyle">Visual style</Label>
        <Input
          id="visualStyle"
          name="visualStyle"
          required
          maxLength={120}
          defaultValue={
            (state.values?.visualStyle as string | undefined) ?? draft.visualStyle ?? ''
          }
        />
        {state.fieldErrors?.visualStyle ? (
          <p className="text-sm text-destructive">{state.fieldErrors.visualStyle}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tone">Tone</Label>
        <Input
          id="tone"
          name="tone"
          required
          maxLength={120}
          defaultValue={(state.values?.tone as string | undefined) ?? draft.tone ?? ''}
        />
        {state.fieldErrors?.tone ? (
          <p className="text-sm text-destructive">{state.fieldErrors.tone}</p>
        ) : null}
      </div>

      <BriefActionMessage status={state.status} />
      <SubmitButton pendingText="Saving style...">Save and continue</SubmitButton>
    </form>
  );
}
