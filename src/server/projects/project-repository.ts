import type {
  CreateProjectInput,
  ProjectDashboardQuery,
  ProjectListResult,
  ProjectRecord,
  UpdateProjectInput,
} from '@/domain/project';

export type RepositoryErrorCode = 'not_found' | 'persistence_error' | 'forbidden';

export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: RepositoryErrorCode };

export interface ProjectRepository {
  create(ownerId: string, input: CreateProjectInput): Promise<RepositoryResult<ProjectRecord>>;
  getById(ownerId: string, projectId: string): Promise<RepositoryResult<ProjectRecord>>;
  list(ownerId: string, query: ProjectDashboardQuery): Promise<RepositoryResult<ProjectListResult>>;
  update(
    ownerId: string,
    input: UpdateProjectInput,
  ): Promise<RepositoryResult<ProjectRecord>>;
  setArchived(
    ownerId: string,
    projectId: string,
    archived: boolean,
  ): Promise<RepositoryResult<ProjectRecord>>;
  duplicate(ownerId: string, projectId: string, title: string): Promise<RepositoryResult<ProjectRecord>>;
  softDelete(ownerId: string, projectId: string): Promise<RepositoryResult<void>>;
}
