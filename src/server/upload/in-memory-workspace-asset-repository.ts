import type { EntityId } from '@/domain/canonical/primitives';
import type {
  WorkspaceAssetRepository,
  WorkspaceAssetRecord,
} from '@/server/persistence/repositories/workspace-asset-repository';
import type { OwnerScope } from '@/server/persistence/contracts/ownership';
import type { PersistenceResult } from '@/server/persistence/contracts/result';
import { persistenceOk, persistenceErr } from '@/server/persistence/contracts/result';

function scopeKey(scope: OwnerScope): string {
  return `${scope.ownerId}:${scope.projectId}`;
}

export class InMemoryWorkspaceAssetRepository implements WorkspaceAssetRepository {
  private readonly assets = new Map<string, Map<string, WorkspaceAssetRecord>>();

  async insert(scope: OwnerScope, asset: WorkspaceAssetRecord): Promise<PersistenceResult<void>> {
    const bucket = this.assets.get(scopeKey(scope)) ?? new Map<string, WorkspaceAssetRecord>();
    bucket.set(asset.assetId, asset);
    this.assets.set(scopeKey(scope), bucket);
    return persistenceOk(undefined);
  }

  async findById(scope: OwnerScope, assetId: EntityId): Promise<PersistenceResult<WorkspaceAssetRecord>> {
    const asset = this.assets.get(scopeKey(scope))?.get(assetId);
    if (!asset) {
      return persistenceErr('not_found', 'Workspace asset not found');
    }
    return persistenceOk(asset);
  }

  async markExpired(scope: OwnerScope, assetId: EntityId): Promise<PersistenceResult<void>> {
    const bucket = this.assets.get(scopeKey(scope));
    const asset = bucket?.get(assetId);
    if (!asset || !bucket) {
      return persistenceErr('not_found', 'Workspace asset not found');
    }
    bucket.set(assetId, { ...asset, state: 'expired' });
    return persistenceOk(undefined);
  }
}
