import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { publicNavigation } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { PageContainer } from './page-container';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm">
      <PageContainer className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-foreground no-underline hover:text-brand"
          >
            {siteConfig.name}
          </Link>
          <Badge variant="secondary" className="bg-brand-muted text-brand">
            Planning layer
          </Badge>
        </div>
        <nav aria-label="Primary">
          <ul className="flex flex-wrap items-center gap-4 sm:gap-6">
            {publicNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageContainer>
    </header>
  );
}
