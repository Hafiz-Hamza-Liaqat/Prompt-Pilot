import type { LinkMetadata } from '@/domain/link';
import type { EntityId } from '@/domain/canonical/primitives';
import type { LinkProviderId } from '@/domain/link';

export type LinkMetadataCacheKey = {
  ownerId: EntityId;
  projectId: EntityId;
  canonicalUrl: string;
  providerId: LinkProviderId;
  linkMetadataVersion: string;
};

/** Port only — no storage implementation in PP-05B (PP-09). */
export type LinkMetadataCache = {
  get(key: LinkMetadataCacheKey): Promise<LinkMetadata | null>;
  set(key: LinkMetadataCacheKey, metadata: LinkMetadata, ttlSeconds?: number): Promise<void>;
  delete(key: LinkMetadataCacheKey): Promise<void>;
};

export function buildLinkMetadataCacheKey(
  metadata: Pick<LinkMetadata, 'ownerId' | 'projectId' | 'canonicalUrl' | 'providerId' | 'linkMetadataVersion'>,
): LinkMetadataCacheKey {
  return {
    ownerId: metadata.ownerId,
    projectId: metadata.projectId,
    canonicalUrl: metadata.canonicalUrl,
    providerId: metadata.providerId,
    linkMetadataVersion: metadata.linkMetadataVersion,
  };
}
