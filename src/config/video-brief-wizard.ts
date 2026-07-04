import {
  ASPECT_RATIOS,
  BUDGET_PRIORITIES,
  DURATION_PRESETS_SECONDS,
  PUBLISHING_DESTINATIONS,
  QUALITY_PRIORITIES,
  VIDEO_CATEGORIES,
} from '@/domain/constants';
import type { ProductionRequirements } from '@/domain/videoBrief';
import { WIZARD_SOURCE_TYPES, WIZARD_STEPS, type WizardStep } from '@/domain/videoBriefDraft';

export type WizardOption<T extends string = string> = {
  value: T;
  label: string;
};

export type WizardStepConfig = {
  value: WizardStep;
  label: string;
  description: string;
};

function titleCaseWords(value: string): string {
  return value
    .split('_')
    .map((word) => {
      if (word === 'ugc') return 'UGC';
      if (word === 'url') return 'URL';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

const STEP_LABELS: Record<WizardStep, { label: string; description: string }> = {
  source: {
    label: 'Source',
    description: 'Choose where your video idea comes from.',
  },
  objective: {
    label: 'Objective',
    description: 'Define the working title, goal, and audience.',
  },
  destination: {
    label: 'Publishing destination',
    description: 'Select where the finished video will be published.',
  },
  category: {
    label: 'Video category',
    description: 'Choose the content type that best matches your plan.',
  },
  duration: {
    label: 'Duration',
    description: 'Set the target length for your production plan.',
  },
  style: {
    label: 'Visual style',
    description: 'Describe the look and tone you want.',
  },
  requirements: {
    label: 'Production requirements',
    description: 'Select capabilities your plan may need.',
  },
  priorities: {
    label: 'Budget and quality',
    description: 'Set cost and quality priorities plus optional constraints.',
  },
  review: {
    label: 'Review',
    description: 'Confirm your saved brief before marking it ready.',
  },
};

export const WIZARD_STEP_CONFIG: readonly WizardStepConfig[] = WIZARD_STEPS.map((step) => ({
  value: step,
  label: STEP_LABELS[step].label,
  description: STEP_LABELS[step].description,
}));

const SOURCE_TYPE_LABELS: Record<(typeof WIZARD_SOURCE_TYPES)[number], string> = {
  idea: 'Idea',
  script: 'Script',
  product_url: 'Product page URL',
  article_url: 'Article URL',
};

export const SOURCE_TYPE_OPTIONS: readonly WizardOption<(typeof WIZARD_SOURCE_TYPES)[number]>[] =
  WIZARD_SOURCE_TYPES.map((value) => ({
    value,
    label: SOURCE_TYPE_LABELS[value],
  }));

const DESTINATION_LABELS: Record<(typeof PUBLISHING_DESTINATIONS)[number], string> = {
  youtube: 'YouTube',
  youtube_shorts: 'YouTube Shorts',
  instagram_reels: 'Instagram Reels',
  instagram_feed: 'Instagram Feed',
  facebook_reels: 'Facebook Reels',
  facebook_feed: 'Facebook Feed',
  tiktok: 'TikTok',
  website: 'Website',
  custom: 'Custom destination',
};

export const DESTINATION_OPTIONS: readonly WizardOption<(typeof PUBLISHING_DESTINATIONS)[number]>[] =
  PUBLISHING_DESTINATIONS.map((value) => ({
    value,
    label: DESTINATION_LABELS[value],
  }));

const ASPECT_RATIO_LABELS: Record<(typeof ASPECT_RATIOS)[number], string> = {
  '16:9': '16:9 (landscape)',
  '9:16': '9:16 (vertical)',
  '1:1': '1:1 (square)',
  '4:5': '4:5 (portrait feed)',
  custom: 'Custom aspect ratio',
};

export const ASPECT_RATIO_OPTIONS: readonly WizardOption<(typeof ASPECT_RATIOS)[number]>[] =
  ASPECT_RATIOS.map((value) => ({
    value,
    label: ASPECT_RATIO_LABELS[value],
  }));

const CATEGORY_LABELS: Record<(typeof VIDEO_CATEGORIES)[number], string> = {
  product_advertisement: 'Product advertisement',
  ugc_advertisement: 'UGC-style advertisement',
  cinematic_short: 'Cinematic short',
  faceless_educational: 'Faceless educational',
  explainer: 'Explainer',
  product_demonstration: 'Product demonstration',
  story_narrative: 'Story narrative',
  realistic_social_scene: 'Realistic social scene',
  youtube_intro_trailer: 'YouTube intro or trailer',
  real_estate_showcase: 'Real estate showcase',
  news_informational_recap: 'News or informational recap',
  app_software_promotion: 'App or software promotion',
};

export const CATEGORY_OPTIONS: readonly WizardOption<(typeof VIDEO_CATEGORIES)[number]>[] =
  VIDEO_CATEGORIES.map((value) => ({
    value,
    label: CATEGORY_LABELS[value],
  }));

export const DURATION_PRESET_OPTIONS: readonly WizardOption<string>[] =
  DURATION_PRESETS_SECONDS.map((seconds) => ({
    value: String(seconds),
    label: `${seconds} seconds`,
  }));

const BUDGET_PRIORITY_LABELS: Record<(typeof BUDGET_PRIORITIES)[number], string> = {
  free_only: 'Free only',
  low_cost: 'Low cost',
  balanced: 'Balanced',
  highest_quality: 'Highest quality',
  fastest: 'Fastest turnaround',
};

export const BUDGET_PRIORITY_OPTIONS: readonly WizardOption<(typeof BUDGET_PRIORITIES)[number]>[] =
  BUDGET_PRIORITIES.map((value) => ({
    value,
    label: BUDGET_PRIORITY_LABELS[value],
  }));

const QUALITY_PRIORITY_LABELS: Record<(typeof QUALITY_PRIORITIES)[number], string> = {
  fastest: 'Fastest turnaround',
  balanced: 'Balanced',
  highest_quality: 'Highest quality',
};

export const QUALITY_PRIORITY_OPTIONS: readonly WizardOption<(typeof QUALITY_PRIORITIES)[number]>[] =
  QUALITY_PRIORITIES.map((value) => ({
    value,
    label: QUALITY_PRIORITY_LABELS[value],
  }));

export const PRODUCTION_REQUIREMENT_FIELDS = [
  'characterConsistency',
  'productConsistency',
  'logoAccuracy',
  'exactTextVisibility',
  'nativeAudio',
  'dialogue',
  'voiceover',
  'lipSync',
  'multipleLocations',
  'cameraControl',
  'firstLastFrameControl',
  'videoExtension',
  'referenceImages',
  'commercialUse',
] as const satisfies readonly (keyof ProductionRequirements)[];

const PRODUCTION_REQUIREMENT_LABELS: Record<
  (typeof PRODUCTION_REQUIREMENT_FIELDS)[number],
  string
> = {
  characterConsistency: 'Character consistency across scenes',
  productConsistency: 'Product consistency across scenes',
  logoAccuracy: 'Logo accuracy',
  exactTextVisibility: 'Exact on-screen text visibility',
  nativeAudio: 'Native audio support',
  dialogue: 'Spoken dialogue',
  voiceover: 'Voiceover narration',
  lipSync: 'Lip sync',
  multipleLocations: 'Multiple locations',
  cameraControl: 'Camera control',
  firstLastFrameControl: 'First and last frame control',
  videoExtension: 'Video extension',
  referenceImages: 'Reference images',
  commercialUse: 'Commercial use',
};

export const PRODUCTION_REQUIREMENT_OPTIONS: readonly WizardOption<
  (typeof PRODUCTION_REQUIREMENT_FIELDS)[number]
>[] = PRODUCTION_REQUIREMENT_FIELDS.map((value) => ({
  value,
  label: PRODUCTION_REQUIREMENT_LABELS[value],
}));

export const WIZARD_SOURCE_TYPE_OPTIONS = SOURCE_TYPE_OPTIONS;
export const WIZARD_DESTINATION_OPTIONS = DESTINATION_OPTIONS;
export const WIZARD_CATEGORY_OPTIONS = CATEGORY_OPTIONS;
export const WIZARD_DURATION_PRESETS = DURATION_PRESETS_SECONDS;
export const WIZARD_BUDGET_PRIORITY_OPTIONS = BUDGET_PRIORITY_OPTIONS;
export const WIZARD_QUALITY_PRIORITY_OPTIONS = QUALITY_PRIORITY_OPTIONS;
export const WIZARD_PRODUCTION_REQUIREMENT_OPTIONS = PRODUCTION_REQUIREMENT_OPTIONS;

export const VIDEO_BRIEF_WIZARD_CONFIG = {
  steps: WIZARD_STEP_CONFIG,
  stepOrder: WIZARD_STEPS,
  sourceTypes: WIZARD_SOURCE_TYPE_OPTIONS,
  destinations: WIZARD_DESTINATION_OPTIONS,
  aspectRatios: ASPECT_RATIO_OPTIONS,
  categories: WIZARD_CATEGORY_OPTIONS,
  durationPresets: WIZARD_DURATION_PRESETS,
  budgetPriorities: WIZARD_BUDGET_PRIORITY_OPTIONS,
  qualityPriorities: WIZARD_QUALITY_PRIORITY_OPTIONS,
  productionRequirements: WIZARD_PRODUCTION_REQUIREMENT_OPTIONS,
} as const;

export const REVIEW_SCRIPT_PREVIEW_LENGTH = 500;

export function getStepConfig(step: WizardStep): WizardStepConfig {
  const config = WIZARD_STEP_CONFIG.find((entry) => entry.value === step);
  return config ?? WIZARD_STEP_CONFIG[0]!;
}

export function getOptionLabel<T extends string>(
  options: readonly WizardOption<T>[],
  value: T | null | undefined,
): string {
  if (!value) {
    return 'Not set';
  }

  return options.find((option) => option.value === value)?.label ?? titleCaseWords(value);
}
