import { z } from 'zod';

export const PROJECT_STATUSES = ['active', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_FILTERS = ['active', 'archived', 'all'] as const;
export type ProjectStatusFilter = (typeof PROJECT_STATUS_FILTERS)[number];

export const PROJECT_SORT_OPTIONS = [
  'updated_desc',
  'created_desc',
  'title_asc',
  'title_desc',
] as const;
export type ProjectSortOption = (typeof PROJECT_SORT_OPTIONS)[number];

export const PROJECT_PAGE_SIZE = 12 as const;

export const PROJECT_ACTION_STATUSES = [
  'idle',
  'success',
  'validation_error',
  'not_authenticated',
  'not_found',
  'forbidden',
  'conflict',
  'persistence_error',
] as const;
export type ProjectActionStatus = (typeof PROJECT_ACTION_STATUSES)[number];

export const PROJECT_NOTICES = {
  created: 'created',
  updated: 'updated',
  archived: 'archived',
  restored: 'restored',
  duplicated: 'duplicated',
  deleted: 'deleted',
} as const;
export type ProjectNotice = (typeof PROJECT_NOTICES)[keyof typeof PROJECT_NOTICES];

export const PROJECT_NOTICE_MESSAGES: Record<ProjectNotice, string> = {
  created: 'Project created successfully.',
  updated: 'Project updated successfully.',
  archived: 'Project archived.',
  restored: 'Project restored.',
  duplicated: 'Project duplicated.',
  deleted: 'Project removed from your dashboard.',
};

const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;

export const projectTitleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required.')
  .max(120, 'Title must be 120 characters or fewer.')
  .refine((value) => !CONTROL_CHAR_PATTERN.test(value), {
    message: 'Title contains invalid characters.',
  });

export const projectDescriptionSchema = z.preprocess(
  (value) => (value === undefined || value === null ? '' : value),
  z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer.')
    .refine((val) => !CONTROL_CHAR_PATTERN.test(val), {
      message: 'Description contains invalid characters.',
    })
    .transform((value) => (value.length === 0 ? null : value)),
);

export const projectIdSchema = z.string().uuid('Project ID must be a valid UUID.');

export const projectSearchSchema = z
  .string()
  .trim()
  .max(100, 'Search must be 100 characters or fewer.')
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const projectStatusFilterSchema = z
  .enum(PROJECT_STATUS_FILTERS)
  .default('active');

export const projectSortSchema = z.enum(PROJECT_SORT_OPTIONS).default('updated_desc');

export const projectPageSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(10000)
  .default(1);

export const projectDashboardQuerySchema = z.object({
  search: projectSearchSchema,
  status: projectStatusFilterSchema,
  sort: projectSortSchema,
  page: projectPageSchema,
});

export type ProjectDashboardQuery = z.infer<typeof projectDashboardQuerySchema>;

export const createProjectInputSchema = z.object({
  title: projectTitleSchema,
  description: projectDescriptionSchema,
});

export const updateProjectInputSchema = z.object({
  projectId: projectIdSchema,
  title: projectTitleSchema,
  description: projectDescriptionSchema,
});

export const projectMutationIdSchema = z.object({
  projectId: projectIdSchema,
});

export type ProjectTitle = z.infer<typeof projectTitleSchema>;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

export function deriveProjectStatus(archivedAt: string | null): ProjectStatus {
  return archivedAt ? 'archived' : 'active';
}

export function buildDuplicateTitle(originalTitle: string): string {
  const suffix = ' (Copy)';
  const trimmed = originalTitle.trim();
  const maxBaseLength = 120 - suffix.length;

  if (trimmed.length <= maxBaseLength) {
    return `${trimmed}${suffix}`;
  }

  return `${trimmed.slice(0, maxBaseLength).trimEnd()}${suffix}`;
}

export function parseProjectDashboardQuery(
  input: Record<string, string | string[] | undefined>,
): ProjectDashboardQuery {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const parsed = projectDashboardQuerySchema.safeParse({
    search: first(input.search),
    status: first(input.status),
    sort: first(input.sort),
    page: first(input.page),
  });

  if (parsed.success) {
    return parsed.data;
  }

  return projectDashboardQuerySchema.parse({});
}

export function isProjectNotice(value: string | null | undefined): value is ProjectNotice {
  if (!value) {
    return false;
  }

  return Object.values(PROJECT_NOTICES).includes(value as ProjectNotice);
}

export function isProjectActionStatus(value: string): value is ProjectActionStatus {
  return PROJECT_ACTION_STATUSES.includes(value as ProjectActionStatus);
}

export type ProjectRecord = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectListResult = {
  projects: ProjectRecord[];
  totalMatching: number;
  page: number;
  totalPages: number;
  activeCount: number;
  archivedCount: number;
};
