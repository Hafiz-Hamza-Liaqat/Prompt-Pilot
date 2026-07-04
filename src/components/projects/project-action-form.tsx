'use client';

import {
  archiveProjectAction,
  duplicateProjectAction,
  restoreProjectAction,
  softDeleteProjectAction,
} from '@/app/projects/actions';
import { SubmitButton } from '@/components/forms/submit-button';

type ProjectActionFormProps = {
  projectId: string;
  action: 'archive' | 'restore' | 'duplicate' | 'soft-delete';
  label: string;
  pendingText: string;
  variant?: 'default' | 'outline' | 'destructive';
};

const actionMap = {
  archive: archiveProjectAction,
  restore: restoreProjectAction,
  duplicate: duplicateProjectAction,
  'soft-delete': softDeleteProjectAction,
} as const;

export function ProjectActionForm({
  projectId,
  action,
  label,
  pendingText,
  variant = 'outline',
}: ProjectActionFormProps) {
  const formAction = actionMap[action];

  return (
    <form action={formAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <SubmitButton pendingText={pendingText} variant={variant}>
        {label}
      </SubmitButton>
    </form>
  );
}
