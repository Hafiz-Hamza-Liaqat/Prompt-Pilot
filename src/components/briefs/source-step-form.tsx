'use client';

import { useActionState, useState } from 'react';
import {
  initialBriefFormState,
  saveSourceStepAction,
} from '@/app/projects/[projectId]/brief/actions';
import { BriefActionMessage } from '@/components/briefs/brief-action-message';
import { useBriefFormRedirect } from '@/components/briefs/use-brief-form-redirect';
import { SubmitButton } from '@/components/forms/submit-button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { SOURCE_TYPE_OPTIONS } from '@/config/video-brief-wizard';
import type { PartialVideoBriefDraft, WizardSourceType } from '@/domain/videoBriefDraft';

type SourceStepFormProps = {
  projectId: string;
  draft: PartialVideoBriefDraft;
};

export function SourceStepForm({ projectId, draft }: SourceStepFormProps) {
  const [state, formAction] = useActionState(saveSourceStepAction, initialBriefFormState);
  useBriefFormRedirect(state);

  const [selectedSourceType, setSelectedSourceType] = useState<WizardSourceType>(
    (state.values?.sourceType as WizardSourceType | undefined) ?? draft.sourceType ?? 'idea',
  );

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border p-4">
      <input type="hidden" name="projectId" value={projectId} />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">Source type</legend>
        {SOURCE_TYPE_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="sourceType"
              value={option.value}
              checked={selectedSourceType === option.value}
              onChange={() => setSelectedSourceType(option.value)}
              className="mt-1"
            />
            <span>{option.label}</span>
          </label>
        ))}
        {state.fieldErrors?.sourceType ? (
          <p className="text-sm text-destructive">{state.fieldErrors.sourceType}</p>
        ) : null}
      </fieldset>

      {selectedSourceType === 'idea' || selectedSourceType === 'script' ? (
        <div className="space-y-2">
          <Label htmlFor="sourceText">
            {selectedSourceType === 'idea' ? 'Describe your idea' : 'Paste your script'}
          </Label>
          <Textarea
            id="sourceText"
            name="sourceText"
            rows={selectedSourceType === 'script' ? 10 : 6}
            required
            defaultValue={
              (state.values?.sourceText as string | undefined) ?? draft.sourceText ?? ''
            }
          />
          {state.fieldErrors?.sourceText ? (
            <p className="text-sm text-destructive">{state.fieldErrors.sourceText}</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="sourceUrl">
            {selectedSourceType === 'product_url' ? 'Product page URL' : 'Article URL'}
          </Label>
          <Input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            inputMode="url"
            required
            maxLength={2048}
            defaultValue={
              (state.values?.sourceUrl as string | undefined) ?? draft.sourceUrl ?? ''
            }
          />
          <p className="text-sm text-muted-foreground">
            URLs are validated and stored only. Prompt Pilot does not fetch page content in this
            phase.
          </p>
          {state.fieldErrors?.sourceUrl ? (
            <p className="text-sm text-destructive">{state.fieldErrors.sourceUrl}</p>
          ) : null}
        </div>
      )}

      <BriefActionMessage status={state.status} />
      <SubmitButton pendingText="Saving source...">Save and continue</SubmitButton>
    </form>
  );
}
