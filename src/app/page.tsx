import Link from 'next/link';
import {
  Compass,
  Layers3,
  ListOrdered,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/layout/section-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { marketingContent } from '@/config/marketing';
import { siteConfig } from '@/config/site';

const capabilityIcons = {
  'provider-recommendation': Compass,
  'scene-planning': ListOrdered,
  'continuity-guidance': Layers3,
  'platform-adaptation': Sparkles,
} as const;

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="border-b border-border bg-surface-subtle">
        <PageContainer className="py-16 sm:py-20">
          <Badge variant="secondary" className="mb-4 bg-brand-muted text-brand">
            {marketingContent.heroBadge}
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {marketingContent.heroTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {marketingContent.heroDescription}
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground">
            {marketingContent.honestyStatement}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="#workflow">Explore the workflow</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#scope">Review the scope</Link>
            </Button>
          </div>
        </PageContainer>
      </section>

      <section id="workflow" className="scroll-mt-20 py-16 sm:py-20">
        <PageContainer>
          <SectionHeading
            eyebrow="Workflow"
            title="From source material to a structured production plan"
            description="Prompt Pilot organizes planning into reviewable steps. External AI-video platforms receive the compiled prompts — Prompt Pilot does not render media."
            headingLevel={2}
            className="mb-10"
          />
          <ol className="grid gap-4 md:grid-cols-2">
            {marketingContent.workflowSteps.map((step) => (
              <li key={step.step}>
                <Card className="h-full border-border bg-surface-raised shadow-sm">
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline">Step {step.step}</Badge>
                      <Workflow className="size-4 text-brand" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </PageContainer>
      </section>

      <section id="capabilities" className="scroll-mt-20 border-y border-border bg-surface-subtle py-16 sm:py-20">
        <PageContainer>
          <SectionHeading
            eyebrow="Capabilities"
            title="Structured planning outputs"
            description="These capabilities describe the product direction. Live provider connections and automated plan generation are implemented in later approved phases."
            headingLevel={2}
            className="mb-10"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {marketingContent.capabilities.map((capability) => {
              const Icon = capabilityIcons[capability.id];
              return (
                <Card key={capability.id} className="h-full border-border bg-surface-raised shadow-sm">
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="size-5 text-brand" aria-hidden="true" />
                      <CardTitle className="text-lg">{capability.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {capability.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </PageContainer>
      </section>

      <section id="scope" className="scroll-mt-20 py-16 sm:py-20">
        <PageContainer>
          <SectionHeading
            eyebrow="Scope"
            title="What Prompt Pilot provides — and what it does not"
            description={`${siteConfig.name} is a planning and prompt-compilation layer. It helps you prepare for external generation platforms without producing media itself.`}
            headingLevel={2}
            className="mb-10"
          />
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-foreground">What Prompt Pilot provides</h3>
              <ul className="mt-4 space-y-3">
                {marketingContent.supportedOutputs.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                What Prompt Pilot does not provide
              </h3>
              <ul className="mt-4 space-y-3">
                {marketingContent.unsupportedOutputs.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Separator className="my-10" />
          <p className="text-sm text-muted-foreground">{marketingContent.foundationNotice}</p>
        </PageContainer>
      </section>
    </main>
  );
}
