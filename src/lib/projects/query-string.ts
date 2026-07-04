import type { ProjectDashboardQuery } from '@/domain/project';

export function buildProjectQueryString(
  query: Partial<ProjectDashboardQuery> & { notice?: string },
): string {
  const params = new URLSearchParams();

  if (query.search) {
    params.set('search', query.search);
  }

  if (query.status && query.status !== 'active') {
    params.set('status', query.status);
  }

  if (query.sort && query.sort !== 'updated_desc') {
    params.set('sort', query.sort);
  }

  if (query.page && query.page > 1) {
    params.set('page', String(query.page));
  }

  if (query.notice) {
    params.set('notice', query.notice);
  }

  const value = params.toString();
  return value ? `?${value}` : '';
}
