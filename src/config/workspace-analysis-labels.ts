import type { AccessStatus, ReferenceKind, ReferencePlatform } from '@/domain/canonical';

/** UI-only display labels — canonical values remain on the view model. */
export const REFERENCE_KIND_LABELS: Record<ReferenceKind, string> = {
  youtube_url: 'YouTube URL',
  transcript: 'Transcript',
  script: 'Script',
  video_upload: 'Video upload',
  audio_upload: 'Audio upload',
};

export const REFERENCE_PLATFORM_LABELS: Record<ReferencePlatform, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
};

export const ACCESS_STATUS_LABELS: Record<AccessStatus, string> = {
  public: 'Public',
  restricted: 'Restricted',
  unavailable: 'Unavailable',
  blocked: 'Blocked',
};

export const TRANSCRIPT_SOURCE_LABELS: Record<string, string> = {
  platform_caption: 'Platform caption',
  user_supplied: 'User supplied',
  speech_to_text: 'Speech to text',
};

export const CONFIDENCE_CLASSIFICATION_LABELS: Record<string, string> = {
  observed: 'Observed',
  measured: 'Measured',
  derived: 'Derived',
  unknown: 'Unknown',
};

export function labelReferenceKind(kind: ReferenceKind): string {
  return REFERENCE_KIND_LABELS[kind];
}

export function labelReferencePlatform(platform: ReferencePlatform | undefined): string | null {
  if (!platform) {
    return null;
  }

  return REFERENCE_PLATFORM_LABELS[platform];
}

export function labelAccessStatus(status: AccessStatus): string {
  return ACCESS_STATUS_LABELS[status];
}

export function labelTranscriptSource(source: string): string {
  return TRANSCRIPT_SOURCE_LABELS[source] ?? source.replaceAll('_', ' ');
}

export function labelConfidenceClassification(classification: string): string {
  return CONFIDENCE_CLASSIFICATION_LABELS[classification] ?? classification.replaceAll('_', ' ');
}
