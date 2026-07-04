import { PageContainer } from '@/components/layout/page-container';

export default function Loading() {
  return (
    <PageContainer className="py-16">
      <div aria-live="polite" className="rounded-lg border border-border bg-surface-raised p-6" role="status">
        <p className="text-sm font-medium text-foreground">Loading Prompt Pilot…</p>
        <p className="mt-2 text-sm text-muted-foreground">Preparing the page.</p>
      </div>
    </PageContainer>
  );
}
