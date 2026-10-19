import type { ReferenceVideoAnalysis } from '@/domain/canonical/referenceVideoAnalysis';
import type {
  AnalysisMediaViewModel,
  AnalysisSummaryViewModel,
  AnalysisViewModel,
} from '@/domain/workspace/analysis-display';

function mapSummary(analysis: ReferenceVideoAnalysis): AnalysisSummaryViewModel {
  return {
    referenceKind: analysis.metadata.referenceKind,
    pipelineVersion: analysis.pipelineVersion,
    createdAt: analysis.createdAt,
    version: { ...analysis.version },
  };
}

function mapMetadata(
  metadata: ReferenceVideoAnalysis['metadata'],
): ReferenceVideoAnalysis['metadata'] {
  return {
    ...metadata,
    ...(metadata.confidence ? { confidence: { ...metadata.confidence } } : {}),
  };
}

function mapMedia(media: ReferenceVideoAnalysis['media']): AnalysisMediaViewModel {
  const { storageLocator: _storageLocator, confidence, ...rest } = media;
  return {
    ...rest,
    ...(confidence ? { confidence: { ...confidence } } : {}),
  };
}

function mapTranscript(
  transcript: ReferenceVideoAnalysis['transcript'],
): ReferenceVideoAnalysis['transcript'] {
  return {
    ...transcript,
    ...(transcript.transcriptSegments
      ? { transcriptSegments: transcript.transcriptSegments.map((segment) => ({ ...segment })) }
      : {}),
    ...(transcript.confidence ? { confidence: { ...transcript.confidence } } : {}),
  };
}

function mapTimeline(
  timeline: ReferenceVideoAnalysis['timeline'],
): ReferenceVideoAnalysis['timeline'] {
  return {
    ...timeline,
    segments: timeline.segments.map((segment) => ({ ...segment })),
    ...(timeline.confidence ? { confidence: { ...timeline.confidence } } : {}),
  };
}

function mapScenes(scenes: ReferenceVideoAnalysis['scenes']): ReferenceVideoAnalysis['scenes'] {
  return {
    ...scenes,
    sceneSegments: scenes.sceneSegments.map((segment) => ({ ...segment })),
    ...(scenes.confidence ? { confidence: { ...scenes.confidence } } : {}),
  };
}

function mapSectionWithOptionalConfidence<
  T extends { confidence?: ReferenceVideoAnalysis['story']['confidence'] },
>(section: T): T {
  return {
    ...section,
    ...(section.confidence ? { confidence: { ...section.confidence } } : {}),
  };
}

/**
 * Maps persisted {@link ReferenceVideoAnalysis} to a presentation-neutral workspace view-model.
 * Pure, synchronous, side-effect free — no I/O, repositories, or providers.
 */
export function mapAnalysisToViewModel(analysis: ReferenceVideoAnalysis): AnalysisViewModel {
  return {
    summary: mapSummary(analysis),
    metadata: mapMetadata(analysis.metadata),
    media: mapMedia(analysis.media),
    transcript: mapTranscript(analysis.transcript),
    timeline: mapTimeline(analysis.timeline),
    scenes: mapScenes(analysis.scenes),
    story: mapSectionWithOptionalConfidence(analysis.story),
    hooks: mapSectionWithOptionalConfidence(analysis.hooks),
    audience: {
      ...analysis.audience,
      audienceSignals: [...analysis.audience.audienceSignals],
      ...(analysis.audience.confidence
        ? { confidence: { ...analysis.audience.confidence } }
        : {}),
    },
    cta: mapSectionWithOptionalConfidence(analysis.cta),
    camera: {
      ...analysis.camera,
      framingPatterns: [...analysis.camera.framingPatterns],
      movementPatterns: [...analysis.camera.movementPatterns],
      anglePatterns: [...analysis.camera.anglePatterns],
      subjectPlacement: [...analysis.camera.subjectPlacement],
      ...(analysis.camera.confidence ? { confidence: { ...analysis.camera.confidence } } : {}),
    },
    editing: {
      ...analysis.editing,
      transitionStyles: [...analysis.editing.transitionStyles],
      onScreenTextPresence: {
        ...analysis.editing.onScreenTextPresence,
        segmentIndexes: [...analysis.editing.onScreenTextPresence.segmentIndexes],
      },
      ...(analysis.editing.confidence ? { confidence: { ...analysis.editing.confidence } } : {}),
    },
    safety: {
      restrictedElements: [...analysis.safety.restrictedElements],
      safetyWarnings: [...analysis.safety.safetyWarnings],
      transformationNotice: analysis.safety.transformationNotice,
    },
  };
}
