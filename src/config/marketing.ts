export const workflowSteps = [
  {
    step: 1,
    title: 'Define the brief',
    description:
      'Capture the idea, script, or source material as a normalized video brief with objective, audience, and constraints.',
  },
  {
    step: 2,
    title: 'Assess requirements',
    description:
      'Evaluate complexity, production risk, and provider fit before any prompts are compiled.',
  },
  {
    step: 3,
    title: 'Build the scene roadmap',
    description:
      'Decompose the target duration into an ordered scene timeline with clear narrative roles.',
  },
  {
    step: 4,
    title: 'Compile provider-specific prompts',
    description:
      'Generate structured prompts and continuity guidance tailored to the recommended AI-video provider.',
  },
] as const;

export const capabilities = [
  {
    id: 'provider-recommendation',
    title: 'Provider recommendation',
    description:
      'Explainable, provider-neutral suggestions based on brief requirements — not permanent rankings.',
  },
  {
    id: 'scene-planning',
    title: 'Duration-aware scene planning',
    description:
      'Break longer concepts into scene durations that sum to the target video length.',
  },
  {
    id: 'continuity-guidance',
    title: 'Continuity guidance',
    description:
      'Character, product, world, and style locks to keep generated clips visually consistent.',
  },
  {
    id: 'platform-adaptation',
    title: 'Platform adaptation',
    description:
      'Destination-aware guidance for YouTube, Instagram, TikTok, and other publishing targets.',
  },
] as const;

export const supportedOutputs = [
  'Structured video-production briefs',
  'Provider recommendations with rationale',
  'Scene roadmaps and timelines',
  'Provider-specific prompt packages',
  'Voiceover and editing guidance',
] as const;

export const unsupportedOutputs = [
  'Video generation',
  'Image generation',
  'Social-video downloading',
  'Automatic social publishing',
] as const;

export const marketingContent = {
  workflowSteps,
  capabilities,
  supportedOutputs,
  unsupportedOutputs,
  foundationNotice: 'Application foundation under active development',
  heroBadge: 'Planning layer',
  heroTitle: 'Plan AI-video production with clarity',
  heroDescription:
    'Prompt Pilot is a provider-neutral AI Video Production Planner, Tool Recommendation Engine, and Prompt Compiler. It helps you move from source material to structured plans, recommendations, and prompts.',
  honestyStatement:
    'Prompt Pilot creates structured production plans, recommendations, prompts, and instructions. It does not generate videos or images.',
} as const;
