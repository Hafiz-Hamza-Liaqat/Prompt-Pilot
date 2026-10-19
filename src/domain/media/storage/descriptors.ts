import type { EntityId } from '../../canonical/primitives.js';
import type { IsoDateTime } from '../../common.js';
import type { AssetClassification, AssetState, StorageLocator } from '../constants.js';
import type { MediaOwnerScope } from '../models.js';

/** Provider-neutral object metadata stored alongside bytes. */
export type ObjectDescriptor = {
  locator: StorageLocator;
  bucket: string;
  objectKey: string;
  mimeType: string;
  byteSize: number;
  contentHash?: string;
  contentHashAlgorithm?: 'sha256';
  createdAt: IsoDateTime;
};

/** Lightweight handle passed between intake and pipeline services. */
export type AssetReference = {
  assetId: EntityId;
  referenceId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  classification: AssetClassification;
  mimeType: string;
  byteSize: number;
  durationSeconds?: number;
  /** Internal only — orchestrator/services; never API response (G-29). */
  storageLocator: StorageLocator;
};

/** Temp upload or export blob with mandatory expiration. */
export type TemporaryAsset = AssetReference & {
  classification: 'temporary';
  state: AssetState;
  expiresAt: IsoDateTime;
  jobId?: EntityId;
};

/** Post-MVP permanent asset placeholder — policy-gated. */
export type PermanentAsset = AssetReference & {
  classification: 'permanent';
  state: Extract<AssetState, 'active' | 'deleted' | 'quarantined'>;
  retainedUntil?: IsoDateTime;
};

export type StoredAsset = TemporaryAsset | PermanentAsset;

export type ObjectPutRequest = {
  scope: MediaOwnerScope;
  assetId: EntityId;
  mimeType: string;
  byteSize: number;
  classification: AssetClassification;
  expiresAt?: IsoDateTime;
};

export type ObjectDeleteRequest = {
  scope: MediaOwnerScope;
  locator: StorageLocator;
};

export type ObjectHeadRequest = {
  scope: MediaOwnerScope;
  locator: StorageLocator;
};

export type ObjectHeadResult =
  | { ok: true; descriptor: ObjectDescriptor }
  | { ok: false; code: 'not_found' | 'forbidden' | 'storage_error'; message?: string };

export type ObjectPutResult =
  | { ok: true; descriptor: ObjectDescriptor; uploadTarget: UploadTargetDescriptor }
  | { ok: false; code: 'forbidden' | 'quota_exceeded' | 'storage_error'; message?: string };

/** Opaque upload target — implementation supplies signed URL or multipart plan later. */
export type UploadTargetDescriptor = {
  locator: StorageLocator;
  method: 'single_put' | 'multipart';
  expiresAt: IsoDateTime;
  /** Provider-specific payload — never typed to a cloud SDK in PP-07. */
  providerPayload: Record<string, unknown>;
};

export type ObjectDeleteResult =
  | { ok: true }
  | { ok: false; code: 'not_found' | 'forbidden' | 'storage_error'; message?: string };
