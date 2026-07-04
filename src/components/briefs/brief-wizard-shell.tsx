import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/layout/section-heading';
import { BriefStatusBadge } from '@/components/briefs/brief-status-badge';
import { BriefWizardNavigation } from '@/components/briefs/brief-wizard-navigation';
import { BriefWizardProgress } from '@/components/briefs/brief-wizard-progress';
import { getStepConfig } from '@/config/video-brief-wizard';
import type { PartialVideoBriefDraft, WizardStep } from '@/domain/videoBriefDraft';

type BriefWizardShellProps = {
  projectId: string;
  projectTitle: string;
  currentStep: WizardStep;
  draft: PartialVideoBriefDraft;
  reachableSteps: WizardStep[];
  children: React.ReactNode;
};

export function BriefWizardShell({
  projectId,
  projectTitle,
  currentStep,
  draft,
  reachableSteps,
  children,
}: BriefWizardShellProps) {
  const stepConfig = getStepConfig(currentStep);

  return (
    <main id="main-content" className="flex-1 py-10">
      <PageContainer className="max-w-4xl space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${projectId}`}>Back to project</Link>
          </Button>
        </div>

        <div className="space-y-3">
          <SectionHeading
            headingLevel={1}
            eyebrow={projectTitle}
            title="Video brief"
            description="Collect and validate your production requirements. Prompt Pilot does not generate videos or images."
          />
          <BriefStatusBadge draft={draft} />
        </div>

        <BriefWizardProgress draft={draft} currentStep={currentStep} />
        <BriefWizardNavigation
          projectId={projectId}
          currentStep={currentStep}
          reachableSteps={reachableSteps}
        />

        <section aria-labelledby="wizard-step-heading" className="space-y-4">
          <SectionHeading
            headingLevel={2}
            title={stepConfig.label}
            description={stepConfig.description}
          />
          <div id="wizard-step-heading" className="sr-only">
            {stepConfig.label}
          </div>
          {children}
        </section>
      </PageContainer>
    </main>
  );
}
