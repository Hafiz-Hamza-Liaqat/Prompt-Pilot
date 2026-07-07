import { describe, expect, it } from 'vitest';
import { ReferenceVideoAnalysisSchema } from '../../src/domain/canonical/referenceVideoAnalysis.js';
import type { EntityId } from '../../src/domain/canonical/primitives.js';
import type { LinkMetadata } from '../../src/domain/link/index.js';
import { resolveUrlReferenceFromLinkMetadata } from '../../src/domain/media/url-intake.js';
import { CORE_ANALYSIS_CONFIG } from '../../src/server/analysis/config.js';
import {
  createMockAnalysisProvider,
  createUploadAssetFixture,
} from '../../src/server/analysis/mock-analysis-provider.js';
import type { AnalyzeReferenceInput, ReferenceVideoAnalysisDraft } from '../../src/server/analysis/types.js';

const TIMESTAMP = '2026-07-07T12:00:00.000Z';
const OWNER = 'owner-001' as EntityId;
const PROJECT = 'project-001' as EntityId;
const JOB = 'job-001' as EntityId;
const REFERENCE = 'reference-001' as EntityId;
const FINGERPRINT = 'fingerprint-001' as EntityId;

function sampleLinkMetadata(overrides: Partial<LinkMetadata> = {}): LinkMetadata {
  return {
    linkMetadataId: 'link-meta-001' as EntityId,
    referenceId: REFERENCE,
    projectId: PROJECT,
    ownerId: OWNER,
    referenceKind: 'youtube_url',
    platform: 'youtube',
    platformContentId: 'dQw4w9WgXcQ',
    canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Sample video',
    authorLabel: 'Sample Channel',
    durationSeconds: 212,
    language: 'en',
    accessStatus: 'public',
    providerId: 'mock',
    extractionMethod: 'mock',
    extractedAt: TIMESTAMP,
    linkMetadataVersion: '1.0.0',
    ...overrides,
  };
}

function baseInput(
  referenceKind: AnalyzeReferenceInput['referenceKind'],
  intake: AnalyzeReferenceInput['intake'],
): AnalyzeReferenceInput {
  return {
    jobId: JOB,
    referenceId: REFERENCE,
    projectId: PROJECT,
    ownerId: OWNER,
    referenceKind,
    fingerprintId: FINGERPRINT,
    fingerprintAlgorithmVersion: 1,
    occurredAt: TIMESTAMP,
    intake,
  };
}

function parseDraft(draft: ReferenceVideoAnalysisDraft) {
  return ReferenceVideoAnalysisSchema.parse({
    ...draft,
    analysisId: 'analysis-test-001',
  });
}

describe('MockAnalysisProvider', () => {
  const provider = createMockAnalysisProvider();

  it('exposes mock provider id', () => {
    expect(provider.providerId).toBe('mock');
  });

  it('produces valid schema output for youtube_url intake', async () => {
    const linkMetadata = sampleLinkMetadata();
    const descriptorResult = resolveUrlReferenceFromLinkMetadata(linkMetadata, {
      ownerId: OWNER,
      projectId: PROJECT,
    }, JOB);
    expect(descriptorResult.ok).toBe(true);

    const result = await provider.analyze(
      baseInput('youtube_url', {
        linkMetadata,
        urlDescriptor: descriptorResult.ok ? descriptorResult.data : undefined,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const parsed = parseDraft(result.data);
    expect(parsed.metadata.referenceKind).toBe('youtube_url');
    expect(parsed.metadata.title).toBe('Sample video');
    expect(parsed.metadata.platformContentId).toBe('dQw4w9WgXcQ');
    expect(parsed.pipelineVersion).toBe(CORE_ANALYSIS_CONFIG.pipelineVersion);
    expect(parsed.fingerprint.fingerprintInputs).toContain('reference_kind:youtube_url');
    expect(parsed.fingerprint.fingerprintInputs).toContain('platform_content_id:dQw4w9WgXcQ');
  });

  it('produces valid schema output for video_upload intake', async () => {
    const result = await provider.analyze(
      baseInput('video_upload', {
        uploadAsset: createUploadAssetFixture('asset-video-001' as EntityId, {
          mimeType: 'video/mp4',
          durationSeconds: 180,
        }),
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const parsed = parseDraft(result.data);
    expect(parsed.metadata.referenceKind).toBe('video_upload');
    expect(parsed.media.mediaKind).toBe('video');
    expect(parsed.media.hasVideoTrack).toBe(true);
    expect(parsed.media.storageLocator).toBeTruthy();
    expect(parsed.fingerprint.fingerprintInputs).toContain('upload_asset:asset-video-001');
  });

  it('produces valid schema output for audio_upload intake', async () => {
    const result = await provider.analyze(
      baseInput('audio_upload', {
        uploadAsset: createUploadAssetFixture('asset-audio-001' as EntityId, {
          mimeType: 'audio/mpeg',
          durationSeconds: 90,
        }),
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const parsed = parseDraft(result.data);
    expect(parsed.metadata.referenceKind).toBe('audio_upload');
    expect(parsed.media.mediaKind).toBe('audio');
    expect(parsed.media.hasVideoTrack).toBe(false);
    expect(parsed.media.hasAudioTrack).toBe(true);
  });

  it('produces valid schema output for transcript intake', async () => {
    const transcriptText = 'Opening paragraph.\n\nSecond paragraph with more detail.';

    const result = await provider.analyze(
      baseInput('transcript', { transcriptText }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const parsed = parseDraft(result.data);
    expect(parsed.metadata.referenceKind).toBe('transcript');
    expect(parsed.media.mediaKind).toBe('text');
    expect(parsed.transcript.transcriptText).toBe(transcriptText);
    expect(parsed.transcript.transcriptSource).toBe('user_supplied');
    expect(parsed.fingerprint.fingerprintInputs).toContain(`transcript_length:${transcriptText.length}`);
  });

  it('produces valid schema output for script intake', async () => {
    const scriptText = 'Scene one: product intro.\n\nScene two: feature callout.';

    const result = await provider.analyze(
      baseInput('script', { scriptText }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const parsed = parseDraft(result.data);
    expect(parsed.metadata.referenceKind).toBe('script');
    expect(parsed.transcript.transcriptText).toBe(scriptText);
    expect(parsed.fingerprint.fingerprintInputs).toContain(`script_length:${scriptText.length}`);
  });

  it('returns deterministic output for identical input', async () => {
    const input = baseInput('transcript', {
      transcriptText: 'Deterministic transcript body for mock analysis.',
    });

    const first = await provider.analyze(input);
    const second = await provider.analyze(input);

    expect(first).toEqual(second);
  });

  it('labels mock scene segments as derived confidence', async () => {
    const result = await provider.analyze(
      baseInput('youtube_url', { linkMetadata: sampleLinkMetadata() }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.scenes.sceneSegments.every((segment) => segment.confidence === 'derived')).toBe(true);
  });

  it('requires link metadata or URL descriptor for youtube_url', async () => {
    const result = await provider.analyze(baseInput('youtube_url', {}));

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.code).toBe('analysis_failed');
  });

  it('requires transcript text for transcript references', async () => {
    const result = await provider.analyze(baseInput('transcript', { transcriptText: '   ' }));

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.code).toBe('transcription_failed');
  });

  it('always includes safety transformation notice', async () => {
    const result = await provider.analyze(
      baseInput('script', { scriptText: 'Script body with explicit CTA.' }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.safety.transformationNotice).toContain('transformative');
  });
});
