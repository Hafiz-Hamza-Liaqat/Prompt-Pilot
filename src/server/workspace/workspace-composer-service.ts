import { projectIdSchema, type ProjectRecord } from '@/domain/project';
import {
  createSourcePreview,
  deriveContinuityEvaluationState,
  mapEnabledRequirementLabels,
  MockResultWorkspaceStaticFixtureSchema,
  normalizeWorkspaceSection,
  WORKSPACE_FIXTURE_VERSION,
  WORKSPACE_PREVIEW_TITLE,
  WORKSPACE_SECTION_ORIGINS,
  type MockResultWorkspaceStaticFixture,
  type WorkspaceSection,
} from '@/domain/mockResultWorkspace';
import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';
import type { WorkspaceViewModel } from '@/domain/workspace/workspace-display';
import type { OwnerScope, WorkspaceIntelligenceSnapshot } from '@/server/persistence/contracts';
import type { WorkspaceRepository } from '@/server/persistence/repositories/workspace-repository';
import type { ProjectRepository, RepositoryResult } from '@/server/projects/project-repository';
import type { VideoBriefRepository } from '@/server/briefs/video-brief-repository';
import type { ProviderCatalogueRepository } from '@/server/providers/provider-catalogue-repository';
import {
  createSceneDecompositionService,
  type SceneDecompositionService,
} from '@/server/scenes/scene-decomposition-service';
import {
  createComplexityRiskService,
  type ComplexityRiskService,
} from '@/server/scoring/complexity-risk-service';
import {
  createProviderRecommendationService,
  type ProviderRecommendationService,
} from '@/server/recommendations/provider-recommendation-service';
import { mapAnalysisToViewModel } from './analysis-view-model';

export type WorkspaceComposerErrorCode =
  | 'not_authenticated'
  | 'not_found'
  | 'brief_required'
  | 'persistence_error'
  | 'invalid_fixture';

export type WorkspaceComposerResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: WorkspaceComposerErrorCode };

export type WorkspaceComposerDependencies = {
  workspaceRepository: WorkspaceRepository;
  projectRepository: ProjectRepository;
  briefRepository: VideoBriefRepository;
  providerCatalogueRepository: ProviderCatalogueRepository;
  staticFixture: MockResultWorkspaceStaticFixture;
  sceneDecompositionService?: SceneDecompositionService;
  complexityRiskService?: ComplexityRiskService;
  providerRecommendationService?: ProviderRecommendationService;
};

function mapProjectError<T>(result: RepositoryResult<T>): WorkspaceComposerResult<T> {
  if (result.ok) {
    return result;
  }

  if (result.code === 'not_found') {
    return { ok: false, code: 'not_found' };
  }

  return { ok: false, code: 'persistence_error' };
}

function mapProjectSummary(project: ProjectRecord) {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.archivedAt ? ('archived' as const) : ('active' as const),
  };
}

function mapBriefSummary(draft: PartialVideoBriefDraft) {
  const sourcePreview = createSourcePreview(draft.sourceText);

  return {
    id: draft.id,
    projectId: draft.projectId,
    workingTitle: draft.workingTitle ?? 'Untitled brief',
    objective: draft.objective ?? '',
    targetAudience: draft.targetAudience ?? '',
    publishingDestination: draft.publishingDestination ?? '',
    aspectRatio: draft.aspectRatio ?? '',
    videoCategory: draft.videoCategory ?? '',
    durationSeconds: draft.durationSeconds ?? 0,
    visualStyle: draft.visualStyle ?? '',
    tone: draft.tone ?? '',
    budgetPriority: draft.budgetPriority ?? '',
    qualityPriority: draft.qualityPriority ?? '',
    enabledRequirementLabels: mapEnabledRequirementLabels(draft.productionRequirements ?? null),
    sourceType: draft.sourceType ?? 'unknown',
    sourcePreview: sourcePreview.preview,
    sourceCharacterCount: sourcePreview.characterCount,
    sourceUrl: draft.sourceUrl ?? null,
    completedAt: draft.completedAt ?? draft.updatedAt,
  };
}

function applyRequirementAwareContinuity(
  fixture: MockResultWorkspaceStaticFixture,
  draft: PartialVideoBriefDraft,
) {
  const requirements = draft.productionRequirements ?? null;

  return fixture.continuityItems.map((item) => {
    if (item.key === 'character_identity') {
      return {
        ...item,
        evaluationState: deriveContinuityEvaluationState('characterConsistency', requirements),
      };
    }

    if (item.key === 'product_appearance') {
      return {
        ...item,
        evaluationState: deriveContinuityEvaluationState('productConsistency', requirements),
      };
    }

    if (item.key === 'brand_elements') {
      return {
        ...item,
        evaluationState: deriveContinuityEvaluationState('logoAccuracy', requirements),
      };
    }

    if (item.key === 'on_screen_text') {
      return {
        ...item,
        evaluationState: deriveContinuityEvaluationState('exactTextVisibility', requirements),
      };
    }

    if (item.key === 'location_continuity') {
      return {
        ...item,
        evaluationState: deriveContinuityEvaluationState('multipleLocations', requirements),
      };
    }

    if (item.key === 'camera_language') {
      return {
        ...item,
        evaluationState: deriveContinuityEvaluationState('cameraControl', requirements),
      };
    }

    return item;
  });
}

function applyRequirementAwareAudio(
  fixture: MockResultWorkspaceStaticFixture,
  draft: PartialVideoBriefDraft,
) {
  const requirements = draft.productionRequirements ?? null;

  return fixture.audioEditingItems.map((item) => {
    if (item.key === 'voiceover_planning') {
      return {
        ...item,
        evaluationState: requirements?.voiceover ? ('relevant' as const) : ('not_requested' as const),
        sampleNote: requirements?.voiceover
          ? 'Requested in brief. No voiceover script is generated in this preview.'
          : 'Not requested in brief.',
      };
    }

    if (item.key === 'dialogue_planning') {
      return {
        ...item,
        evaluationState: requirements?.dialogue ? ('relevant' as const) : ('not_requested' as const),
        sampleNote: requirements?.dialogue
          ? 'Requested in brief. No dialogue is generated in this preview.'
          : 'Not requested in brief.',
      };
    }

    if (item.key === 'native_audio_planning') {
      return {
        ...item,
        evaluationState: requirements?.nativeAudio ? ('relevant' as const) : ('not_requested' as const),
        sampleNote: requirements?.nativeAudio
          ? 'Requested in brief. Provider audio matching is not performed.'
          : 'Not requested in brief.',
      };
    }

    return item;
  });
}

function mapIntelligenceFromBundle(
  bundle: WorkspaceIntelligenceSnapshot,
): WorkspaceViewModel['intelligence'] {
  return {
    referenceId: bundle.reference?.referenceId ?? bundle.analysis?.referenceId ?? null,
    analysisId: bundle.analysis?.analysisId ?? null,
    activeJobState: bundle.activeJob?.state ?? null,
  };
}

export class WorkspaceComposerService {
  private readonly sceneDecompositionService: SceneDecompositionService;
  private readonly complexityRiskService: ComplexityRiskService;
  private readonly providerRecommendationService: ProviderRecommendationService;

  constructor(private readonly dependencies: WorkspaceComposerDependencies) {
    this.sceneDecompositionService =
      dependencies.sceneDecompositionService ?? createSceneDecompositionService();
    this.complexityRiskService =
      dependencies.complexityRiskService ?? createComplexityRiskService();
    this.providerRecommendationService =
      dependencies.providerRecommendationService ??
      createProviderRecommendationService(dependencies.providerCatalogueRepository);
  }

  async loadWorkspace(
    userId: string,
    projectId: unknown,
    sectionInput?: unknown,
  ): Promise<WorkspaceComposerResult<WorkspaceViewModel>> {
    const parsedProjectId = projectIdSchema.safeParse(projectId);

    if (!parsedProjectId.success) {
      return { ok: false, code: 'not_found' };
    }

    const activeSection: WorkspaceSection = normalizeWorkspaceSection(sectionInput);

    const projectResult = await this.dependencies.projectRepository.getById(
      userId,
      parsedProjectId.data,
    );
    const mappedProject = mapProjectError(projectResult);

    if (!mappedProject.ok) {
      return mappedProject;
    }

    const briefResult = await this.dependencies.briefRepository.getByProjectId(
      userId,
      parsedProjectId.data,
    );

    if (!briefResult.ok) {
      if (briefResult.code === 'not_found') {
        return { ok: false, code: 'brief_required' };
      }

      return { ok: false, code: 'persistence_error' };
    }

    if (!briefResult.data.completedAt) {
      return { ok: false, code: 'brief_required' };
    }

    const fixture = this.dependencies.staticFixture;

    try {
      MockResultWorkspaceStaticFixtureSchema.parse(fixture);
    } catch {
      return { ok: false, code: 'invalid_fixture' };
    }

    const decompositionResult = this.sceneDecompositionService.decomposeCompletedBrief(
      briefResult.data,
    );

    if (!decompositionResult.ok) {
      if (decompositionResult.code === 'brief_required') {
        return { ok: false, code: 'brief_required' };
      }

      if (
        decompositionResult.code === 'invalid_duration' ||
        decompositionResult.code === 'decomposition_error'
      ) {
        return { ok: false, code: 'invalid_fixture' };
      }

      return { ok: false, code: 'invalid_fixture' };
    }

    const assessmentResult = this.complexityRiskService.assessCompletedBriefComplexityRisk(
      briefResult.data,
      decompositionResult.data,
    );

    if (!assessmentResult.ok) {
      if (
        assessmentResult.code === 'brief_required' ||
        assessmentResult.code === 'duration_mismatch' ||
        assessmentResult.code === 'invalid_input'
      ) {
        return { ok: false, code: 'invalid_fixture' };
      }

      return { ok: false, code: 'invalid_fixture' };
    }

    const recommendationResult = await this.providerRecommendationService.recommendForCompletedBrief(
      {
        brief: briefResult.data,
        sceneDecomposition: decompositionResult.data,
        complexityRiskAssessment: assessmentResult.data,
      },
    );

    if (!recommendationResult.ok) {
      if (recommendationResult.code === 'brief_required') {
        return { ok: false, code: 'brief_required' };
      }

      if (
        recommendationResult.code === 'catalogue_unavailable' ||
        recommendationResult.code === 'catalogue_invalid' ||
        recommendationResult.code === 'recommendation_error'
      ) {
        return { ok: false, code: 'persistence_error' };
      }

      return { ok: false, code: 'persistence_error' };
    }

    const scope: OwnerScope = {
      ownerId: userId,
      projectId: parsedProjectId.data,
    };

    const bundleResult = await this.dependencies.workspaceRepository.getIntelligenceBundle(scope);

    if (!bundleResult.ok) {
      if (bundleResult.code === 'not_found') {
        return { ok: false, code: 'not_found' };
      }

      return { ok: false, code: 'persistence_error' };
    }

    const bundle = bundleResult.data;
    const analysis = bundle.analysis ? mapAnalysisToViewModel(bundle.analysis) : null;

    const viewModel: WorkspaceViewModel = {
      mode: analysis ? 'analysis_available' : 'hybrid_preview',
      dataOrigin: 'mixed',
      isDecisionReady: false,
      fixtureVersion: WORKSPACE_FIXTURE_VERSION,
      sampleDisclaimer: fixture.sampleDisclaimer,
      previewTitle: WORKSPACE_PREVIEW_TITLE,
      sectionOrigins: WORKSPACE_SECTION_ORIGINS,
      activeSection,
      project: mapProjectSummary(mappedProject.data),
      brief: mapBriefSummary(briefResult.data),
      sceneDecomposition: decompositionResult.data,
      complexityRiskAssessment: assessmentResult.data,
      providerRecommendation: recommendationResult.data,
      samplePromptSections: fixture.samplePromptSections,
      continuityItems: applyRequirementAwareContinuity(fixture, briefResult.data),
      audioEditingItems: applyRequirementAwareAudio(fixture, briefResult.data),
      analysis,
      intelligence: mapIntelligenceFromBundle(bundle),
    };

    return { ok: true, data: viewModel };
  }
}

export function createWorkspaceComposerService(
  dependencies: WorkspaceComposerDependencies,
): WorkspaceComposerService {
  return new WorkspaceComposerService(dependencies);
}
