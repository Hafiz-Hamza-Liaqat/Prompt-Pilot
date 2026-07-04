export const APPLICATION_OWNED_PUBLIC_TABLES = [
  'profiles',
  'projects',
  'video_briefs',
  'ai_video_providers',
  'ai_video_offerings',
  'ai_video_sources',
  'ai_video_capability_facts',
] as const;

export const APPLICATION_TABLE_COUNT = APPLICATION_OWNED_PUBLIC_TABLES.length;

export const FOUNDATION_TABLES = ['profiles', 'projects', 'video_briefs'] as const;

export const CATALOGUE_TABLES = [
  'ai_video_providers',
  'ai_video_offerings',
  'ai_video_sources',
  'ai_video_capability_facts',
] as const;

export const FORBIDDEN_APPLICATION_TABLES = [
  'scenes',
  'scene_plans',
  'video_plans',
  'recommendations',
  'provider_recommendations',
  'result_workspaces',
  'prompt_outputs',
] as const;

export type ApplicationOwnedPublicTable = (typeof APPLICATION_OWNED_PUBLIC_TABLES)[number];
