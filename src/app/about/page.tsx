import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/layout/section-heading';
import { siteConfig } from '@/config/site';

export const metadata = {
  title: 'About Us | Prompt Pilot',
  description:
    'Learn what Prompt Pilot is: a video-production planning platform with deterministic assessments and source-backed provider information.',
};

export default function AboutPage() {
  return (
    <main id="main-content" className="flex-1 py-10">
      <PageContainer className="max-w-3xl space-y-8">
        <SectionHeading
          headingLevel={1}
          title="About Prompt Pilot"
          description="A planning and recommendation platform for AI video production workflows."
        />

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            {siteConfig.name} helps teams move from source material to a structured production
            brief, deterministic scene timing, complexity and execution-risk assessment, and
            evidence-backed provider recommendations. Future phases add provider-specific prompt
            compilation without changing the core boundary: Prompt Pilot plans and recommends; it
            does not render media.
          </p>
          <p>
            The platform includes a guided nine-step video brief wizard, project containers for
            planning work, a public source-backed provider catalogue, and an authenticated result
            workspace preview once a brief is marked ready.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">What Prompt Pilot provides</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Structured video-production briefs with validated production requirements</li>
            <li>Deterministic duration-based scene timing from saved brief inputs</li>
            <li>Production complexity and execution-risk assessments derived from brief data</li>
            <li>Source-backed provider catalogue information on public pages</li>
            <li>Evidence-backed provider recommendations inside authenticated workspaces</li>
            <li>Future prompt compilation guidance tailored to recommended providers</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">What Prompt Pilot does not do</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {siteConfig.name} does not generate, render, upload, or deliver images, videos, or
            audio. It does not connect provider accounts, store provider credentials, or execute
            generation jobs on external AI video platforms.
          </p>
        </section>
      </PageContainer>
    </main>
  );
}
