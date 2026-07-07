import type { ReferenceVideoAnalysis } from '@/domain/canonical/referenceVideoAnalysis';

/** Static derived sections reused by MockAnalysisProvider — mirrors contract fixture defaults. */
export const MOCK_ANALYSIS_DERIVED_SECTIONS: Pick<
  ReferenceVideoAnalysis,
  'camera' | 'lighting' | 'editing' | 'story' | 'audience' | 'emotions' | 'cta' | 'safety'
> = {
  camera: {
    framingPatterns: ['medium close-up dominant'],
    movementPatterns: ['static', 'slow push-in'],
    anglePatterns: ['eye-level'],
    subjectPlacement: ['center-weighted'],
  },
  lighting: {
    lightingMood: 'high-key',
    lightingConsistency: 'consistent',
    colorTemperatureLabel: 'neutral',
  },
  editing: {
    cutRate: 14,
    transitionStyles: ['hard cut'],
    rhythmLabel: 'flowing',
    onScreenTextPresence: {
      present: true,
      segmentIndexes: [0],
    },
  },
  story: {
    narrativeStructure: 'problem → solution → proof → CTA',
    storySummary: 'Demonstrates product value through lifestyle context without reproducing script.',
    messageTheme: 'Everyday hydration upgrade',
  },
  audience: {
    inferredAudience: 'Health-conscious adults',
    audienceSignals: ['fitness lifestyle cues', 'wellness product category'],
  },
  emotions: {
    emotionalTone: 'energetic',
    emotionalArc: 'stable upbeat',
  },
  cta: {
    ctaPresent: true,
    ctaSegmentIndex: 1,
    ctaPattern: 'direct ask',
    ctaSummary: 'Encourages link click without quoting verbatim script',
  },
  safety: {
    restrictedElements: [],
    safetyWarnings: [],
    transformationNotice:
      'Outputs derived from this analysis must be transformative and must not reproduce copyrighted expression.',
  },
};
