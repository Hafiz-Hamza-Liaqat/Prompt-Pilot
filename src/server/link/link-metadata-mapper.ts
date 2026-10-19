import type { LinkMetadata, ProviderRawMetadata } from '@/domain/link';
import { LINK_METADATA_SCHEMA_VERSION } from '@/domain/link';
import type { ReferenceKind } from '@/domain/canonical/constants';
import type { EntityId } from '@/domain/canonical/primitives';
import type { IsoDateTime } from '@/domain/common';
import type { LinkProviderId, NormalizedUrl } from '@/domain/link';

export type MapLinkMetadataInput = {
  linkMetadataId: EntityId;
  referenceId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  referenceKind: ReferenceKind;
  normalized: NormalizedUrl;
  providerId: LinkProviderId;
  extractionMethod: 'oembed' | 'api' | 'mock';
  extractedAt: IsoDateTime;
  raw: ProviderRawMetadata;
};

/** Maps provider-internal metadata to canonical LinkMetadata — strips provider payloads. */
export function mapProviderRawToLinkMetadata(input: MapLinkMetadataInput): LinkMetadata {
  const { raw, normalized } = input;

  return {
    linkMetadataId: input.linkMetadataId,
    referenceId: input.referenceId,
    projectId: input.projectId,
    ownerId: input.ownerId,
    referenceKind: input.referenceKind,
    platform: normalized.platform,
    platformContentId: normalized.platformContentId,
    canonicalUrl: normalized.canonicalUrl,
    originalUrl: normalized.originalUrl,
    title: raw.title,
    authorLabel: raw.authorLabel,
    channelId: raw.channelId,
    durationSeconds: raw.durationSeconds,
    publishedAt: raw.publishedAt,
    language: raw.language,
    thumbnailUrl: sanitizeThumbnailUrl(raw.thumbnailUrl),
    aspectRatio: raw.aspectRatio,
    mediaKind: raw.mediaKind ?? 'video',
    accessStatus: raw.accessStatus ?? 'public',
    embedAllowed: raw.embedAllowed ?? true,
    providerId: input.providerId,
    extractionMethod: input.extractionMethod,
    extractedAt: input.extractedAt,
    linkMetadataVersion: LINK_METADATA_SCHEMA_VERSION,
  };
}

function sanitizeThumbnailUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}
