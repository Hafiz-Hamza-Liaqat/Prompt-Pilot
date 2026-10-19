import type { LinkMetadata } from '../link/link-metadata.js';
import { requiresLinkIntelligence } from '../orchestration/stages.js';
import type { MediaIntakeResult, MediaOwnerScope } from './models.js';
import { mediaIntakeErr, mediaIntakeOk } from './models.js';
import type { UrlMediaIntakeDescriptor } from './url-media-descriptor.js';
import { UrlMediaIntakeDescriptorSchema } from './url-media-descriptor.js';

function resolveMimeType(mediaKind: 'video' | 'audio' | 'text'): string {
  if (mediaKind === 'audio') {
    return 'audio/mpeg';
  }
  if (mediaKind === 'text') {
    return 'text/plain';
  }
  return 'video/mp4';
}

/**
 * Maps Link Intelligence output to a URL media intake descriptor.
 * Pure — no storage, fetch, or persistence.
 */
export function resolveUrlReferenceFromLinkMetadata(
  linkMetadata: LinkMetadata,
  scope: MediaOwnerScope,
  jobId?: string,
): MediaIntakeResult<UrlMediaIntakeDescriptor> {
  if (scope.ownerId !== linkMetadata.ownerId || scope.projectId !== linkMetadata.projectId) {
    return mediaIntakeErr('ownership_violation', 'Link metadata scope does not match caller scope');
  }

  if (!requiresLinkIntelligence(linkMetadata.referenceKind)) {
    return mediaIntakeErr(
      'unsupported_reference_kind',
      `Reference kind "${linkMetadata.referenceKind}" is not a URL intake path`,
    );
  }

  const mediaKind = linkMetadata.mediaKind ?? 'video';
  const descriptor: UrlMediaIntakeDescriptor = {
    descriptorId: linkMetadata.linkMetadataId,
    referenceId: linkMetadata.referenceId,
    projectId: linkMetadata.projectId,
    ownerId: linkMetadata.ownerId,
    ...(jobId ? { jobId: jobId as UrlMediaIntakeDescriptor['jobId'] } : {}),
    referenceKind: linkMetadata.referenceKind,
    platform: linkMetadata.platform,
    platformContentId: linkMetadata.platformContentId,
    canonicalUrl: linkMetadata.canonicalUrl,
    title: linkMetadata.title,
    authorLabel: linkMetadata.authorLabel,
    durationSeconds: linkMetadata.durationSeconds,
    mimeType: resolveMimeType(mediaKind),
    mediaKind,
    thumbnailUrl: linkMetadata.thumbnailUrl,
    accessStatus: linkMetadata.accessStatus,
    linkMetadataId: linkMetadata.linkMetadataId,
    resolvedAt: linkMetadata.extractedAt,
  };

  const parsed = UrlMediaIntakeDescriptorSchema.safeParse(descriptor);
  if (!parsed.success) {
    return mediaIntakeErr('validation_error', 'Link metadata produced an invalid URL media descriptor');
  }

  return mediaIntakeOk(parsed.data);
}
