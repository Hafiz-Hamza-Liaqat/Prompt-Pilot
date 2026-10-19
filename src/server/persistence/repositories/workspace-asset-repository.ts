import type { AssetState } from '@/domain/media';
import type { StorageLocator } from '@/domain/media';
import type { EntityId } from '@/domain/canonical/primitives';
import type { IsoDateTime } from '@/domain/common';
import type { OwnerScope } from '../contracts/ownership';
import type { PersistenceResult } from '../contracts/result';

/** Workspace asset row — aligns with PP-05A / workspace_assets table. */
export type WorkspaceAssetRecord = {
  assetId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  referenceId: EntityId;
  storageLocator: StorageLocator;
  assetKind: 'temporary';
  state: AssetState;
  mimeType: string;
  byteSize: number;
  contentHash?: string;
  jobId?: EntityId;
  expiresAt: IsoDateTime;
  createdAt: IsoDateTime;
};

/**
 * Workspace asset persistence port — PP-07B interface.
 * Supabase adapter deferred to PP-05C.
 */
export type WorkspaceAssetRepository = {
  insert(scope: OwnerScope, asset: WorkspaceAssetRecord): Promise<PersistenceResult<void>>;
  findById(scope: OwnerScope, assetId: EntityId): Promise<PersistenceResult<WorkspaceAssetRecord>>;
  markExpired(scope: OwnerScope, assetId: EntityId): Promise<PersistenceResult<void>>;
};
