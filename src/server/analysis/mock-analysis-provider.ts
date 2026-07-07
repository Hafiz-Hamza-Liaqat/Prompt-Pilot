import type { ReferenceKind } from '@/domain/canonical/constants';
import type { ReferenceVideoAnalysis } from '@/domain/canonical/referenceVideoAnalysis';
import type { EntityId } from '@/domain/canonical/primitives';
import { asStorageLocator } from '@/domain/media';
import type { ReferenceAnalysisProvider, ReferenceAnalysisProviderResult } from './analysis-provider.js';
import { CORE_ANALYSIS_CONFIG } from './config.js';
import { MOCK_ANALYSIS_DERIVED_SECTIONS } from './mock-analysis-template.js';
import type { AnalyzeReferenceInput, ReferenceIntakeView, ReferenceVideoAnalysisDraft } from './types.js';

const DEFAULT_DURATION_MS = 60_000;
const MS_PER_WORD = 200;

type AnalysisMetadata = ReferenceVideoAnalysis['metadata'];
type AnalysisMedia = ReferenceVideoAnalysis['media'];
type AnalysisTranscript = ReferenceVideoAnalysis['transcript'];

function providerOk(data: ReferenceVideoAnalysisDraft): ReferenceAnalysisProviderResult {
  return { ok: true, data };
}

function providerErr(code: string, message: string): ReferenceAnalysisProviderResult {
  return { ok: false, code, message };
}

function buildFingerprintInputs(referenceKind: ReferenceKind, intake: ReferenceIntakeView): string[] {
  const inputs = [`reference_kind:${referenceKind}`];

  if (intake.linkMetadata?.platformContentId) {
    inputs.push(`platform_content_id:${intake.linkMetadata.platformContentId}`);
  } else if (intake.urlDescriptor?.platformContentId) {
    inputs.push(`platform_content_id:${intake.urlDescriptor.platformContentId}`);
  }

  if (intake.uploadAsset?.assetId) {
    inputs.push(`upload_asset:${intake.uploadAsset.assetId}`);
  }

  if (intake.transcriptText) {
    inputs.push(`transcript_length:${intake.transcriptText.trim().length}`);
  }

  if (intake.scriptText) {
    inputs.push(`script_length:${intake.scriptText.trim().length}`);
  }

  return inputs;
}

function estimateTextDurationMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(words * MS_PER_WORD, 5_000);
}

function resolveDurationMs(input: AnalyzeReferenceInput): number {
  const { intake } = input;

  if (intake.linkMetadata?.durationSeconds) {
    return intake.linkMetadata.durationSeconds * 1_000;
  }
  if (intake.urlDescriptor?.durationSeconds) {
    return intake.urlDescriptor.durationSeconds * 1_000;
  }
  if (intake.uploadAsset?.durationSeconds) {
    return intake.uploadAsset.durationSeconds * 1_000;
  }
  if (intake.transcriptText) {
    return estimateTextDurationMs(intake.transcriptText);
  }
  if (intake.scriptText) {
    return estimateTextDurationMs(intake.scriptText);
  }

  return DEFAULT_DURATION_MS;
}

function buildTimeline(totalDurationMs: number): ReferenceVideoAnalysis['timeline'] {
  const hookEnd = Math.min(15_000, Math.floor(totalDurationMs * 0.15));
  const closingStart = Math.max(hookEnd, Math.floor(totalDurationMs * 0.85));

  return {
    totalDurationMs,
    segments: [
      { startMs: 0, endMs: hookEnd, label: 'hook' },
      { startMs: hookEnd, endMs: closingStart, label: 'body' },
      { startMs: closingStart, endMs: totalDurationMs, label: 'closing' },
    ],
    averageShotLengthMs: Math.max(Math.floor(totalDurationMs / 14), 1_000),
    pacingLabel: 'moderate',
  };
}

function buildScenes(totalDurationMs: number): ReferenceVideoAnalysis['scenes'] {
  const hookEnd = Math.min(15_000, Math.floor(totalDurationMs * 0.15));
  const closingStart = Math.max(hookEnd, Math.floor(totalDurationMs * 0.85));

  return {
    sceneSegments: [
      {
        index: 0,
        startMs: 0,
        endMs: hookEnd,
        roleLabel: 'hook',
        summary: 'Opening segment derived from intake duration',
        confidence: 'derived',
      },
      {
        index: 1,
        startMs: hookEnd,
        endMs: closingStart,
        roleLabel: 'body',
        summary: 'Primary content segment derived from intake structure',
        confidence: 'derived',
      },
      {
        index: 2,
        startMs: closingStart,
        endMs: totalDurationMs,
        roleLabel: 'closing',
        summary: 'Closing segment derived from intake duration',
        confidence: 'derived',
      },
    ],
    sceneCount: 3,
    hookSegmentIndex: 0,
    closingSegmentIndex: 2,
  };
}

function buildTextSegments(text: string, totalDurationMs: number): ReferenceVideoAnalysis['transcript']['transcriptSegments'] {
  const paragraphs = text
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [{ startMs: 0, endMs: totalDurationMs, text: text.trim() }];
  }

  const segmentDuration = Math.max(Math.floor(totalDurationMs / paragraphs.length), 1_000);
  return paragraphs.map((paragraph, index) => ({
    startMs: index * segmentDuration,
    endMs: Math.min((index + 1) * segmentDuration, totalDurationMs),
    text: paragraph,
  }));
}

function buildSeoSeeds(title?: string, bodyText?: string): ReferenceVideoAnalysis['seoSeeds'] {
  const source = [title, bodyText].filter(Boolean).join(' ');
  const tokens = source
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3)
    .slice(0, 5);

  return {
    topicPhrases: tokens.length > 0 ? tokens : ['reference content'],
    entityMentions: title ? [title] : [],
    categoryHints: ['reference analysis'],
  };
}

function buildYoutubeMetadata(input: AnalyzeReferenceInput): AnalysisMetadata {
  const { intake } = input;
  const link = intake.linkMetadata;
  const descriptor = intake.urlDescriptor;

  return {
    referenceKind: 'youtube_url',
    platform: link?.platform ?? descriptor?.platform ?? 'youtube',
    canonicalUrl: link?.canonicalUrl ?? descriptor?.canonicalUrl,
    platformContentId: link?.platformContentId ?? descriptor?.platformContentId,
    title: link?.title ?? descriptor?.title ?? 'Mock reference video',
    authorLabel: link?.authorLabel ?? descriptor?.authorLabel,
    durationSeconds: link?.durationSeconds ?? descriptor?.durationSeconds,
    language: link?.language ?? 'en',
    accessStatus: link?.accessStatus ?? descriptor?.accessStatus ?? 'public',
    rightsAttestationId: intake.rightsAttestationId,
  };
}

function buildUploadMetadata(input: AnalyzeReferenceInput): AnalysisMetadata {
  const { intake, referenceKind } = input;
  const asset = intake.uploadAsset;

  return {
    referenceKind,
    title: referenceKind === 'audio_upload' ? 'Uploaded audio reference' : 'Uploaded video reference',
    durationSeconds: asset?.durationSeconds,
    language: 'en',
    accessStatus: 'restricted',
    rightsAttestationId: intake.rightsAttestationId,
  };
}

function buildTextMetadata(input: AnalyzeReferenceInput): AnalysisMetadata {
  const { intake, referenceKind } = input;

  return {
    referenceKind,
    title: referenceKind === 'script' ? 'Script reference' : 'Transcript reference',
    language: 'en',
    accessStatus: 'restricted',
    rightsAttestationId: intake.rightsAttestationId,
  };
}

function buildYoutubeMedia(input: AnalyzeReferenceInput): AnalysisMedia {
  const link = input.intake.linkMetadata;
  const descriptor = input.intake.urlDescriptor;
  const mediaKind = link?.mediaKind ?? descriptor?.mediaKind ?? 'video';

  return {
    mediaKind,
    resolution: mediaKind === 'video' ? { width: 1920, height: 1080 } : undefined,
    frameRate: mediaKind === 'video' ? 30 : undefined,
    hasVideoTrack: mediaKind === 'video',
    hasAudioTrack: true,
  };
}

function buildUploadMedia(input: AnalyzeReferenceInput): AnalysisMedia {
  const asset = input.intake.uploadAsset;
  const isAudio = input.referenceKind === 'audio_upload';

  return {
    mediaKind: isAudio ? 'audio' : 'video',
    resolution: isAudio ? undefined : { width: 1920, height: 1080 },
    frameRate: isAudio ? undefined : 30,
    hasVideoTrack: !isAudio,
    hasAudioTrack: true,
    storageLocator: asset?.storageLocator,
  };
}

function buildTextMedia(): AnalysisMedia {
  return {
    mediaKind: 'text',
    hasVideoTrack: false,
    hasAudioTrack: false,
  };
}

function buildYoutubeTranscript(input: AnalyzeReferenceInput): AnalysisTranscript {
  const title = input.intake.linkMetadata?.title ?? input.intake.urlDescriptor?.title ?? 'Mock reference video';

  return {
    transcriptText: `Mock platform caption for ${title}.`,
    transcriptSegments: [
      { startMs: 0, endMs: 5_000, text: 'Opening caption segment' },
      { startMs: 5_000, endMs: 12_000, text: 'Body caption segment' },
    ],
    transcriptSource: 'platform_caption',
    transcriptLanguage: input.intake.linkMetadata?.language ?? 'en',
  };
}

function buildUserTextTranscript(
  text: string,
  totalDurationMs: number,
  source: 'user_supplied',
): AnalysisTranscript {
  return {
    transcriptText: text.trim(),
    transcriptSegments: buildTextSegments(text, totalDurationMs),
    transcriptSource: source,
    transcriptLanguage: 'en',
  };
}

function validateIntake(input: AnalyzeReferenceInput): ReferenceAnalysisProviderResult | null {
  const { referenceKind, intake } = input;

  switch (referenceKind) {
    case 'youtube_url':
      if (!intake.linkMetadata && !intake.urlDescriptor) {
        return providerErr('analysis_failed', 'YouTube analysis requires link metadata or a URL descriptor');
      }
      return null;
    case 'video_upload':
    case 'audio_upload':
      if (!intake.uploadAsset) {
        return providerErr('analysis_failed', 'Upload analysis requires a resolved upload asset');
      }
      return null;
    case 'transcript':
      if (!intake.transcriptText?.trim()) {
        return providerErr('transcription_failed', 'Transcript analysis requires non-empty transcript text');
      }
      return null;
    case 'script':
      if (!intake.scriptText?.trim()) {
        return providerErr('analysis_failed', 'Script analysis requires non-empty script text');
      }
      return null;
    default:
      return providerErr('analysis_failed', `Unsupported reference kind "${referenceKind as string}"`);
  }
}

function buildDraft(input: AnalyzeReferenceInput): ReferenceVideoAnalysisDraft {
  const durationMs = resolveDurationMs(input);

  let metadata: AnalysisMetadata;
  let media: AnalysisMedia;
  let transcript: AnalysisTranscript;

  switch (input.referenceKind) {
    case 'youtube_url':
      metadata = buildYoutubeMetadata(input);
      media = buildYoutubeMedia(input);
      transcript = buildYoutubeTranscript(input);
      break;
    case 'video_upload':
    case 'audio_upload':
      metadata = buildUploadMetadata(input);
      media = buildUploadMedia(input);
      transcript = {
        transcriptText: 'Mock transcript unavailable for uploaded media in PP-10.',
        transcriptSource: 'speech_to_text',
        transcriptLanguage: 'en',
      };
      break;
    case 'transcript':
      metadata = buildTextMetadata(input);
      media = buildTextMedia();
      transcript = buildUserTextTranscript(input.intake.transcriptText!, durationMs, 'user_supplied');
      break;
    case 'script':
      metadata = buildTextMetadata(input);
      media = buildTextMedia();
      transcript = buildUserTextTranscript(input.intake.scriptText!, durationMs, 'user_supplied');
      break;
    default:
      metadata = buildTextMetadata(input);
      media = buildTextMedia();
      transcript = { transcriptText: 'Unsupported reference kind.' };
  }

  const bodyText = input.intake.transcriptText ?? input.intake.scriptText;

  return {
    ...structuredClone(MOCK_ANALYSIS_DERIVED_SECTIONS),
    projectId: input.projectId,
    referenceId: input.referenceId,
    fingerprintId: input.fingerprintId,
    pipelineVersion: CORE_ANALYSIS_CONFIG.pipelineVersion,
    createdAt: input.occurredAt,
    version: {
      analysisVersion: 1,
      isLatest: true,
      changeReason: 'initial',
    },
    metadata,
    media,
    transcript,
    timeline: buildTimeline(durationMs),
    scenes: buildScenes(durationMs),
    objects: { detectedObjects: [] },
    characters: { characterPresence: [] },
    locations: { locations: [] },
    hooks: {
      hookStartMs: 0,
      hookDurationMs: Math.min(15_000, Math.floor(durationMs * 0.15)),
      hookPattern: 'intake-derived opening',
      hookSummary: 'Deterministic hook derived from intake duration',
    },
    seoSeeds: buildSeoSeeds(metadata.title, bodyText),
    fingerprint: {
      fingerprintId: input.fingerprintId,
      fingerprintAlgorithmVersion: input.fingerprintAlgorithmVersion,
      fingerprintInputs: buildFingerprintInputs(input.referenceKind, input.intake),
    },
  };
}

/** Dev/test analysis provider — deterministic fixture-driven output, no I/O. */
export class MockAnalysisProvider implements ReferenceAnalysisProvider {
  readonly providerId = 'mock' as const;

  async analyze(input: AnalyzeReferenceInput): Promise<ReferenceAnalysisProviderResult> {
    const validationError = validateIntake(input);
    if (validationError) {
      return validationError;
    }

    return providerOk(buildDraft(input));
  }
}

export function createMockAnalysisProvider(): MockAnalysisProvider {
  return new MockAnalysisProvider();
}

export function createUploadAssetFixture(
  assetId: EntityId,
  options?: {
    mimeType?: string;
    byteSize?: number;
    durationSeconds?: number;
  },
): NonNullable<ReferenceIntakeView['uploadAsset']> {
  return {
    assetId,
    mimeType: options?.mimeType ?? 'video/mp4',
    byteSize: options?.byteSize ?? 12_345_678,
    durationSeconds: options?.durationSeconds ?? 120,
    storageLocator: asStorageLocator(`memory://upload/${assetId}`),
  };
}
