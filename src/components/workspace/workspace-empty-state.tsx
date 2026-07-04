import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type WorkspaceEmptyStateProps = {
  title?: string;
  description?: string;
};

export function WorkspaceEmptyState({
  title = 'Workspace unavailable',
  description = 'The result workspace could not be loaded. Complete the video brief and try again.',
}: WorkspaceEmptyStateProps) {
  return (
    <Alert>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
