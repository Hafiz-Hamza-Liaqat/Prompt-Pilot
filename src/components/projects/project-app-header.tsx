import Link from 'next/link';
import { signOutAction } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page-container';
import { siteConfig } from '@/config/site';

export function ProjectAppHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm">
      <PageContainer className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link
            href="/projects"
            className="text-lg font-semibold tracking-tight text-foreground no-underline hover:text-brand"
          >
            {siteConfig.name}
          </Link>
          <span className="text-sm text-muted-foreground">Projects</span>
        </div>
        <nav aria-label="Project workspace">
          <ul className="flex flex-wrap items-center gap-4 sm:gap-6">
            <li>
              <Link
                href="/projects"
                className="text-sm font-medium text-muted-foreground no-underline hover:text-foreground"
              >
                Projects
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                className="text-sm font-medium text-muted-foreground no-underline hover:text-foreground"
              >
                Account
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground no-underline hover:text-foreground"
              >
                Public home
              </Link>
            </li>
            <li>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </li>
          </ul>
        </nav>
      </PageContainer>
    </header>
  );
}
