'use client';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer className="py-16">
      <div className="rounded-lg border border-border bg-surface-raised p-6" role="alert">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. You can try again.
        </p>
        <Button type="button" className="mt-6" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </PageContainer>
  );
}
