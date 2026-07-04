export const siteConfig = {
  name: 'Prompt Pilot',
  slug: 'prompt-pilot',
  title: 'Prompt Pilot',
  description:
    'Prompt Pilot plans AI-video workflows, recommends appropriate AI-video providers, and creates structured prompt and production guidance. It does not generate videos. It does not generate images.',
  capabilities: {
    generatesVideos: false,
    generatesImages: false,
  },
} as const;
