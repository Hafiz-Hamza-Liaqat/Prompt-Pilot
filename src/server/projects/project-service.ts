import type {
  ProjectActionStatus,
  ProjectDashboardQuery,
  ProjectListResult,
  ProjectRecord,
} from '@/domain/project';
import {
  buildDuplicateTitle,
  createProjectInputSchema,
  projectIdSchema,
  projectMutationIdSchema,
  updateProjectInputSchema,
} from '@/domain/project';
import type { ProjectRepository } from './project-repository';

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: ProjectActionStatus };

export class ProjectService {
  constructor(private readonly repository: ProjectRepository) {}

  async create(ownerId: string, input: unknown): Promise<ServiceResult<ProjectRecord>> {
    const parsed = createProjectInputSchema.safeParse(input);

    if (!parsed.success) {
      return { ok: false, status: 'validation_error' };
    }

    const result = await this.repository.create(ownerId, parsed.data);

    if (!result.ok) {
      return { ok: false, status: this.mapRepositoryError(result.code) };
    }

    return { ok: true, data: result.data };
  }

  async getById(ownerId: string, projectId: unknown): Promise<ServiceResult<ProjectRecord>> {
    const parsed = projectIdSchema.safeParse(projectId);

    if (!parsed.success) {
      return { ok: false, status: 'validation_error' };
    }

    const result = await this.repository.getById(ownerId, parsed.data);

    if (!result.ok) {
      return { ok: false, status: this.mapRepositoryError(result.code) };
    }

    return { ok: true, data: result.data };
  }

  async list(
    ownerId: string,
    query: ProjectDashboardQuery,
  ): Promise<ServiceResult<ProjectListResult>> {
    const result = await this.repository.list(ownerId, query);

    if (!result.ok) {
      return { ok: false, status: this.mapRepositoryError(result.code) };
    }

    return { ok: true, data: result.data };
  }

  async update(ownerId: string, input: unknown): Promise<ServiceResult<ProjectRecord>> {
    const parsed = updateProjectInputSchema.safeParse(input);

    if (!parsed.success) {
      return { ok: false, status: 'validation_error' };
    }

    const result = await this.repository.update(ownerId, parsed.data);

    if (!result.ok) {
      return { ok: false, status: this.mapRepositoryError(result.code) };
    }

    return { ok: true, data: result.data };
  }

  async archive(ownerId: string, projectId: unknown): Promise<ServiceResult<ProjectRecord>> {
    const parsed = projectMutationIdSchema.safeParse({ projectId });

    if (!parsed.success) {
      return { ok: false, status: 'validation_error' };
    }

    const result = await this.repository.setArchived(ownerId, parsed.data.projectId, true);

    if (!result.ok) {
      return { ok: false, status: this.mapRepositoryError(result.code) };
    }

    return { ok: true, data: result.data };
  }

  async restore(ownerId: string, projectId: unknown): Promise<ServiceResult<ProjectRecord>> {
    const parsed = projectMutationIdSchema.safeParse({ projectId });

    if (!parsed.success) {
      return { ok: false, status: 'validation_error' };
    }

    const result = await this.repository.setArchived(ownerId, parsed.data.projectId, false);

    if (!result.ok) {
      return { ok: false, status: this.mapRepositoryError(result.code) };
    }

    return { ok: true, data: result.data };
  }

  async duplicate(ownerId: string, projectId: unknown): Promise<ServiceResult<ProjectRecord>> {
    const parsed = projectMutationIdSchema.safeParse({ projectId });

    if (!parsed.success) {
      return { ok: false, status: 'validation_error' };
    }

    const source = await this.repository.getById(ownerId, parsed.data.projectId);

    if (!source.ok) {
      return { ok: false, status: this.mapRepositoryError(source.code) };
    }

    const duplicateTitle = buildDuplicateTitle(source.data.title);
    const result = await this.repository.duplicate(ownerId, parsed.data.projectId, duplicateTitle);

    if (!result.ok) {
      return { ok: false, status: this.mapRepositoryError(result.code) };
    }

    return { ok: true, data: result.data };
  }

  async softDelete(ownerId: string, projectId: unknown): Promise<ServiceResult<void>> {
    const parsed = projectMutationIdSchema.safeParse({ projectId });

    if (!parsed.success) {
      return { ok: false, status: 'validation_error' };
    }

    const result = await this.repository.softDelete(ownerId, parsed.data.projectId);

    if (!result.ok) {
      return { ok: false, status: this.mapRepositoryError(result.code) };
    }

    return { ok: true, data: undefined };
  }

  private mapRepositoryError(code: 'not_found' | 'persistence_error' | 'forbidden'): ProjectActionStatus {
    switch (code) {
      case 'not_found':
        return 'not_found';
      case 'forbidden':
        return 'forbidden';
      default:
        return 'persistence_error';
    }
  }
}

export function createProjectService(repository: ProjectRepository): ProjectService {
  return new ProjectService(repository);
}
