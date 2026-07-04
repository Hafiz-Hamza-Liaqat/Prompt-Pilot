import { siteConfig } from '@/config/site';
import { PageContainer } from './page-container';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface-subtle">
      <PageContainer className="py-8">
        <p className="text-sm font-medium text-foreground">
          © {year} {siteConfig.name}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {siteConfig.name} produces structured plans, provider recommendations, prompts, and
          production instructions. It does not generate videos or images.
        </p>
      </PageContainer>
    </footer>
  );
}
