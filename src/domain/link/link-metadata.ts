import type { AccessStatus, ReferenceKind, ReferencePlatform } from '../canonical/constants.js';
import type { EntityId } from '../canonical/primitives.js';
import type { IsoDateTime } from '../common.js';
import type { LinkProviderId } from './link-provider.js';

/** Canonical output of Link Intelligence — PP-05. */
export type LinkMetadata = {
  linkMetadataId: EntityId;
  referenceId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  referenceKind: ReferenceKind;
  platform: ReferencePlatform;
  platformContentId: string;
  canonicalUrl: string;
  originalUrl: string;
  title?: string;
  authorLabel?: string;
  channelId?: string;
  durationSeconds?: number;
  publishedAt?: IsoDateTime;
  language?: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
  mediaKind?: 'video' | 'audio';
  accessStatus: AccessStatus;
  embedAllowed?: boolean;
  providerId: LinkProviderId;
  extractionMethod: 'oembed' | 'api' | 'mock';
  extractedAt: IsoDateTime;
  linkMetadataVersion: string;
};

export const LINK_METADATA_SCHEMA_VERSION = '1.0.0';
