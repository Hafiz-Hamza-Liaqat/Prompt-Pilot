import { z } from 'zod';
import {
  IsoDateTimeSchema,
  NonEmptyTrimmedStringSchema,
  OptionalHttpHttpsUrlSchema,
  PositiveIntegerSchema,
} from '../common.js';
import { AspectRatioSchema } from '../constants.js';
import {
  AccessStatusSchema,
  ConfidenceClassificationSchema,
  ReferenceKindSchema,
  ReferencePlatformSchema,
  TranscriptSourceSchema,
  MediaKindSchema,
} from './constants.js';
import {
  ConfidenceMapSchema,
  EntityIdSchema,
  MonotonicVersionSchema,
  SemanticVersionSchema,
  TimelineMsSchema,
} from './primitives.js';
import { AnalysisVersionSchema } from './analysisVersion.js';

export const TranscriptSegmentSchema = z.object({
  startMs: TimelineMsSchema,
  endMs: TimelineMsSchema,
  text: NonEmptyTrimmedStringSchema,
});

export const TimelineSegmentSchema = z.object({
  startMs: TimelineMsSchema,
  endMs: TimelineMsSchema,
  label: NonEmptyTrimmedStringSchema,
});

export const AnalysisSceneSegmentSchema = z.object({
  index: z.number().int().nonnegative(),
  startMs: TimelineMsSchema,
  endMs: TimelineMsSchema,
  roleLabel: NonEmptyTrimmedStringSchema,
  summary: NonEmptyTrimmedStringSchema,
  confidence: ConfidenceClassificationSchema,
});

export const DetectedObjectSchema = z.object({
  label: NonEmptyTrimmedStringSchema,
  prominence: NonEmptyTrimmedStringSchema,
  segmentIndexes: z.array(z.number().int().nonnegative()),
  confidence: ConfidenceClassificationSchema,
});

export const CharacterPresenceSchema = z.object({
  description: NonEmptyTrimmedStringSchema,
  segmentIndexes: z.array(z.number().int().nonnegative()),
  confidence: ConfidenceClassificationSchema,
});

export const LocationObservationSchema = z.object({
  label: NonEmptyTrimmedStringSchema,
  segmentIndexes: z.array(z.number().int().nonnegative()),
  indoorOutdoor: z.enum(['indoor', 'outdoor', 'mixed', 'unknown']),
  confidence: ConfidenceClassificationSchema,
});

export const AnalysisMetadataSchema = z.object({
  referenceKind: ReferenceKindSchema,
  platform: ReferencePlatformSchema.optional(),
  canonicalUrl: OptionalHttpHttpsUrlSchema,
  platformContentId: NonEmptyTrimmedStringSchema.optional(),
  title: NonEmptyTrimmedStringSchema.optional(),
  authorLabel: NonEmptyTrimmedStringSchema.optional(),
  publishedAt: IsoDateTimeSchema.optional(),
  durationSeconds: PositiveIntegerSchema.optional(),
  aspectRatio: AspectRatioSchema.optional(),
  language: NonEmptyTrimmedStringSchema.optional(),
  accessStatus: AccessStatusSchema,
  rightsAttestationId: EntityIdSchema.optional(),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisMediaSchema = z.object({
  mediaKind: MediaKindSchema,
  resolution: z
    .object({
      width: PositiveIntegerSchema,
      height: PositiveIntegerSchema,
    })
    .optional(),
  frameRate: z.number().positive().optional(),
  hasVideoTrack: z.boolean(),
  hasAudioTrack: z.boolean(),
  storageLocator: NonEmptyTrimmedStringSchema.optional(),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisTranscriptSchema = z.object({
  transcriptText: NonEmptyTrimmedStringSchema.optional(),
  transcriptSegments: z.array(TranscriptSegmentSchema).optional(),
  transcriptSource: TranscriptSourceSchema.optional(),
  transcriptLanguage: NonEmptyTrimmedStringSchema.optional(),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisTimelineSchema = z.object({
  totalDurationMs: TimelineMsSchema,
  segments: z.array(TimelineSegmentSchema),
  averageShotLengthMs: TimelineMsSchema.optional(),
  pacingLabel: NonEmptyTrimmedStringSchema.optional(),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisScenesSchema = z.object({
  sceneSegments: z.array(AnalysisSceneSegmentSchema),
  sceneCount: z.number().int().nonnegative(),
  hookSegmentIndex: z.number().int().nonnegative().optional(),
  closingSegmentIndex: z.number().int().nonnegative().optional(),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisObjectsSchema = z.object({
  detectedObjects: z.array(DetectedObjectSchema),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisCharactersSchema = z.object({
  characterPresence: z.array(CharacterPresenceSchema),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisLocationsSchema = z.object({
  locations: z.array(LocationObservationSchema),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisCameraSchema = z.object({
  framingPatterns: z.array(NonEmptyTrimmedStringSchema),
  movementPatterns: z.array(NonEmptyTrimmedStringSchema),
  anglePatterns: z.array(NonEmptyTrimmedStringSchema),
  subjectPlacement: z.array(NonEmptyTrimmedStringSchema),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisLightingSchema = z.object({
  lightingMood: NonEmptyTrimmedStringSchema.optional(),
  lightingConsistency: NonEmptyTrimmedStringSchema.optional(),
  colorTemperatureLabel: NonEmptyTrimmedStringSchema.optional(),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisEditingSchema = z.object({
  cutRate: z.number().nonnegative().optional(),
  transitionStyles: z.array(NonEmptyTrimmedStringSchema),
  rhythmLabel: NonEmptyTrimmedStringSchema.optional(),
  onScreenTextPresence: z.object({
    present: z.boolean(),
    segmentIndexes: z.array(z.number().int().nonnegative()),
  }),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisStorySchema = z.object({
  narrativeStructure: NonEmptyTrimmedStringSchema.optional(),
  storySummary: NonEmptyTrimmedStringSchema.optional(),
  messageTheme: NonEmptyTrimmedStringSchema.optional(),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisHooksSchema = z.object({
  hookStartMs: TimelineMsSchema.optional(),
  hookDurationMs: TimelineMsSchema.optional(),
  hookPattern: NonEmptyTrimmedStringSchema.optional(),
  hookSummary: NonEmptyTrimmedStringSchema.optional(),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisAudienceSchema = z.object({
  inferredAudience: NonEmptyTrimmedStringSchema.optional(),
  audienceSignals: z.array(NonEmptyTrimmedStringSchema),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisEmotionsSchema = z.object({
  emotionalTone: NonEmptyTrimmedStringSchema.optional(),
  emotionalArc: NonEmptyTrimmedStringSchema.optional(),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisCtaSchema = z.object({
  ctaPresent: z.boolean(),
  ctaSegmentIndex: z.number().int().nonnegative().optional(),
  ctaPattern: NonEmptyTrimmedStringSchema.optional(),
  ctaSummary: NonEmptyTrimmedStringSchema.optional(),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisSeoSeedsSchema = z.object({
  topicPhrases: z.array(NonEmptyTrimmedStringSchema),
  entityMentions: z.array(NonEmptyTrimmedStringSchema),
  categoryHints: z.array(NonEmptyTrimmedStringSchema),
  confidence: ConfidenceMapSchema.optional(),
});

export const AnalysisSafetySchema = z.object({
  restrictedElements: z.array(NonEmptyTrimmedStringSchema),
  safetyWarnings: z.array(NonEmptyTrimmedStringSchema),
  transformationNotice: NonEmptyTrimmedStringSchema,
});

export const AnalysisFingerprintRefSchema = z.object({
  fingerprintId: EntityIdSchema,
  fingerprintAlgorithmVersion: MonotonicVersionSchema,
  fingerprintInputs: z.array(NonEmptyTrimmedStringSchema),
});

/**
 * Canonical analysis snapshot — observed facts and derived analysis only.
 * PP-02 ReferenceVideoAnalysis. No prompts, packages, or blueprints.
 */
export const ReferenceVideoAnalysisSchema = z.object({
  analysisId: EntityIdSchema,
  projectId: EntityIdSchema,
  referenceId: EntityIdSchema,
  fingerprintId: EntityIdSchema,
  pipelineVersion: SemanticVersionSchema,
  createdAt: IsoDateTimeSchema,
  version: AnalysisVersionSchema,
  metadata: AnalysisMetadataSchema,
  media: AnalysisMediaSchema,
  transcript: AnalysisTranscriptSchema,
  timeline: AnalysisTimelineSchema,
  scenes: AnalysisScenesSchema,
  objects: AnalysisObjectsSchema,
  characters: AnalysisCharactersSchema,
  locations: AnalysisLocationsSchema,
  camera: AnalysisCameraSchema,
  lighting: AnalysisLightingSchema,
  editing: AnalysisEditingSchema,
  story: AnalysisStorySchema,
  hooks: AnalysisHooksSchema,
  audience: AnalysisAudienceSchema,
  emotions: AnalysisEmotionsSchema,
  cta: AnalysisCtaSchema,
  seoSeeds: AnalysisSeoSeedsSchema,
  safety: AnalysisSafetySchema,
  fingerprint: AnalysisFingerprintRefSchema,
});

export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;
export type TimelineSegment = z.infer<typeof TimelineSegmentSchema>;
export type AnalysisSceneSegment = z.infer<typeof AnalysisSceneSegmentSchema>;
export type ReferenceVideoAnalysis = z.infer<typeof ReferenceVideoAnalysisSchema>;
