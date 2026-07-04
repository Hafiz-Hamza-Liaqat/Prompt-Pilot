import Link from 'next/link';
import type { WizardStep } from '@/domain/videoBriefDraft';
import { WIZARD_STEP_CONFIG } from '@/config/video-brief-wizard';

type BriefWizardNavigationProps = {
  projectId: string;
  currentStep: WizardStep;
  reachableSteps: WizardStep[];
};

export function BriefWizardNavigation({
  projectId,
  currentStep,
  reachableSteps,
}: BriefWizardNavigationProps) {
  return (
    <nav aria-label="Video brief wizard steps" className="rounded-lg border border-border p-4">
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {WIZARD_STEP_CONFIG.map((step, index) => {
          const isReachable = reachableSteps.includes(step.value);
          const isCurrent = step.value === currentStep;

          return (
            <li key={step.value}>
              {isReachable && !isCurrent ? (
                <Link
                  href={`/projects/${projectId}/brief/${step.value}`}
                  className="block rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <span className="font-medium text-foreground">
                    {index + 1}. {step.label}
                  </span>
                </Link>
              ) : (
                <div
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    isCurrent
                      ? 'border border-brand bg-brand/5'
                      : 'border border-dashed border-border text-muted-foreground'
                  }`}
                >
                  <span className={isCurrent ? 'font-medium text-foreground' : undefined}>
                    {index + 1}. {step.label}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
