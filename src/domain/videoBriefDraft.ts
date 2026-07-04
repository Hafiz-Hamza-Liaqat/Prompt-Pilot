import { z } from 'zod';
import { DurationSecondsSchema, IsoDateTimeSchema } from './common';
import {
  AspectRatioSchema,
  BudgetPrioritySchema,
  QualityPrioritySchema,
  PublishingDestinationSchema,
  VideoCategorySchema,
} from './constants';
import { projectIdSchema } from './project';

/** Mirrors ProductionRequirementsSchema from videoBrief.ts for wizard use without pulling Phase 1 planning imports into client bundles. */
export const wizardProductionRequirementsSchema = z.object({
  characterConsistency: z.boolean(),
  productConsistency: z.boolean(),
  logoAccuracy: z.boolean(),
  exactTextVisibility: z.boolean(),
  nativeAudio: z.boolean(),
  dialogue: z.boolean(),
  voiceover: z.boolean(),
  lipSync: z.boolean(),
  multipleLocations: z.boolean(),
  cameraControl: z.boolean(),
  firstLastFrameControl: z.boolean(),
  videoExtension: z.boolean(),
  referenceImages: z.boolean(),
  commercialUse: z.boolean(),
});

/**
 * UI-supported wizard source types. The global `SourceTypeSchema` in constants.ts
 * also includes `template`; template-based creation is deferred until the approved
 * template module — do not expose it in the wizard.
 */
export const WIZARD_SOURCE_TYPES = [
  'idea',
  'script',
  'product_url',
  'article_url',
] as const;

export const WIZARD_STEPS = [
  'source',
  'objective',
  'destination',
  'category',
  'duration',
  'style',
  'requirements',
  'priorities',
  'review',
] as const;

/** Input-collecting steps only; excludes the review confirmation step. */
export const WIZARD_INPUT_STEPS = WIZARD_STEPS.slice(0, -1);

export const BRIEF_ACTION_STATUSES = [
  'idle',
  'success',
  'validation_error',
  'not_authenticated',
  'not_found',
  'forbidden',
  'project_archived',
  'persistence_error',
] as const;

export type WizardSourceType = (typeof WIZARD_SOURCE_TYPES)[number];
export type WizardStep = (typeof WIZARD_STEPS)[number];
export type WizardInputStep = (typeof WIZARD_INPUT_STEPS)[number];
export type BriefActionStatus = (typeof BRIEF_ACTION_STATUSES)[number];

export const WizardSourceTypeSchema = z.enum(WIZARD_SOURCE_TYPES);
export const WizardStepSchema = z.enum(WIZARD_STEPS);
export const BriefActionStatusSchema = z.enum(BRIEF_ACTION_STATUSES);

const DANGEROUS_CONTROL_CHARS_SHORT = /[\u0000-\u001F\u007F]/;
const DANGEROUS_CONTROL_CHARS_LONG = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function hasNoDangerousShortText(value: string): boolean {
  return !DANGEROUS_CONTROL_CHARS_SHORT.test(value);
}

function hasNoDangerousLongText(value: string): boolean {
  return !DANGEROUS_CONTROL_CHARS_LONG.test(value);
}

function hasNoUrlCredentials(value: string): boolean {
  try {
    const url = new URL(value);
    return url.username.length === 0 && url.password.length === 0;
  } catch {
    return false;
  }
}

export const briefIdSchema = z.string().uuid('Brief ID must be a valid UUID.');

export const ideaSourceTextSchema = z
  .string()
  .trim()
  .min(10, 'Idea must be at least 10 characters.')
  .max(5000, 'Idea must be 5,000 characters or fewer.')
  .refine(hasNoDangerousLongText, {
    message: 'Idea contains invalid characters.',
  });

export const scriptSourceTextSchema = z
  .string()
  .trim()
  .min(10, 'Script must be at least 10 characters.')
  .max(20000, 'Script must be 20,000 characters or fewer.')
  .refine(hasNoDangerousLongText, {
    message: 'Script contains invalid characters.',
  });

export const wizardSourceUrlSchema = z
  .string()
  .trim()
  .max(2048, 'URL must be 2,048 characters or fewer.')
  .url('Must be a valid URL.')
  .refine(
    (value) => value.startsWith('http://') || value.startsWith('https://'),
    'URL must use HTTP or HTTPS.',
  )
  .refine((value) => !value.startsWith('//'), 'Protocol-relative URLs are not allowed.')
  .refine(hasNoUrlCredentials, 'URL must not contain credentials.')
  .refine(hasNoDangerousShortText, {
    message: 'URL contains invalid characters.',
  });

export const workingTitleSchema = z
  .string()
  .trim()
  .min(1, 'Working title is required.')
  .max(120, 'Working title must be 120 characters or fewer.')
  .refine(hasNoDangerousShortText, {
    message: 'Working title contains invalid characters.',
  });

export const objectiveSchema = z
  .string()
  .trim()
  .min(10, 'Objective must be at least 10 characters.')
  .max(1000, 'Objective must be 1,000 characters or fewer.')
  .refine(hasNoDangerousLongText, {
    message: 'Objective contains invalid characters.',
  });

export const targetAudienceSchema = z
  .string()
  .trim()
  .min(2, 'Target audience must be at least 2 characters.')
  .max(500, 'Target audience must be 500 characters or fewer.')
  .refine(hasNoDangerousShortText, {
    message: 'Target audience contains invalid characters.',
  });

export const visualStyleSchema = z
  .string()
  .trim()
  .min(2, 'Visual style must be at least 2 characters.')
  .max(120, 'Visual style must be 120 characters or fewer.')
  .refine(hasNoDangerousShortText, {
    message: 'Visual style contains invalid characters.',
  });

export const toneSchema = z
  .string()
  .trim()
  .min(2, 'Tone must be at least 2 characters.')
  .max(120, 'Tone must be 120 characters or fewer.')
  .refine(hasNoDangerousShortText, {
    message: 'Tone contains invalid characters.',
  });

export const userConstraintsValueSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  z
    .string()
    .trim()
    .max(2000, 'Constraints must be 2,000 characters or fewer.')
    .refine(hasNoDangerousLongText, {
      message: 'Constraints contain invalid characters.',
    })
    .nullable(),
);

export const userConstraintsSchema = z.preprocess(
  (value) => (value === undefined || value === null ? '' : value),
  z
    .string()
    .trim()
    .max(2000, 'Constraints must be 2,000 characters or fewer.')
    .refine(hasNoDangerousLongText, {
      message: 'Constraints contain invalid characters.',
    })
    .transform((value) => (value.length === 0 ? null : value)),
);

const ideaSourceStepSchema = z.object({
  sourceType: z.literal('idea'),
  sourceText: ideaSourceTextSchema,
  sourceUrl: z.null().optional(),
});

const scriptSourceStepSchema = z.object({
  sourceType: z.literal('script'),
  sourceText: scriptSourceTextSchema,
  sourceUrl: z.null().optional(),
});

const productUrlSourceStepSchema = z.object({
  sourceType: z.literal('product_url'),
  sourceText: z.null().optional(),
  sourceUrl: wizardSourceUrlSchema,
});

const articleUrlSourceStepSchema = z.object({
  sourceType: z.literal('article_url'),
  sourceText: z.null().optional(),
  sourceUrl: wizardSourceUrlSchema,
});

export const sourceStepSchema = z
  .discriminatedUnion('sourceType', [
    ideaSourceStepSchema,
    scriptSourceStepSchema,
    productUrlSourceStepSchema,
    articleUrlSourceStepSchema,
  ])
  .transform((value) => {
    if (value.sourceType === 'idea' || value.sourceType === 'script') {
      return { ...value, sourceUrl: null };
    }

    return { ...value, sourceText: null };
  });

export const objectiveStepSchema = z.object({
  workingTitle: workingTitleSchema,
  objective: objectiveSchema,
  targetAudience: targetAudienceSchema,
});

export const destinationStepSchema = z.object({
  publishingDestination: PublishingDestinationSchema,
  aspectRatio: AspectRatioSchema,
});

export const categoryStepSchema = z.object({
  videoCategory: VideoCategorySchema,
});

export const durationStepSchema = z.object({
  durationSeconds: DurationSecondsSchema,
});

export const styleStepSchema = z.object({
  visualStyle: visualStyleSchema,
  tone: toneSchema,
});

export const requirementsStepSchema = z.object({
  productionRequirements: wizardProductionRequirementsSchema,
});

export const prioritiesStepSchema = z.object({
  budgetPriority: BudgetPrioritySchema,
  qualityPriority: QualityPrioritySchema,
  userConstraints: userConstraintsSchema,
});

export const reviewStepSchema = z.object({});

export type SourceStepInput = z.infer<typeof sourceStepSchema>;
export type ObjectiveStepInput = z.infer<typeof objectiveStepSchema>;
export type DestinationStepInput = z.infer<typeof destinationStepSchema>;
export type CategoryStepInput = z.infer<typeof categoryStepSchema>;
export type DurationStepInput = z.infer<typeof durationStepSchema>;
export type StyleStepInput = z.infer<typeof styleStepSchema>;
export type RequirementsStepInput = z.infer<typeof requirementsStepSchema>;
export type PrioritiesStepInput = z.infer<typeof prioritiesStepSchema>;
export type ReviewStepInput = z.infer<typeof reviewStepSchema>;

export const PartialVideoBriefDraftSchema = z.object({
  id: briefIdSchema,
  projectId: projectIdSchema,
  sourceType: WizardSourceTypeSchema.nullable().optional(),
  sourceText: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  workingTitle: z.string().nullable().optional(),
  objective: z.string().nullable().optional(),
  targetAudience: z.string().nullable().optional(),
  publishingDestination: PublishingDestinationSchema.nullable().optional(),
  aspectRatio: AspectRatioSchema.nullable().optional(),
  videoCategory: VideoCategorySchema.nullable().optional(),
  durationSeconds: DurationSecondsSchema.nullable().optional(),
  visualStyle: z.string().nullable().optional(),
  tone: z.string().nullable().optional(),
  productionRequirements: wizardProductionRequirementsSchema.partial().nullable().optional(),
  budgetPriority: BudgetPrioritySchema.nullable().optional(),
  qualityPriority: QualityPrioritySchema.nullable().optional(),
  userConstraints: z.string().nullable().optional(),
  completedAt: IsoDateTimeSchema.nullable().optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const CompleteVideoBriefDraftSchema = z
  .object({
    id: briefIdSchema,
    projectId: projectIdSchema,
    sourceType: WizardSourceTypeSchema,
    sourceText: z.string().nullable(),
    sourceUrl: z.string().nullable(),
    workingTitle: workingTitleSchema,
    objective: objectiveSchema,
    targetAudience: targetAudienceSchema,
    publishingDestination: PublishingDestinationSchema,
    aspectRatio: AspectRatioSchema,
    videoCategory: VideoCategorySchema,
    durationSeconds: DurationSecondsSchema,
    visualStyle: visualStyleSchema,
    tone: toneSchema,
    productionRequirements: wizardProductionRequirementsSchema,
    budgetPriority: BudgetPrioritySchema,
    qualityPriority: QualityPrioritySchema,
    userConstraints: userConstraintsValueSchema,
    completedAt: IsoDateTimeSchema.nullable(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .superRefine((draft, ctx) => {
    const sourceResult = sourceStepSchema.safeParse({
      sourceType: draft.sourceType,
      sourceText: draft.sourceText,
      sourceUrl: draft.sourceUrl,
    });

    if (!sourceResult.success) {
      for (const issue of sourceResult.error.issues) {
        ctx.addIssue(issue);
      }
    }
  });

export type PartialVideoBriefDraft = z.infer<typeof PartialVideoBriefDraftSchema>;
export type CompleteVideoBriefDraft = z.infer<typeof CompleteVideoBriefDraftSchema>;

export function parseCheckboxValue(value: FormDataEntryValue | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  const normalized = String(value);
  return normalized === 'on' || normalized === 'true';
}

export function getStepIndex(step: WizardStep): number {
  return WIZARD_STEPS.indexOf(step);
}

export function getPreviousStep(step: WizardStep): WizardStep | null {
  const index = getStepIndex(step);
  return index > 0 ? WIZARD_STEPS[index - 1]! : null;
}

export function getNextStep(step: WizardStep): WizardStep | null {
  const index = getStepIndex(step);
  return index >= 0 && index < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[index + 1]! : null;
}

export function parseWizardStep(value: unknown): WizardStep | null {
  const parsed = WizardStepSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function isBriefActionStatus(value: string): value is BriefActionStatus {
  return BRIEF_ACTION_STATUSES.includes(value as BriefActionStatus);
}

function buildSourceStepInput(draft: PartialVideoBriefDraft): unknown {
  return {
    sourceType: draft.sourceType,
    sourceText: draft.sourceText ?? null,
    sourceUrl: draft.sourceUrl ?? null,
  };
}

export function isSourceStepComplete(draft: PartialVideoBriefDraft): boolean {
  return sourceStepSchema.safeParse(buildSourceStepInput(draft)).success;
}

export function isObjectiveStepComplete(draft: PartialVideoBriefDraft): boolean {
  return objectiveStepSchema.safeParse({
    workingTitle: draft.workingTitle,
    objective: draft.objective,
    targetAudience: draft.targetAudience,
  }).success;
}

export function isDestinationStepComplete(draft: PartialVideoBriefDraft): boolean {
  return destinationStepSchema.safeParse({
    publishingDestination: draft.publishingDestination,
    aspectRatio: draft.aspectRatio,
  }).success;
}

export function isCategoryStepComplete(draft: PartialVideoBriefDraft): boolean {
  return categoryStepSchema.safeParse({
    videoCategory: draft.videoCategory,
  }).success;
}

export function isDurationStepComplete(draft: PartialVideoBriefDraft): boolean {
  return durationStepSchema.safeParse({
    durationSeconds: draft.durationSeconds,
  }).success;
}

export function isStyleStepComplete(draft: PartialVideoBriefDraft): boolean {
  return styleStepSchema.safeParse({
    visualStyle: draft.visualStyle,
    tone: draft.tone,
  }).success;
}

export function isRequirementsStepComplete(draft: PartialVideoBriefDraft): boolean {
  return requirementsStepSchema.safeParse({
    productionRequirements: draft.productionRequirements,
  }).success;
}

export function isPrioritiesStepComplete(draft: PartialVideoBriefDraft): boolean {
  return prioritiesStepSchema.safeParse({
    budgetPriority: draft.budgetPriority,
    qualityPriority: draft.qualityPriority,
    userConstraints: draft.userConstraints ?? null,
  }).success;
}

export function areAllInputStepsComplete(draft: PartialVideoBriefDraft): boolean {
  return WIZARD_INPUT_STEPS.every((step) => isStepComplete(step, draft));
}

export function isReviewStepComplete(draft: PartialVideoBriefDraft): boolean {
  return areAllInputStepsComplete(draft);
}

export function isStepComplete(step: WizardStep, draft: PartialVideoBriefDraft): boolean {
  switch (step) {
    case 'source':
      return isSourceStepComplete(draft);
    case 'objective':
      return isObjectiveStepComplete(draft);
    case 'destination':
      return isDestinationStepComplete(draft);
    case 'category':
      return isCategoryStepComplete(draft);
    case 'duration':
      return isDurationStepComplete(draft);
    case 'style':
      return isStyleStepComplete(draft);
    case 'requirements':
      return isRequirementsStepComplete(draft);
    case 'priorities':
      return isPrioritiesStepComplete(draft);
    case 'review':
      return isReviewStepComplete(draft);
    default: {
      const exhaustiveCheck: never = step;
      return exhaustiveCheck;
    }
  }
}

export function getFirstIncompleteStep(draft: PartialVideoBriefDraft): WizardStep {
  for (const step of WIZARD_STEPS) {
    if (!isStepComplete(step, draft)) {
      return step;
    }
  }

  return 'review';
}

export function getReachableSteps(draft: PartialVideoBriefDraft): WizardStep[] {
  const firstIncomplete = getFirstIncompleteStep(draft);
  const firstIncompleteIndex = getStepIndex(firstIncomplete);

  return WIZARD_STEPS.filter((step, index) => {
    if (step === 'review') {
      return areAllInputStepsComplete(draft);
    }

    return index <= firstIncompleteIndex;
  });
}

export function getProgressPercentage(draft: PartialVideoBriefDraft): number {
  const completedCount = WIZARD_INPUT_STEPS.filter((step) =>
    isStepComplete(step, draft),
  ).length;

  const percentage = Math.round((completedCount / WIZARD_INPUT_STEPS.length) * 100);
  return Math.min(percentage, 100);
}

export const BRIEF_STATUSES = ['not_started', 'draft', 'ready'] as const;
export type BriefStatus = (typeof BRIEF_STATUSES)[number];

export const BRIEF_NOTICES = {
  briefReady: 'brief-ready',
  briefReopened: 'brief-reopened',
  projectArchived: 'project-archived',
} as const;
export type BriefNotice = (typeof BRIEF_NOTICES)[keyof typeof BRIEF_NOTICES];

export const BRIEF_NOTICE_MESSAGES: Record<BriefNotice, string> = {
  'brief-ready':
    'Video brief marked ready. Provider recommendations and production planning are added in later phases.',
  'brief-reopened': 'Video brief reopened for editing.',
  'project-archived': 'Restore this project before editing the video brief.',
};

export function deriveBriefStatus(draft: PartialVideoBriefDraft | null | undefined): BriefStatus {
  if (!draft) {
    return 'not_started';
  }

  if (draft.completedAt) {
    return 'ready';
  }

  return 'draft';
}

export function isBriefNotice(value: string | null | undefined): value is BriefNotice {
  if (!value) {
    return false;
  }

  return Object.values(BRIEF_NOTICES).includes(value as BriefNotice);
}
