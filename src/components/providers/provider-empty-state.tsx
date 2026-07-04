import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ProviderEmptyStateProps = {
  title?: string;
  description?: string;
};

export function ProviderEmptyState({
  title = 'Catalogue unavailable',
  description = 'The provider catalogue could not be loaded from local storage. Start the local Supabase stack and try again.',
}: ProviderEmptyStateProps) {
  return (
    <Alert>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
