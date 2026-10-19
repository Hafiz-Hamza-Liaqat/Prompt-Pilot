import type { EntityId } from '../canonical/primitives.js';
import type { MediaOwnerScope } from './models.js';
import type { UploadSession } from './upload-session.js';
import type { AssetReference, TemporaryAsset } from './storage/descriptors.js';

export type OwnershipSubject = {
  ownerId: EntityId;
  projectId: EntityId;
};

export type OwnershipValidationRequest = {
  scope: MediaOwnerScope;
  subject: OwnershipSubject;
};

export type OwnershipValidationResult =
  | { ok: true }
  | { ok: false; code: 'ownership_violation'; message: string };

export function validateOwnership(request: OwnershipValidationRequest): OwnershipValidationResult {
  const { scope, subject } = request;
  if (scope.ownerId !== subject.ownerId || scope.projectId !== subject.projectId) {
    return {
      ok: false,
      code: 'ownership_violation',
      message: 'Resource ownership does not match caller scope',
    };
  }
  return { ok: true };
}

export function validateUploadSessionOwnership(
  scope: MediaOwnerScope,
  session: UploadSession,
): OwnershipValidationResult {
  return validateOwnership({
    scope,
    subject: { ownerId: session.ownerId, projectId: session.projectId },
  });
}

export function validateAssetReferenceOwnership(
  scope: MediaOwnerScope,
  asset: AssetReference,
): OwnershipValidationResult {
  return validateOwnership({
    scope,
    subject: { ownerId: asset.ownerId, projectId: asset.projectId },
  });
}

export function validateTemporaryAssetOwnership(
  scope: MediaOwnerScope,
  asset: TemporaryAsset,
): OwnershipValidationResult {
  return validateAssetReferenceOwnership(scope, asset);
}
