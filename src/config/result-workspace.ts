import {
  WORKSPACE_PREVIEW_TITLE,
  WORKSPACE_SAMPLE_DISCLAIMER,
  WORKSPACE_SECTIONS,
  type WorkspaceSection,
} from '@/domain/mockResultWorkspace';

export const WORKSPACE_SECTION_LABELS: Record<WorkspaceSection, string> = {
  overview: 'Overview',
  analysis: 'Reference analysis',
  providers: 'Provider recommendations',
  scenes: 'Scene roadmap',
  prompts: 'Prompt package',
  continuity: 'Continuity',
  'audio-editing': 'Audio and editing',
  quality: 'Complexity and risk',
};

export const WORKSPACE_SECTION_DESCRIPTIONS: Record<WorkspaceSection, string> = {
  overview:
    'Real project and completed brief context with preview-only workspace status.',
  analysis:
    'Persisted reference video analysis from the saved intelligence bundle. Display only — no regeneration in this view.',
  providers:
    'Evidence-backed provider and offering candidates derived from the saved brief and current catalogue snapshot.',
  scenes:
    'Deterministic duration decomposition. Creative scene descriptions are not generated in this phase.',
  prompts:
    'Static prompt-section layout preview. Provider-specific prompt compilation is not active.',
  continuity:
    'Static continuity checklist preview organized for future continuity guidance.',
  'audio-editing':
    'Static audio and editing layout preview without generated scripts or audio.',
  quality:
    'Transparent rule-based planning complexity and execution-risk assessment.',
};

export const WORKSPACE_TRUTHFULNESS_NOTICES = {
  previewTitle: WORKSPACE_PREVIEW_TITLE,
  sampleDisclaimer: WORKSPACE_SAMPLE_DISCLAIMER,
  hybridNotice:
    'Scene timing, complexity, execution risk, and provider recommendations are calculated using transparent deterministic rules and the saved source-backed catalogue. Prompt, continuity, and audio/editing sections still use static demonstration data. No AI model or provider has generated this plan.',
  recommendationNoticeTitle: 'Evidence-backed recommendations',
  recommendationNotice:
    'Provider recommendations evaluate individual offerings against the saved brief using catalogue evidence only. They are not success probabilities, quality scores, or guarantees.',
  sceneRoadmapNotice:
    'Timing is calculated from the saved duration using fixed structural rules. Creative scene content is added in later phases.',
  complexityRiskNotice:
    'These values are planning heuristics derived from the saved brief and scene structure. They are not success probabilities, provider recommendations, or quality scores.',
  promptInactiveNotice: 'Provider-specific prompt compilation is not active.',
  overviewPreviewStatus: 'Preview only',
  overviewNoPlan: 'No final production plan has been generated',
  overviewNoRecommendation: 'No provider execution has been performed',
} as const;

export const WORKSPACE_SCENE_ROADMAP_NOTICE = WORKSPACE_TRUTHFULNESS_NOTICES.sceneRoadmapNotice;
export const WORKSPACE_COMPLEXITY_RISK_NOTICE = WORKSPACE_TRUTHFULNESS_NOTICES.complexityRiskNotice;

export const WORKSPACE_SAMPLE_BADGE_LABEL = 'Sample';
export const WORKSPACE_INTERFACE_PREVIEW_LABEL = 'Interface preview';
export const WORKSPACE_CATALOGUE_REFERENCE_LABEL = 'Catalogue reference';
export const WORKSPACE_DETERMINISTIC_BADGE_LABEL = 'Deterministic timing';
export const WORKSPACE_RULE_BASED_BADGE_LABEL = 'Rule-based';
export const WORKSPACE_EVIDENCE_ENGINE_BADGE_LABEL = 'Evidence engine';

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
