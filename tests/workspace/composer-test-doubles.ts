import type { JobState } from '../../src/domain/canonical/constants.js';
import type { ReferenceVideoAnalysis } from '../../src/domain/canonical/referenceVideoAnalysis.js';
import type { EntityId } from '../../src/domain/canonical/primitives.js';
import type {
  OwnerScope,
  PersistenceResult,
  WorkspaceIntelligenceQuery,
  WorkspaceIntelligenceSnapshot,
} from '../../src/server/persistence/contracts/index.js';
import type { WorkspaceRepository } from '../../src/server/persistence/repositories/workspace-repository.js';
import { persistenceOk } from '../../src/server/persistence/contracts/result.js';

export type StubWorkspaceRepositoryOptions = {
  snapshot?: WorkspaceIntelligenceSnapshot;
  result?: PersistenceResult<WorkspaceIntelligenceSnapshot>;
  /** When false, returns the stored snapshot reference (for immutability tests). Default true. */
  cloneOnRead?: boolean;
};

export class StubWorkspaceRepository implements WorkspaceRepository {
  readonly calls: Array<{ scope: OwnerScope; query?: WorkspaceIntelligenceQuery }> = [];

  private readonly snapshot: WorkspaceIntelligenceSnapshot;
  private readonly resultOverride?: PersistenceResult<WorkspaceIntelligenceSnapshot>;
  private readonly cloneOnRead: boolean;

  constructor(options: StubWorkspaceRepositoryOptions = {}) {
    this.snapshot = options.snapshot ?? emptyIntelligenceSnapshot();
    this.resultOverride = options.result;
    this.cloneOnRead = options.cloneOnRead ?? true;
  }

  async getIntelligenceBundle(
    scope: OwnerScope,
    query?: WorkspaceIntelligenceQuery,
  ): Promise<PersistenceResult<WorkspaceIntelligenceSnapshot>> {
    this.calls.push({ scope, query });

    if (this.resultOverride) {
      return this.resultOverride;
    }

    return persistenceOk(this.cloneOnRead ? structuredClone(this.snapshot) : this.snapshot);
  }
}

export function emptyIntelligenceSnapshot(): WorkspaceIntelligenceSnapshot {
  return {
    reference: null,
    analysis: null,
    packages: [],
    activeJob: null,
  };
}

export function buildIntelligenceSnapshot(options?: {
  analysis?: ReferenceVideoAnalysis | null;
  referenceId?: EntityId | null;
  activeJobState?: JobState | null;
}): WorkspaceIntelligenceSnapshot {
  const analysis = options?.analysis ?? null;

  return {
    reference:
      options?.referenceId || analysis?.referenceId
        ? {
            referenceId: options?.referenceId ?? analysis!.referenceId,
            projectId: analysis?.projectId ?? '33333333-3333-3333-3333-333333333333',
            referenceKind: 'youtube_url' as const,
            accessStatus: 'public' as const,
            submittedAt: '2026-07-05T12:00:00.000Z',
          }
        : null,
    analysis,
    packages: [],
    activeJob: options?.activeJobState
      ? {
          jobId: 'job-001',
          projectId: analysis?.projectId ?? '33333333-3333-3333-3333-333333333333',
          referenceId: analysis?.referenceId ?? 'reference-youtube-001',
          state: options.activeJobState,
          progressPercent: 45,
          createdAt: '2026-07-05T12:00:00.000Z',
          updatedAt: '2026-07-05T12:00:00.000Z',
        }
      : null,
  };
}
