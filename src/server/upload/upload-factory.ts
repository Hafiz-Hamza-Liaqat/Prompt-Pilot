import { createDefaultJobLifecycleService } from '@/server/job';
import { createPureMediaIntakeService } from '@/server/media';
import { createDefaultJobOrchestrator } from '@/server/orchestration';
import { InMemoryUploadSessionRepository } from './in-memory-upload-session-repository.js';
import { InMemoryWorkspaceAssetRepository } from './in-memory-workspace-asset-repository.js';
import { createMemoryStorageProvider } from './memory-storage-provider.js';
import { createUploadCoordinator, type UploadCoordinator } from './upload-coordinator.js';

let coordinatorSingleton: UploadCoordinator | null = null;

/** Dev/test wiring — replace with DI container in production. */
export function createUploadCoordinatorInstance(): UploadCoordinator {
  const lifecycle = createDefaultJobLifecycleService();
  const mediaIntake = createPureMediaIntakeService();
  const orchestrator = createDefaultJobOrchestrator({ lifecycle, mediaIntake });

  return createUploadCoordinator({
    mediaIntake,
    storage: createMemoryStorageProvider(),
    sessionRepository: new InMemoryUploadSessionRepository(),
    assetRepository: new InMemoryWorkspaceAssetRepository(),
    orchestrator,
  });
}

export function getUploadCoordinator(): UploadCoordinator {
  if (!coordinatorSingleton) {
    coordinatorSingleton = createUploadCoordinatorInstance();
  }
  return coordinatorSingleton;
}

/** Reset singleton — tests only. */
export function resetUploadCoordinatorSingleton(): void {
  coordinatorSingleton = null;
}
