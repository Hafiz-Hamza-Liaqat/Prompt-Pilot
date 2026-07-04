import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <PageContainer className="py-16">
      <div className="rounded-lg border border-border bg-surface-raised p-6">
        <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you requested does not exist.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Return to Prompt Pilot home</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
