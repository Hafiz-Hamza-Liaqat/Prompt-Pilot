import type { ComplexityRiskAssessment } from '@/domain/complexityRiskAssessment';
import type {
  MockAudioEditingItem,
  MockContinuityItem,
  MockPromptSection,
  MockResultWorkspaceStaticFixture,
  WorkspaceBriefSummary,
  WorkspaceProjectSummary,
  WorkspaceSection,
} from '@/domain/mockResultWorkspace';
import { WORKSPACE_SECTION_ORIGINS } from '@/domain/mockResultWorkspace';
import type { ProviderRecommendationResult } from '@/domain/providerRecommendationEngine';
import type { SceneDecomposition } from '@/domain/sceneDecomposition';
import type { JobState } from '@/domain/canonical';
import type { EntityId } from '@/domain/canonical/primitives';
import type { AnalysisViewModel } from '@/domain/workspace/analysis-display';

/** Read-model intelligence metadata derived from the workspace bundle aggregate. */
export type WorkspaceIntelligenceViewModel = {
  referenceId: EntityId | null;
  analysisId: EntityId | null;
  activeJobState: JobState | null;
};

/**
 * Workspace read model for Composer output (PP-11 Slice 2).
 * Extends the hybrid preview shape with optional persisted analysis projection.
 */
export type WorkspaceViewModel = {
  mode: 'hybrid_preview' | 'analysis_available';
  dataOrigin: 'mixed';
  isDecisionReady: false;
  fixtureVersion: MockResultWorkspaceStaticFixture['fixtureVersion'];
  sampleDisclaimer: string;
  previewTitle: 'Planning workspace preview';
  sectionOrigins: typeof WORKSPACE_SECTION_ORIGINS;
  activeSection: WorkspaceSection;
  project: WorkspaceProjectSummary;
  brief: WorkspaceBriefSummary;
  sceneDecomposition: SceneDecomposition;
  complexityRiskAssessment: ComplexityRiskAssessment;
  providerRecommendation: ProviderRecommendationResult;
  samplePromptSections: MockPromptSection[];
  continuityItems: MockContinuityItem[];
  audioEditingItems: MockAudioEditingItem[];
  analysis: AnalysisViewModel | null;
  intelligence: WorkspaceIntelligenceViewModel;
};
