import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/layout/section-heading';

export const metadata = {
  title: 'News Feed | Prompt Pilot',
  description: 'Public product updates for Prompt Pilot.',
};

export default function NewsPage() {
  return (
    <main id="main-content" className="flex-1 py-10">
      <PageContainer className="max-w-3xl space-y-8">
        <SectionHeading
          headingLevel={1}
          title="News Feed"
          description="Public product updates for Prompt Pilot."
        />

        <section aria-labelledby="updates-heading" className="rounded-lg border border-border p-6">
          <h2 id="updates-heading" className="text-lg font-semibold text-foreground">
            Product updates
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            No public updates have been published yet.
          </p>
        </section>
      </PageContainer>
    </main>
  );
}
