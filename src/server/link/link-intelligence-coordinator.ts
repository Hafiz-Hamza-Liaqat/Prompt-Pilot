import { randomUUID } from 'node:crypto';
import type { ReferenceKind } from '@/domain/canonical/constants';
import type { EntityId } from '@/domain/canonical/primitives';
import type { IsoDateTime } from '@/domain/common';
import type { LinkMetadata } from '@/domain/link';
import { LINK_METADATA_SCHEMA_VERSION } from '@/domain/link';
import { requiresLinkIntelligence } from '@/domain/orchestration';
import { LINK_INTELLIGENCE_CONFIG } from './config.js';
import type { LinkMetadataCache } from './link-metadata-cache.js';
import { buildLinkMetadataCacheKey } from './link-metadata-cache.js';
import { mapProviderRawToLinkMetadata } from './link-metadata-mapper.js';
import type { LinkProviderRegistry } from './link-provider-registry.js';
import { fetchMetadataWithRetry } from './retry-policy.js';
import { assertResolvedHostSafe, type HostAddressResolver } from './secure-host.js';
import { assertFetchAllowed } from './security-gate.js';
import { normalizeUrl } from './url-normalizer.js';

export type LinkIntelligenceResult<T> =
  | { ok: true; data: T; cacheHit?: boolean }
  | { ok: false; code: string; message: string; retryable?: boolean };

export type AnalyzeLinkInput = {
  jobId: EntityId;
  referenceId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  referenceKind: ReferenceKind;
  rawUrl: string;
  occurredAt: IsoDateTime;
};

export type AnalyzeLinkOutcome = {
  linkMetadata: LinkMetadata;
  cacheHit: boolean;
};

export type LinkIntelligenceCoordinatorDeps = {
  registry: LinkProviderRegistry;
  cache?: LinkMetadataCache;
  /** Injectable DNS resolver for tests — production uses system DNS. */
  hostResolver?: HostAddressResolver;
};

function linkOk<T>(data: T, cacheHit = false): LinkIntelligenceResult<T> {
  return { ok: true, data, cacheHit };
}

function linkErr<T>(code: string, message: string, retryable?: boolean): LinkIntelligenceResult<T> {
  return { ok: false, code, message, retryable };
}

/**
 * Coordinates URL normalization, security gating, provider fetch, and LinkMetadata mapping.
 * Does not advance job workflow — JobOrchestrator owns progression.
 */
export class LinkIntelligenceCoordinator {
  constructor(private readonly deps: LinkIntelligenceCoordinatorDeps) {}

  async analyzeLink(input: AnalyzeLinkInput): Promise<LinkIntelligenceResult<AnalyzeLinkOutcome>> {
    if (!requiresLinkIntelligence(input.referenceKind)) {
      return linkErr('unsupported_platform', `Reference kind "${input.referenceKind}" does not require link intelligence`);
    }

    const normalized = normalizeUrl(input.rawUrl, LINK_INTELLIGENCE_CONFIG.maxUrlLength);
    if (!normalized.ok) {
      return linkErr(normalized.code, normalized.message);
    }

    const security = assertFetchAllowed(normalized.data.canonicalUrl);
    if (!security.ok) {
      return linkErr(security.code, security.message);
    }

    const dns = await assertResolvedHostSafe(
      new URL(normalized.data.canonicalUrl).hostname,
      this.deps.hostResolver,
    );
    if (!dns.ok) {
      return linkErr(dns.code, dns.message);
    }

    const provider = this.deps.registry.detectProvider(new URL(normalized.data.canonicalUrl));
    if (!provider) {
      return linkErr('unsupported_platform', 'No link provider registered for URL');
    }

    const linkMetadataId = randomUUID() as EntityId;
    const cacheKey = buildLinkMetadataCacheKey({
      ownerId: input.ownerId,
      projectId: input.projectId,
      canonicalUrl: normalized.data.canonicalUrl,
      providerId: provider.providerId,
      linkMetadataVersion: LINK_METADATA_SCHEMA_VERSION,
    });

    if (this.deps.cache) {
      const cached = await this.deps.cache.get(cacheKey);
      if (cached) {
        return linkOk(
          {
            linkMetadata: {
              ...cached,
              linkMetadataId,
              referenceId: input.referenceId,
              projectId: input.projectId,
              ownerId: input.ownerId,
              referenceKind: input.referenceKind,
              extractedAt: input.occurredAt,
            },
            cacheHit: true,
          },
          true,
        );
      }
    }

    const fetchResult = await fetchMetadataWithRetry(
      () => provider.fetchMetadata({
        normalized: normalized.data,
        ownerScope: { ownerId: input.ownerId, projectId: input.projectId },
        requestedAt: input.occurredAt,
      }),
      (result) => !result.ok && result.retryable === true,
    );

    if (!fetchResult.ok) {
      return linkErr(
        mapProviderErrorCode(fetchResult.code),
        fetchResult.message ?? 'Link provider fetch failed',
        fetchResult.retryable,
      );
    }

    const linkMetadata = mapProviderRawToLinkMetadata({
      linkMetadataId,
      referenceId: input.referenceId,
      projectId: input.projectId,
      ownerId: input.ownerId,
      referenceKind: input.referenceKind,
      normalized: normalized.data,
      providerId: provider.providerId,
      extractionMethod: fetchResult.extractionMethod,
      extractedAt: input.occurredAt,
      raw: fetchResult.payload,
    });

    if (this.deps.cache) {
      await this.deps.cache.set(cacheKey, linkMetadata);
    }

    return linkOk({ linkMetadata, cacheHit: false });
  }
}

function mapProviderErrorCode(code: string): string {
  switch (code) {
    case 'not_found':
    case 'content_removed':
      return 'content_removed';
    case 'private_content':
      return 'private_content';
    case 'geo_blocked':
      return 'geo_blocked';
    case 'timeout':
      return 'timeout';
    case 'rate_limited':
      return 'worker_unavailable';
    default:
      return 'invalid_url';
  }
}

export function createLinkIntelligenceCoordinator(
  deps: LinkIntelligenceCoordinatorDeps,
): LinkIntelligenceCoordinator {
  return new LinkIntelligenceCoordinator(deps);
}
