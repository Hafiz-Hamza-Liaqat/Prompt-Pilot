import type { JobState } from '../canonical/constants.js';
import type { ReferenceKind } from '../canonical/constants.js';

/** Pipeline stages aligned with PP-04B — orchestrator coordinates, does not execute. */
export const PIPELINE_STAGE_IDS = [
  'validation',
  'ownership',
  'link_intelligence',
  'media_intake',
  'fingerprint',
  'cache_lookup',
  'core_analysis',
  'package_generation',
  'persistence',
  'workspace_refresh',
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGE_IDS)[number];

/** Port tokens for future service integration — no implementations in PP-08. */
export const STAGE_PORT_IDS = [
  'job_lifecycle',
  'media_intake',
  'link_intelligence',
  'fingerprint',
  'cache',
  'analysis_provider',
  'package_engine',
  'persistence_coordinator',
  'workspace_composer',
] as const;

export type StagePortId = (typeof STAGE_PORT_IDS)[number];

export type StageDefinition = {
  stageId: PipelineStageId;
  label: string;
  /** Job states entered while this stage is active (PP-02 alignment). */
  jobStates: readonly JobState[];
  /** Domain port delegated to when a worker executes this stage. */
  delegatePort: StagePortId;
  dependsOn: readonly PipelineStageId[];
  /** Stage may be skipped (e.g. cache hit, URL skip upload). */
  skippable: boolean;
};

export const STAGE_DEFINITIONS: Record<PipelineStageId, StageDefinition> = {
  validation: {
    stageId: 'validation',
    label: 'Validation',
    jobStates: ['created', 'validated'],
    delegatePort: 'job_lifecycle',
    dependsOn: [],
    skippable: false,
  },
  ownership: {
    stageId: 'ownership',
    label: 'Ownership verification',
    jobStates: ['validated'],
    delegatePort: 'job_lifecycle',
    dependsOn: ['validation'],
    skippable: false,
  },
  link_intelligence: {
    stageId: 'link_intelligence',
    label: 'Link intelligence',
    jobStates: ['preparing'],
    delegatePort: 'link_intelligence',
    dependsOn: ['ownership'],
    skippable: false,
  },
  media_intake: {
    stageId: 'media_intake',
    label: 'Media intake',
    jobStates: ['preparing', 'uploading'],
    delegatePort: 'media_intake',
    dependsOn: ['ownership'],
    skippable: true,
  },
  fingerprint: {
    stageId: 'fingerprint',
    label: 'Fingerprinting',
    jobStates: ['fingerprinting'],
    delegatePort: 'fingerprint',
    dependsOn: ['ownership', 'media_intake'],
    skippable: false,
  },
  cache_lookup: {
    stageId: 'cache_lookup',
    label: 'Cache lookup',
    jobStates: ['fingerprinting'],
    delegatePort: 'cache',
    dependsOn: ['fingerprint'],
    skippable: false,
  },
  core_analysis: {
    stageId: 'core_analysis',
    label: 'Core analysis',
    jobStates: ['analyzing'],
    delegatePort: 'analysis_provider',
    dependsOn: ['cache_lookup'],
    skippable: true,
  },
  package_generation: {
    stageId: 'package_generation',
    label: 'Package generation',
    jobStates: ['generating_packages'],
    delegatePort: 'package_engine',
    dependsOn: ['cache_lookup', 'core_analysis'],
    skippable: true,
  },
  persistence: {
    stageId: 'persistence',
    label: 'Persistence',
    jobStates: ['saving'],
    delegatePort: 'persistence_coordinator',
    dependsOn: ['package_generation'],
    skippable: false,
  },
  workspace_refresh: {
    stageId: 'workspace_refresh',
    label: 'Workspace refresh',
    jobStates: ['completed'],
    delegatePort: 'workspace_composer',
    dependsOn: ['persistence'],
    skippable: false,
  },
};

export type DependencyGraph = Record<PipelineStageId, readonly PipelineStageId[]>;

export function buildDependencyGraph(): DependencyGraph {
  return Object.fromEntries(
    PIPELINE_STAGE_IDS.map((stageId) => [stageId, STAGE_DEFINITIONS[stageId].dependsOn]),
  ) as DependencyGraph;
}

export function requiresMediaIntake(referenceKind: ReferenceKind): boolean {
  return referenceKind === 'video_upload' || referenceKind === 'audio_upload';
}

/**
 * Returns true when a reference kind requires Link Intelligence (PP-05B).
 */
export function requiresLinkIntelligence(referenceKind: ReferenceKind): boolean {
  return referenceKind === 'youtube_url';
}

function resolveFingerprintDependencies(
  referenceKind: ReferenceKind,
  activeStageIds: readonly PipelineStageId[],
): readonly PipelineStageId[] {
  const deps: PipelineStageId[] = ['ownership'];

  if (requiresLinkIntelligence(referenceKind) && activeStageIds.includes('link_intelligence')) {
    deps.push('link_intelligence');
  } else if (requiresMediaIntake(referenceKind) && activeStageIds.includes('media_intake')) {
    deps.push('media_intake');
  }

  return deps;
}

export { resolveFingerprintDependencies };
