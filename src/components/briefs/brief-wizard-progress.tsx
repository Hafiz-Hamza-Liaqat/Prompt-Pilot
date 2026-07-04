import {
  getProgressPercentage,
  getStepIndex,
  type PartialVideoBriefDraft,
  type WizardStep,
} from '@/domain/videoBriefDraft';
import { WIZARD_STEP_CONFIG } from '@/config/video-brief-wizard';

type BriefWizardProgressProps = {
  draft: PartialVideoBriefDraft;
  currentStep: WizardStep;
};

export function BriefWizardProgress({ draft, currentStep }: BriefWizardProgressProps) {
  const percentage = getProgressPercentage(draft);
  const currentConfig = WIZARD_STEP_CONFIG.find((step) => step.value === currentStep);

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Saved brief input progress</p>
          <p className="text-sm text-muted-foreground">
            {percentage}% of required input steps saved
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Step {getStepIndex(currentStep) + 1} of {WIZARD_STEP_CONFIG.length}
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-label="Saved brief input progress"
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {currentConfig ? (
        <p className="text-sm text-muted-foreground">{currentConfig.description}</p>
      ) : null}
    </div>
  );
}
