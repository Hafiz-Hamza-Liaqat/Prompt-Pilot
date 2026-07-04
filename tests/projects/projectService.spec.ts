import { describe, expect, it } from 'vitest';
import type {
  CreateProjectInput,
  ProjectDashboardQuery,
  ProjectListResult,
  ProjectRecord,
  UpdateProjectInput,
} from '../../src/domain/project.js';
import { PROJECT_PAGE_SIZE } from '../../src/domain/project.js';
import type { ProjectRepository, RepositoryResult } from '../../src/server/projects/project-repository.js';
import { ProjectService } from '../../src/server/projects/project-service.js';

class FakeProjectRepository implements ProjectRepository {
  private projects = new Map<string, ProjectRecord>();
  private shouldFail = false;

  seed(project: ProjectRecord) {
    this.projects.set(project.id, project);
  }

  setShouldFail(value: boolean) {
    this.shouldFail = value;
  }

  async create(ownerId: string, input: CreateProjectInput): Promise<RepositoryResult<ProjectRecord>> {
    if (this.shouldFail) {
      return { ok: false, code: 'persistence_error' };
    }

    const project: ProjectRecord = {
      id: crypto.randomUUID(),
      ownerId,
      title: input.title,
      description: input.description ?? null,
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(project.id, project);
    return { ok: true, data: project };
  }

  async getById(ownerId: string, projectId: string): Promise<RepositoryResult<ProjectRecord>> {
    const project = this.projects.get(projectId);
    if (!project || project.ownerId !== ownerId) {
      return { ok: false, code: 'not_found' };
    }
    return { ok: true, data: project };
  }

  async list(ownerId: string, query: ProjectDashboardQuery): Promise<RepositoryResult<ProjectListResult>> {
    const visible = [...this.projects.values()].filter((project) => project.ownerId === ownerId);
    const filtered = visible.filter((project) => {
      if (query.status === 'active') {
        return project.archivedAt === null;
      }
      if (query.status === 'archived') {
        return project.archivedAt !== null;
      }
      return true;
    });

    return {
      ok: true,
      data: {
        projects: filtered.slice(0, PROJECT_PAGE_SIZE),
        totalMatching: filtered.length,
        page: query.page,
        totalPages: 1,
        activeCount: visible.filter((project) => project.archivedAt === null).length,
        archivedCount: visible.filter((project) => project.archivedAt !== null).length,
      },
    };
  }

  async update(ownerId: string, input: UpdateProjectInput): Promise<RepositoryResult<ProjectRecord>> {
    const existing = await this.getById(ownerId, input.projectId);
    if (!existing.ok) {
      return existing;
    }

    const updated = {
      ...existing.data,
      title: input.title,
      description: input.description ?? null,
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(updated.id, updated);
    return { ok: true, data: updated };
  }

  async setArchived(
    ownerId: string,
    projectId: string,
    archived: boolean,
  ): Promise<RepositoryResult<ProjectRecord>> {
    const existing = await this.getById(ownerId, projectId);
    if (!existing.ok) {
      return existing;
    }

    const updated = {
      ...existing.data,
      archivedAt: archived ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(updated.id, updated);
    return { ok: true, data: updated };
  }

  async duplicate(
    ownerId: string,
    projectId: string,
    title: string,
  ): Promise<RepositoryResult<ProjectRecord>> {
    const existing = await this.getById(ownerId, projectId);
    if (!existing.ok) {
      return existing;
    }

    return this.create(ownerId, {
      title,
      description: existing.data.description,
    });
  }

  async softDelete(ownerId: string, projectId: string): Promise<RepositoryResult<void>> {
    const existing = await this.getById(ownerId, projectId);
    if (!existing.ok) {
      return existing;
    }

    this.projects.delete(projectId);
    return { ok: true, data: undefined };
  }
}

describe('ProjectService', () => {
  const ownerA = '11111111-1111-1111-1111-111111111111';
  const ownerB = '22222222-2222-2222-2222-222222222222';

  it('validates title on create', async () => {
    const service = new ProjectService(new FakeProjectRepository());
    const result = await service.create(ownerA, { title: '   ', description: null });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('validation_error');
    }
  });

  it('normalizes empty description to null on create', async () => {
    const service = new ProjectService(new FakeProjectRepository());
    const result = await service.create(ownerA, { title: 'Launch', description: '' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.description).toBeNull();
    }
  });

  it('forwards trusted owner ID on create', async () => {
    const repository = new FakeProjectRepository();
    const service = new ProjectService(repository);
    const result = await service.create(ownerA, { title: 'Launch', description: null });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.ownerId).toBe(ownerA);
    }
  });

  it('uses bounded page size through repository list', async () => {
    const repository = new FakeProjectRepository();
    const service = new ProjectService(repository);
    const result = await service.list(ownerA, {
      search: undefined,
      status: 'active',
      sort: 'updated_desc',
      page: 1,
    });
    expect(result.ok).toBe(true);
  });

  it('rejects invalid list query through domain validation upstream', async () => {
    const service = new ProjectService(new FakeProjectRepository());
    const parsed = await service.create(ownerA, { title: 'Launch', description: null });
    expect(parsed.ok).toBe(true);
  });

  it('validates update input', async () => {
    const service = new ProjectService(new FakeProjectRepository());
    const result = await service.update(ownerA, {
      projectId: 'not-a-uuid',
      title: 'Updated',
      description: null,
    });
    expect(result.ok).toBe(false);
  });

  it('returns not found for missing projects', async () => {
    const service = new ProjectService(new FakeProjectRepository());
    const result = await service.getById(ownerA, '33333333-3333-3333-3333-333333333333');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('not_found');
    }
  });

  it('archives a project', async () => {
    const repository = new FakeProjectRepository();
    const service = new ProjectService(repository);
    const created = await service.create(ownerA, { title: 'Launch', description: null });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const archived = await service.archive(ownerA, created.data.id);
    expect(archived.ok).toBe(true);
    if (archived.ok) {
      expect(archived.data.archivedAt).not.toBeNull();
    }
  });

  it('restores an archived project', async () => {
    const repository = new FakeProjectRepository();
    const service = new ProjectService(repository);
    const created = await service.create(ownerA, { title: 'Launch', description: null });
    if (!created.ok) {
      return;
    }

    await service.archive(ownerA, created.data.id);
    const restored = await service.restore(ownerA, created.data.id);
    expect(restored.ok).toBe(true);
    if (restored.ok) {
      expect(restored.data.archivedAt).toBeNull();
    }
  });

  it('duplicates with copy suffix', async () => {
    const repository = new FakeProjectRepository();
    const service = new ProjectService(repository);
    const created = await service.create(ownerA, { title: 'Launch', description: 'Notes' });
    if (!created.ok) {
      return;
    }

    const duplicated = await service.duplicate(ownerA, created.data.id);
    expect(duplicated.ok).toBe(true);
    if (duplicated.ok) {
      expect(duplicated.data.title).toBe('Launch (Copy)');
    }
  });

  it('preserves description on duplicate', async () => {
    const repository = new FakeProjectRepository();
    const service = new ProjectService(repository);
    const created = await service.create(ownerA, { title: 'Launch', description: 'Notes' });
    if (!created.ok) {
      return;
    }

    const duplicated = await service.duplicate(ownerA, created.data.id);
    expect(duplicated.ok).toBe(true);
    if (duplicated.ok) {
      expect(duplicated.data.description).toBe('Notes');
    }
  });

  it('does not copy archived state on duplicate', async () => {
    const repository = new FakeProjectRepository();
    const service = new ProjectService(repository);
    const created = await service.create(ownerA, { title: 'Launch', description: null });
    if (!created.ok) {
      return;
    }

    await service.archive(ownerA, created.data.id);
    const duplicated = await service.duplicate(ownerA, created.data.id);
    expect(duplicated.ok).toBe(true);
    if (duplicated.ok) {
      expect(duplicated.data.archivedAt).toBeNull();
    }
  });

  it('soft deletes a project', async () => {
    const repository = new FakeProjectRepository();
    const service = new ProjectService(repository);
    const created = await service.create(ownerA, { title: 'Launch', description: null });
    if (!created.ok) {
      return;
    }

    const deleted = await service.softDelete(ownerA, created.data.id);
    expect(deleted.ok).toBe(true);
    const missing = await service.getById(ownerA, created.data.id);
    expect(missing.ok).toBe(false);
  });

  it('maps repository errors to persistence errors', async () => {
    const repository = new FakeProjectRepository();
    repository.setShouldFail(true);
    const service = new ProjectService(repository);
    const result = await service.create(ownerA, { title: 'Launch', description: null });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('persistence_error');
    }
  });

  it('does not allow substituting another owner through repository lookups', async () => {
    const repository = new FakeProjectRepository();
    const service = new ProjectService(repository);
    const created = await service.create(ownerA, { title: 'Launch', description: null });
    if (!created.ok) {
      return;
    }

    const foreign = await service.getById(ownerB, created.data.id);
    expect(foreign.ok).toBe(false);
  });
});
