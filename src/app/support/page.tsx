import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/layout/section-heading';

export const metadata = {
  title: 'Support / Help | Prompt Pilot',
  description:
    'Guidance for using Prompt Pilot projects, briefs, workspaces, and provider recommendations.',
};

const helpTopics = [
  {
    title: 'Creating an account',
    body: 'Use Create account to register a local Prompt Pilot profile, then sign in to access projects.',
    href: '/auth/sign-up',
  },
  {
    title: 'Creating and opening a project',
    body: 'From Projects, create a container, then open it from the project title or Open project action.',
    href: '/projects',
  },
  {
    title: 'Starting and continuing a brief',
    body: 'Open an active project and choose Start video brief or Continue video brief to enter the wizard.',
    href: '/projects',
  },
  {
    title: 'Draft and Ready brief states',
    body: 'Draft means input steps are still being saved. Ready means the brief passed completion validation and workspace preview becomes available.',
  },
  {
    title: 'Opening the result workspace',
    body: 'After a brief is Ready, open Preview result workspace from the project page to review scenes, scores, and recommendations.',
    href: '/projects',
  },
  {
    title: 'Scene timing, complexity, risk, and recommendations',
    body: 'The workspace shows deterministic scene timing, production complexity, execution risk, and evidence-backed provider recommendations calculated from your saved brief.',
  },
  {
    title: 'Archived projects',
    body: 'Archived projects remain readable but brief editing is blocked until the project is restored from the project detail page.',
    href: '/projects',
  },
  {
    title: 'Signing out',
    body: 'Use Sign out from the account menu in the header. Protected routes require a valid session.',
    href: '/auth/sign-in',
  },
] as const;

export default function SupportPage() {
  return (
    <main id="main-content" className="flex-1 py-10">
      <PageContainer className="max-w-3xl space-y-8">
        <SectionHeading
          headingLevel={1}
          title="Support / Help"
          description="Navigation guidance for Prompt Pilot planning workflows."
        />

        <p className="text-sm leading-relaxed text-muted-foreground">
          Direct support contact details have not been published yet.
        </p>

        <section aria-labelledby="help-topics-heading" className="space-y-4">
          <h2 id="help-topics-heading" className="text-lg font-semibold text-foreground">
            Common tasks
          </h2>
          <ul className="space-y-4">
            {helpTopics.map((topic) => (
              <li key={topic.title} className="rounded-lg border border-border p-4">
                <h3 className="text-base font-medium text-foreground">{topic.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{topic.body}</p>
                {'href' in topic && topic.href ? (
                  <p className="mt-3">
                    <Link
                      href={topic.href}
                      className="text-sm font-medium text-brand no-underline hover:underline"
                    >
                      Go to {topic.title.toLowerCase()}
                    </Link>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </PageContainer>
    </main>
  );
}
