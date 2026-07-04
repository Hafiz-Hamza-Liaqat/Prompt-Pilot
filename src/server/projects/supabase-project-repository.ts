import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PROJECT_PAGE_SIZE,
  type CreateProjectInput,
  type ProjectDashboardQuery,
  type ProjectListResult,
  type ProjectRecord,
  type ProjectSortOption,
  type UpdateProjectInput,
} from '@/domain/project';
import type { Database } from '@/types/database';
import type {
  ProjectRepository,
  RepositoryResult,
} from './project-repository';

const PROJECT_COLUMNS =
  'id, owner_id, title, description, archived_at, created_at, updated_at';

type ProjectRow = Pick<
  Database['public']['Tables']['projects']['Row'],
  'id' | 'owner_id' | 'title' | 'description' | 'archived_at' | 'created_at' | 'updated_at'
>;

function mapProject(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

function getSortConfig(sort: ProjectSortOption): { column: keyof ProjectRow; ascending: boolean } {
  switch (sort) {
    case 'created_desc':
      return { column: 'created_at', ascending: false };
    case 'title_asc':
      return { column: 'title', ascending: true };
    case 'title_desc':
      return { column: 'title', ascending: false };
    case 'updated_desc':
    default:
      return { column: 'updated_at', ascending: false };
  }
}

function persistenceError<T>(): RepositoryResult<T> {
  return { ok: false, code: 'persistence_error' };
}

function notFound<T>(): RepositoryResult<T> {
  return { ok: false, code: 'not_found' };
}

export class SupabaseProjectRepository implements ProjectRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async create(
    ownerId: string,
    input: CreateProjectInput,
  ): Promise<RepositoryResult<ProjectRecord>> {
    const { data, error } = await this.supabase
      .from('projects')
      .insert({
        owner_id: ownerId,
        title: input.title,
        description: input.description ?? null,
      })
      .select(PROJECT_COLUMNS)
      .single();

    if (error || !data) {
      return persistenceError();
    }

    return { ok: true, data: mapProject(data) };
  }

  async getById(
    ownerId: string,
    projectId: string,
  ): Promise<RepositoryResult<ProjectRecord>> {
    const { data, error } = await this.supabase
      .from('projects')
      .select(PROJECT_COLUMNS)
      .eq('id', projectId)
      .eq('owner_id', ownerId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      return persistenceError();
    }

    if (!data) {
      return notFound();
    }

    return { ok: true, data: mapProject(data) };
  }

  async list(
    ownerId: string,
    query: ProjectDashboardQuery,
  ): Promise<RepositoryResult<ProjectListResult>> {
    const sortConfig = getSortConfig(query.sort);
    const from = (query.page - 1) * PROJECT_PAGE_SIZE;
    const to = from + PROJECT_PAGE_SIZE - 1;

    let listQuery = this.supabase
      .from('projects')
      .select(PROJECT_COLUMNS, { count: 'exact' })
      .eq('owner_id', ownerId)
      .is('deleted_at', null);

    if (query.status === 'active') {
      listQuery = listQuery.is('archived_at', null);
    } else if (query.status === 'archived') {
      listQuery = listQuery.not('archived_at', 'is', null);
    }

    if (query.search) {
      const term = escapeIlike(query.search);
      listQuery = listQuery.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    const { data, error, count } = await listQuery
      .order(sortConfig.column, { ascending: sortConfig.ascending })
      .range(from, to);

    if (error) {
      return persistenceError();
    }

    const activeCountResult = await this.supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', ownerId)
      .is('deleted_at', null)
      .is('archived_at', null);

    const archivedCountResult = await this.supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', ownerId)
      .is('deleted_at', null)
      .not('archived_at', 'is', null);

    if (activeCountResult.error || archivedCountResult.error) {
      return persistenceError();
    }

    const totalMatching = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalMatching / PROJECT_PAGE_SIZE));

    return {
      ok: true,
      data: {
        projects: (data ?? []).map(mapProject),
        totalMatching,
        page: query.page,
        totalPages,
        activeCount: activeCountResult.count ?? 0,
        archivedCount: archivedCountResult.count ?? 0,
      },
    };
  }

  async update(
    ownerId: string,
    input: UpdateProjectInput,
  ): Promise<RepositoryResult<ProjectRecord>> {
    const { data, error } = await this.supabase
      .from('projects')
      .update({
        title: input.title,
        description: input.description ?? null,
      })
      .eq('id', input.projectId)
      .eq('owner_id', ownerId)
      .is('deleted_at', null)
      .select(PROJECT_COLUMNS)
      .maybeSingle();

    if (error) {
      return persistenceError();
    }

    if (!data) {
      return notFound();
    }

    return { ok: true, data: mapProject(data) };
  }

  async setArchived(
    ownerId: string,
    projectId: string,
    archived: boolean,
  ): Promise<RepositoryResult<ProjectRecord>> {
    const { data, error } = await this.supabase
      .from('projects')
      .update({
        archived_at: archived ? new Date().toISOString() : null,
      })
      .eq('id', projectId)
      .eq('owner_id', ownerId)
      .is('deleted_at', null)
      .select(PROJECT_COLUMNS)
      .maybeSingle();

    if (error) {
      return persistenceError();
    }

    if (!data) {
      return notFound();
    }

    return { ok: true, data: mapProject(data) };
  }

  async duplicate(
    ownerId: string,
    projectId: string,
    title: string,
  ): Promise<RepositoryResult<ProjectRecord>> {
    const source = await this.getById(ownerId, projectId);

    if (!source.ok) {
      return source;
    }

    const { data, error } = await this.supabase
      .from('projects')
      .insert({
        owner_id: ownerId,
        title,
        description: source.data.description,
        archived_at: null,
        deleted_at: null,
      })
      .select(PROJECT_COLUMNS)
      .single();

    if (error || !data) {
      return persistenceError();
    }

    return { ok: true, data: mapProject(data) };
  }

  async softDelete(ownerId: string, projectId: string): Promise<RepositoryResult<void>> {
    const { error } = await this.supabase.rpc('prompt_pilot_soft_delete_project', {
      project_id: projectId,
    });

    if (error) {
      if (error.code === 'P0002') {
        return notFound();
      }

      return persistenceError();
    }

    return { ok: true, data: undefined };
  }
}

export function createSupabaseProjectRepository(
  supabase: SupabaseClient<Database>,
): ProjectRepository {
  return new SupabaseProjectRepository(supabase);
}
