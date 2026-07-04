import {
  WORKSPACE_PREVIEW_TITLE,
  WORKSPACE_SAMPLE_DISCLAIMER,
  WORKSPACE_SECTIONS,
  type WorkspaceSection,
} from '@/domain/mockResultWorkspace';

export const WORKSPACE_SECTION_LABELS: Record<WorkspaceSection, string> = {
  overview: 'Overview',
  providers: 'Provider catalogue',
  scenes: 'Scene roadmap',
  prompts: 'Prompt package',
  continuity: 'Continuity',
  'audio-editing': 'Audio and editing',
  quality: 'Quality review',
};

export const WORKSPACE_SECTION_DESCRIPTIONS: Record<WorkspaceSection, string> = {
  overview:
    'Real project and completed brief context with preview-only workspace status.',
  providers:
    'Catalogue reference — not recommendations. Provider entries are not evaluated against this brief.',
  scenes:
    'Deterministic duration decomposition. Creative scene descriptions are not generated in this phase.',
  prompts:
    'Static prompt-section layout preview. Provider-specific prompt compilation is not active.',
  continuity:
    'Static continuity checklist preview organized for future continuity guidance.',
  'audio-editing':
    'Static audio and editing layout preview without generated scripts or audio.',
  quality:
    'Future quality-review checklist preview. Automated quality evaluation is not implemented.',
};

export const WORKSPACE_TRUTHFULNESS_NOTICES = {
  previewTitle: WORKSPACE_PREVIEW_TITLE,
  sampleDisclaimer: WORKSPACE_SAMPLE_DISCLAIMER,
  hybridNotice:
    'The scene roadmap is calculated deterministically from the saved duration. Prompt, continuity, audio/editing, and quality sections still use static demonstration data. No AI model or provider has generated or recommended this plan.',
  providerPanelLabel: 'Catalogue reference — not recommendations',
  providerUnevaluatedNotice:
    'These catalogue entries have not been evaluated against this brief.',
  sceneRoadmapNotice:
    'Timing is calculated from the saved duration using fixed structural rules. Creative scene content is added in later phases.',
  promptInactiveNotice: 'Provider-specific prompt compilation is not active.',
  qualityInactiveNotice: 'Automated quality evaluation is not implemented.',
  overviewPreviewStatus: 'Preview only',
  overviewNoPlan: 'No final production plan has been generated',
  overviewNoRecommendation: 'No provider has been recommended',
} as const;

export const WORKSPACE_SCENE_ROADMAP_NOTICE = WORKSPACE_TRUTHFULNESS_NOTICES.sceneRoadmapNotice;

export const WORKSPACE_SAMPLE_BADGE_LABEL = 'Sample';
export const WORKSPACE_INTERFACE_PREVIEW_LABEL = 'Interface preview';
export const WORKSPACE_CATALOGUE_REFERENCE_LABEL = 'Catalogue reference';
export const WORKSPACE_DETERMINISTIC_BADGE_LABEL = 'Deterministic timing';
export const WORKSPACE_RULE_BASED_BADGE_LABEL = 'Rule-based';

export const EVALUATION_STATE_LABELS = {
  not_evaluated: 'Not evaluated',
  future_evaluation: 'Future evaluation',
  brief_available: 'Brief available',
  relevant: 'Relevant',
  not_requested: 'Not requested',
} as const;

export function buildWorkspaceSectionHref(projectId: string, section: WorkspaceSection): string {
  if (section === 'overview') {
    return `/projects/${projectId}/workspace`;
  }

  return `/projects/${projectId}/workspace?section=${section}`;
}

export const resultWorkspaceSections = WORKSPACE_SECTIONS.map((value) => ({
  value,
  label: WORKSPACE_SECTION_LABELS[value],
  description: WORKSPACE_SECTION_DESCRIPTIONS[value],
}));
