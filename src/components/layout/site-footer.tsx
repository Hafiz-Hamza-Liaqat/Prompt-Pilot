import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getFooterNavigationGroups, publicSiteConfig } from '@/config/public-site';
import { siteConfig } from '@/config/site';
import { PageContainer } from './page-container';

function FooterLinkItem({
  label,
  href,
  external,
}: {
  label: string;
  href: string;
  external?: boolean;
}) {
  const className =
    'text-sm text-muted-foreground no-underline transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm';

  if (external) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} (opens in a new tab)`}
      >
        {label}
        <span aria-hidden="true"> ↗</span>
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const groups = getFooterNavigationGroups();

  return (
    <footer className="mt-auto border-t border-border bg-surface-subtle">
      <PageContainer className="py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-foreground">{siteConfig.name}</p>
              <Badge variant="secondary" className="bg-brand-muted text-brand">
                {publicSiteConfig.planningLayerLabel}
              </Badge>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {publicSiteConfig.publicDescription}
            </p>
            <p className="text-sm text-muted-foreground">
              {siteConfig.name} produces structured plans, provider recommendations, prompts, and
              production instructions. It does not generate videos or images.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title} className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.href}`}>
                      <FooterLinkItem
                        label={link.label}
                        href={link.href}
                        external={link.external}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
          © {year} {siteConfig.name}
        </p>
      </PageContainer>
    </footer>
  );
}
