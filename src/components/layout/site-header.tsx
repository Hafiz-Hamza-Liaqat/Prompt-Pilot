import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { publicNavigation } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AccountMenu } from './account-menu';
import { PageContainer } from './page-container';

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();

    displayName = profile?.display_name ?? null;
  }

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm">
      <PageContainer className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-foreground no-underline hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            {siteConfig.name}
          </Link>
          <Badge variant="secondary" className="bg-brand-muted text-brand">
            Planning layer
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <nav aria-label="Primary">
            <ul className="flex flex-wrap items-center gap-4 sm:gap-6">
              {publicNavigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <AccountMenu isAuthenticated={Boolean(user)} displayName={displayName} />
        </div>
      </PageContainer>
    </header>
  );
}
