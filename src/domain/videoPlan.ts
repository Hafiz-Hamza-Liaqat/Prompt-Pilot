import { z } from 'zod';
import {
  IsoDateTimeSchema,
  NonEmptyTrimmedStringSchema,
  PercentageScoreSchema,
  VersionStringSchema,
  WarningRecordSchema,
} from './common.js';
import { collectContinuityLockIds } from './continuityBible.js';
import { ComplexityLevelSchema, RiskLevelSchema } from './constants.js';
import { ContinuityBibleSchema } from './continuityBible.js';
import { EditingRoadmapSchema } from './editingRoadmap.js';
import { ProviderRecommendationSetSchema } from './providerRecommendation.js';
import { QualityAuditSchema } from './qualityAudit.js';
import { SceneTimelineSchema } from './scenePlan.js';
import { VideoBriefSchema } from './videoBrief.js';

export const ComplexityAssessmentSchema = z.object({
  score: PercentageScoreSchema,
  level: ComplexityLevelSchema,
  contributingFactors: z.array(NonEmptyTrimmedStringSchema),
  explanation: NonEmptyTrimmedStringSchema,
  recommendedProductionMethod: NonEmptyTrimmedStringSchema,
});

export const ProductionRiskAssessmentSchema = z.object({
  overallScore: PercentageScoreSchema,
  overallLevel: RiskLevelSchema,
  characterConsistencyRisk: RiskLevelSchema,
  productAccuracyRisk: RiskLevelSchema,
  exactTextRisk: RiskLevelSchema,
  humanMotionRisk: RiskLevelSchema,
  lipSyncRisk: RiskLevelSchema,
  factualAccuracyRisk: RiskLevelSchema,
  copyrightRisk: RiskLevelSchema,
  commercialUseRisk: RiskLevelSchema,
  warnings: z.array(WarningRecordSchema),
  recommendedMitigations: z.array(NonEmptyTrimmedStringSchema),
});

export const StoryStructureSchema = z.object({
  hook: NonEmptyTrimmedStringSchema,
  setup: NonEmptyTrimmedStringSchema,
  mainDevelopment: NonEmptyTrimmedStringSchema,
  callToAction: NonEmptyTrimmedStringSchema,
  closing: NonEmptyTrimmedStringSchema,
  narrativeNotes: z.array(NonEmptyTrimmedStringSchema),
});

export const VoiceoverScriptSchema = z.object({
  fullScript: NonEmptyTrimmedStringSchema,
  tone: NonEmptyTrimmedStringSchema,
  pacing: NonEmptyTrimmedStringSchema,
  deliveryNotes: z.array(NonEmptyTrimmedStringSchema),
});

export const AudioGuidanceSchema = z.object({
  musicDirection: NonEmptyTrimmedStringSchema,
  soundEffects: z.array(NonEmptyTrimmedStringSchema),
  mixNotes: z.array(NonEmptyTrimmedStringSchema),
  duckingNotes: z.array(NonEmptyTrimmedStringSchema),
});

export const ExportMetadataSchema = z.object({
  exportTitle: NonEmptyTrimmedStringSchema,
  fileSafeTitle: NonEmptyTrimmedStringSchema,
  includedSections: z.array(NonEmptyTrimmedStringSchema).min(1),
  generatedAt: IsoDateTimeSchema,
});

function getRecommendedProviderIds(
  recommendations: z.infer<typeof ProviderRecommendationSetSchema>,
): Set<string> {
  return new Set(recommendations.map((item) => item.providerId));
}

export const VideoPlanSchema = z
  .object({
    planId: NonEmptyTrimmedStringSchema,
    projectId: NonEmptyTrimmedStringSchema,
    planVersion: VersionStringSchema,
    contractVersion: VersionStringSchema,
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
    projectSummary: NonEmptyTrimmedStringSchema,
    videoBrief: VideoBriefSchema,
    complexityAssessment: ComplexityAssessmentSchema,
    productionRiskAssessment: ProductionRiskAssessmentSchema,
    providerRecommendations: ProviderRecommendationSetSchema,
    storyStructure: StoryStructureSchema,
    sceneTimeline: SceneTimelineSchema,
    continuityBible: ContinuityBibleSchema,
    voiceoverScript: VoiceoverScriptSchema,
    audioGuidance: AudioGuidanceSchema,
    editingRoadmap: EditingRoadmapSchema,
    qualityAudit: QualityAuditSchema,
    exportMetadata: ExportMetadataSchema,
  })
  .superRefine((plan, ctx) => {
    const createdAtMs = Date.parse(plan.createdAt);
    const updatedAtMs = Date.parse(plan.updatedAt);
    if (updatedAtMs < createdAtMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'updatedAt must not be earlier than createdAt',
        path: ['updatedAt'],
      });
    }

    if (plan.projectId !== plan.videoBrief.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Root projectId must match videoBrief.projectId',
        path: ['projectId'],
      });
    }

    const scenes = plan.sceneTimeline;
    const briefDuration = plan.videoBrief.durationSeconds;

    if (scenes.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Scene timeline must contain at least one scene',
        path: ['sceneTimeline'],
      });
      return;
    }

    const sceneNumbers = scenes.map((scene) => scene.sceneNumber);
    const uniqueSceneNumbers = new Set(sceneNumbers);
    if (uniqueSceneNumbers.size !== sceneNumbers.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Scene numbers must be unique',
        path: ['sceneTimeline'],
      });
    }

    const expectedSceneNumbers = scenes.map((_, index) => index + 1);
    const sortedSceneNumbers = [...sceneNumbers].sort((a, b) => a - b);
    const isSequential =
      sortedSceneNumbers.length === expectedSceneNumbers.length &&
      sortedSceneNumbers.every((value, index) => value === expectedSceneNumbers[index]);
    if (!isSequential) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Scene numbers must be sequential beginning at 1',
        path: ['sceneTimeline'],
      });
    }

    const generationOrders = scenes.map((scene) => scene.generationOrder);
    const uniqueGenerationOrders = new Set(generationOrders);
    if (uniqueGenerationOrders.size !== generationOrders.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Generation order values must be unique',
        path: ['sceneTimeline'],
      });
    }

    const sceneIds = scenes.map((scene) => scene.sceneId);
    const uniqueSceneIds = new Set(sceneIds);
    if (uniqueSceneIds.size !== sceneIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Scene identifiers must be unique',
        path: ['sceneTimeline'],
      });
    }

    const sortedByStart = [...scenes].sort((a, b) => a.startSecond - b.startSecond);
    for (let index = 0; index < sortedByStart.length; index += 1) {
      if (sortedByStart[index]?.startSecond !== scenes[index]?.startSecond) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Scenes must be ordered by start time',
          path: ['sceneTimeline'],
        });
        break;
      }
    }

    if (sortedByStart[0]?.startSecond !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The first scene must begin at second 0',
        path: ['sceneTimeline', 0, 'startSecond'],
      });
    }

    for (let index = 0; index < sortedByStart.length - 1; index += 1) {
      const current = sortedByStart[index];
      const next = sortedByStart[index + 1];
      if (current && next && current.endSecond > next.startSecond) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Scenes must not overlap',
          path: ['sceneTimeline', index + 1, 'startSecond'],
        });
      }
    }

    const finalScene = sortedByStart[sortedByStart.length - 1];
    if (finalScene && finalScene.endSecond !== briefDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The final scene must end at the brief duration',
        path: ['sceneTimeline', sortedByStart.length - 1, 'endSecond'],
      });
    }

    const totalDuration = scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
    if (totalDuration !== briefDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The sum of scene durations must equal the brief duration',
        path: ['sceneTimeline'],
      });
    }

    const recommendedProviders = getRecommendedProviderIds(plan.providerRecommendations);
    for (const [index, scene] of scenes.entries()) {
      if (!recommendedProviders.has(scene.recommendedProvider)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Scene recommended provider must exist in the recommendation set',
          path: ['sceneTimeline', index, 'recommendedProvider'],
        });
      }

      for (const [promptIndex, prompt] of scene.compiledPrompts.entries()) {
        if (!recommendedProviders.has(prompt.provider)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Compiled prompt provider must exist in the recommendation set',
            path: ['sceneTimeline', index, 'compiledPrompts', promptIndex, 'provider'],
          });
        }
      }
    }

    const continuityLockIds = collectContinuityLockIds(plan.continuityBible);
    for (const [index, scene] of scenes.entries()) {
      for (const [lockIndex, lockId] of scene.continuityLockIds.entries()) {
        if (!continuityLockIds.has(lockId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Referenced continuity lock identifier must exist in the Continuity Bible',
            path: ['sceneTimeline', index, 'continuityLockIds', lockIndex],
          });
        }
      }
    }
  });

export type ComplexityAssessment = z.infer<typeof ComplexityAssessmentSchema>;
export type ProductionRiskAssessment = z.infer<typeof ProductionRiskAssessmentSchema>;
export type StoryStructure = z.infer<typeof StoryStructureSchema>;
export type VoiceoverScript = z.infer<typeof VoiceoverScriptSchema>;
export type AudioGuidance = z.infer<typeof AudioGuidanceSchema>;
export type ExportMetadata = z.infer<typeof ExportMetadataSchema>;
export type VideoPlan = z.infer<typeof VideoPlanSchema>;
