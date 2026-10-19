import type { AccessStatus } from '../canonical/constants.js';
import type { IsoDateTime } from '../common.js';
import type { EntityId } from '../canonical/primitives.js';

export type LinkProviderId = 'youtube' | 'vimeo' | 'mock';

export type LinkProviderCapabilities = {
  supportsOEmbed: boolean;
  supportsMetadataApi: boolean;
  maxDurationSeconds: number;
};

export type NormalizedUrl = {
  canonicalUrl: string;
  originalUrl: string;
  platform: 'youtube' | 'vimeo';
  platformContentId: string;
};

export type MediaOwnerScope = {
  ownerId: EntityId;
  projectId: EntityId;
};

export type LinkFetchRequest = {
  normalized: NormalizedUrl;
  ownerScope: MediaOwnerScope;
  requestedAt: IsoDateTime;
};

/** Provider-internal raw metadata — never exposed outside coordinator. */
export type ProviderRawMetadata = {
  title?: string;
  authorLabel?: string;
  channelId?: string;
  durationSeconds?: number;
  publishedAt?: IsoDateTime;
  language?: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
  mediaKind?: 'video' | 'audio';
  accessStatus?: AccessStatus;
  embedAllowed?: boolean;
};

export type LinkProviderErrorCode =
  | 'not_found'
  | 'private_content'
  | 'geo_blocked'
  | 'content_removed'
  | 'rate_limited'
  | 'provider_error'
  | 'timeout';

export type LinkFetchResult =
  | { ok: true; payload: ProviderRawMetadata; extractionMethod: 'oembed' | 'api' | 'mock' }
  | { ok: false; code: LinkProviderErrorCode; retryable: boolean; message?: string };

export type LinkProvider = {
  readonly providerId: LinkProviderId;
  readonly capabilities: LinkProviderCapabilities;
  detect(url: URL): boolean;
  extractContentId(url: URL): string | null;
  fetchMetadata(request: LinkFetchRequest): Promise<LinkFetchResult>;
};
