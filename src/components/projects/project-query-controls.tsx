import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PROJECT_SORT_OPTIONS,
  PROJECT_STATUS_FILTERS,
  type ProjectDashboardQuery,
} from '@/domain/project';
import { buildProjectQueryString } from '@/lib/projects/query-string';

type ProjectQueryControlsProps = {
  query: ProjectDashboardQuery;
};

export function ProjectQueryControls({ query }: ProjectQueryControlsProps) {
  return (
    <form method="get" className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-4">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          name="search"
          defaultValue={query.search ?? ''}
          placeholder="Search title or description"
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={query.status}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          {PROJECT_STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort">Sort</Label>
        <select
          id="sort"
          name="sort"
          defaultValue={query.sort}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          {PROJECT_SORT_OPTIONS.map((sort) => (
            <option key={sort} value={sort}>
              {sort.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-4">
        <Button type="submit">Apply filters</Button>
      </div>
    </form>
  );
}

type ProjectPaginationProps = {
  query: ProjectDashboardQuery;
  totalPages: number;
};

export function ProjectPagination({ query, totalPages }: ProjectPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const previousPage = Math.max(1, query.page - 1);
  const nextPage = Math.min(totalPages, query.page + 1);

  return (
    <nav aria-label="Project pagination" className="flex items-center gap-3">
      {query.page > 1 ? (
        <Link
          href={`/projects${buildProjectQueryString({ ...query, page: previousPage })}`}
          className="text-sm font-medium text-brand no-underline hover:underline"
        >
          Previous
        </Link>
      ) : null}
      <span className="text-sm text-muted-foreground">
        Page {query.page} of {totalPages}
      </span>
      {query.page < totalPages ? (
        <Link
          href={`/projects${buildProjectQueryString({ ...query, page: nextPage })}`}
          className="text-sm font-medium text-brand no-underline hover:underline"
        >
          Next
        </Link>
      ) : null}
    </nav>
  );
}
