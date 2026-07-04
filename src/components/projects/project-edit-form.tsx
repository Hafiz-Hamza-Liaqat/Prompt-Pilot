'use client';

import { useActionState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateProjectAction, type ProjectFormState } from '@/app/projects/actions';
import { SubmitButton } from '@/components/forms/submit-button';

const initialState: ProjectFormState = { status: 'idle' };

type ProjectEditFormProps = {
  projectId: string;
  title: string;
  description: string | null;
};

export function ProjectEditForm({ projectId, title, description }: ProjectEditFormProps) {
  const [state, formAction] = useActionState(updateProjectAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border p-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="space-y-2">
        <Label htmlFor="title">Project title</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={state.values?.title ?? title}
        />
        {state.fieldErrors?.title ? (
          <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Short description</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={500}
          rows={3}
          defaultValue={state.values?.description ?? description ?? ''}
        />
        {state.fieldErrors?.description ? (
          <p className="text-sm text-destructive">{state.fieldErrors.description}</p>
        ) : null}
      </div>

      {state.status === 'persistence_error' ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to save project</AlertTitle>
          <AlertDescription>Try again in a moment.</AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton pendingText="Saving changes...">Save changes</SubmitButton>
    </form>
  );
}
