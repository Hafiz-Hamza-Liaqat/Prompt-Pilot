import type { ReferenceVideoAnalysis } from '../../src/domain/canonical/referenceVideoAnalysis.js';

const TIMESTAMP = '2026-07-05T12:00:00.000Z';

export const validReferenceVideoAnalysisFixture: ReferenceVideoAnalysis = {
  analysisId: 'analysis-ref-youtube-001',
  projectId: 'project-hydrobottle-001',
  referenceId: 'reference-youtube-001',
  fingerprintId: 'fingerprint-youtube-001',
  pipelineVersion: '1.0.0',
  createdAt: TIMESTAMP,
  version: {
    analysisVersion: 1,
    isLatest: true,
    changeReason: 'initial',
  },
  metadata: {
    referenceKind: 'youtube_url',
    platform: 'youtube',
    canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    platformContentId: 'dQw4w9WgXcQ',
    title: 'Sample reference video',
    authorLabel: 'Sample Channel',
    durationSeconds: 212,
    aspectRatio: '16:9',
    language: 'en',
    accessStatus: 'public',
    rightsAttestationId: 'attestation-001',
  },
  media: {
    mediaKind: 'video',
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    hasVideoTrack: true,
    hasAudioTrack: true,
  },
  transcript: {
    transcriptText: 'Sample transcript text for contract validation.',
    transcriptSegments: [
      { startMs: 0, endMs: 5000, text: 'Opening segment' },
      { startMs: 5000, endMs: 12000, text: 'Middle segment' },
    ],
    transcriptSource: 'platform_caption',
    transcriptLanguage: 'en',
  },
  timeline: {
    totalDurationMs: 212000,
    segments: [
      { startMs: 0, endMs: 15000, label: 'hook' },
      { startMs: 15000, endMs: 180000, label: 'body' },
      { startMs: 180000, endMs: 212000, label: 'closing' },
    ],
    averageShotLengthMs: 4200,
    pacingLabel: 'moderate',
  },
  scenes: {
    sceneSegments: [
      {
        index: 0,
        startMs: 0,
        endMs: 15000,
        roleLabel: 'hook',
        summary: 'Visual hook with product reveal',
        confidence: 'derived',
      },
      {
        index: 1,
        startMs: 15000,
        endMs: 180000,
        roleLabel: 'demonstration',
        summary: 'Feature walkthrough montage',
        confidence: 'derived',
      },
    ],
    sceneCount: 2,
    hookSegmentIndex: 0,
    closingSegmentIndex: 1,
  },
  objects: {
    detectedObjects: [
      {
        label: 'reusable water bottle',
        prominence: 'primary',
        segmentIndexes: [0, 1],
        confidence: 'derived',
      },
    ],
  },
  characters: {
    characterPresence: [
      {
        description: 'Presenter on camera',
        segmentIndexes: [0, 1],
        confidence: 'derived',
      },
    ],
  },
  locations: {
    locations: [
      {
        label: 'indoor studio',
        segmentIndexes: [0],
        indoorOutdoor: 'indoor',
        confidence: 'derived',
      },
    ],
  },
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
  hooks: {
    hookStartMs: 0,
    hookDurationMs: 15000,
    hookPattern: 'visual reveal',
    hookSummary: 'Immediate product visibility in first three seconds',
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
  seoSeeds: {
    topicPhrases: ['reusable water bottle', 'hydration routine'],
    entityMentions: ['HydroBottle'],
    categoryHints: ['product advertisement'],
  },
  safety: {
    restrictedElements: [],
    safetyWarnings: [],
    transformationNotice:
      'Outputs derived from this analysis must be transformative and must not reproduce copyrighted expression.',
  },
  fingerprint: {
    fingerprintId: 'fingerprint-youtube-001',
    fingerprintAlgorithmVersion: 1,
    fingerprintInputs: ['reference_kind:youtube_url', 'platform_content_id:dQw4w9WgXcQ'],
  },
};
