import type { IsoDateTime } from '../../common.js';
import type { AssetState } from '../constants.js';
import type { EntityId } from '../../canonical/primitives.js';

/** When and how temp assets are purged — sweeper contract. */
export type CleanupPolicy = {
  /** Delete storage objects after this many hours from creation. */
  tempAssetMaxAgeHours: number;
  /** Grace period after job terminal state before forced cleanup. */
  postJobCleanupGraceHours: number;
  /** Whether orphaned assets (no active job) are eligible for cleanup. */
  purgeOrphans: boolean;
};

export const DEFAULT_CLEANUP_POLICY: CleanupPolicy = {
  tempAssetMaxAgeHours: 24,
  postJobCleanupGraceHours: 1,
  purgeOrphans: true,
};

/** Expiration rules for upload sessions and temp assets. */
export type ExpirationPolicy = {
  uploadSessionTtlHours: number;
  tempAssetTtlHours: number;
  signedUploadUrlTtlMinutes: number;
};

export const DEFAULT_EXPIRATION_POLICY: ExpirationPolicy = {
  uploadSessionTtlHours: 24,
  tempAssetTtlHours: 24,
  signedUploadUrlTtlMinutes: 60,
};

export type AssetLifecycleRecord = {
  assetId: EntityId;
  state: AssetState;
  createdAt: IsoDateTime;
  expiresAt: IsoDateTime;
  deletedAt?: IsoDateTime;
  /** Set when the linked analysis job reaches a terminal state. */
  jobTerminalAt?: IsoDateTime;
  /** True when no active job references the asset (orphan candidate). */
  isOrphan?: boolean;
};

export function isAssetExpired(record: AssetLifecycleRecord, now: IsoDateTime): boolean {
  return record.state === 'expired' || now >= record.expiresAt;
}

function isPastMaxAge(record: AssetLifecycleRecord, policy: CleanupPolicy, now: IsoDateTime): boolean {
  const maxAgeMs = policy.tempAssetMaxAgeHours * 60 * 60 * 1000;
  return Date.parse(now) >= Date.parse(record.createdAt) + maxAgeMs;
}

function isPastJobCleanupGrace(
  record: AssetLifecycleRecord,
  policy: CleanupPolicy,
  now: IsoDateTime,
): boolean {
  if (!record.jobTerminalAt) {
    return true;
  }
  const graceMs = policy.postJobCleanupGraceHours * 60 * 60 * 1000;
  return Date.parse(now) >= Date.parse(record.jobTerminalAt) + graceMs;
}

export function isAssetEligibleForCleanup(
  record: AssetLifecycleRecord,
  policy: CleanupPolicy,
  now: IsoDateTime,
): boolean {
  if (record.state === 'deleted') {
    return false;
  }

  const expired = isAssetExpired(record, now);
  const pastMaxAge = isPastMaxAge(record, policy, now);
  if (!expired && !pastMaxAge) {
    return false;
  }

  if (record.isOrphan === true && !policy.purgeOrphans) {
    return false;
  }

  if (!isPastJobCleanupGrace(record, policy, now)) {
    return false;
  }

  return true;
}

export function resolveExpirationTimestamp(
  createdAt: IsoDateTime,
  policy: ExpirationPolicy,
): IsoDateTime {
  const createdMs = Date.parse(createdAt);
  const expiresMs = createdMs + policy.tempAssetTtlHours * 60 * 60 * 1000;
  return new Date(expiresMs).toISOString();
}
