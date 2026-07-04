import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/layout/section-heading';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectCreateForm } from '@/components/projects/project-create-form';
import { ProjectEmptyState } from '@/components/projects/project-empty-state';
import {
  ProjectPagination,
  ProjectQueryControls,
} from '@/components/projects/project-query-controls';
import {
  isProjectNotice,
  parseProjectDashboardQuery,
  PROJECT_NOTICE_MESSAGES,
} from '@/domain/project';
import { deriveBriefStatus, type BriefStatus } from '@/domain/videoBriefDraft';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/require-user';
import { createProjectService } from '@/server/projects/project-service';
import { createSupabaseProjectRepository } from '@/server/projects/supabase-project-repository';

type ProjectsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getEmptyState(query: ReturnType<typeof parseProjectDashboardQuery>, totalProjects: number) {
  if (query.search) {
    return {
      title: 'No matching projects',
      description: 'Try a different search term or clear the filters.',
    };
  }

  if (totalProjects === 0) {
    return {
      title: 'No projects yet',
      description: 'Create your first project container to prepare for Phase 6 planning workflows.',
    };
  }

  if (query.status === 'archived') {
    return {
      title: 'No archived projects',
      description: 'Archived projects will appear here when you archive them from a project page.',
    };
  }

  return {
    title: 'No active projects',
    description: 'Restore an archived project or create a new one to continue.',
  };
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const user = await requireUser({ redirectTo: '/projects' });
  const params = await searchParams;
  const query = parseProjectDashboardQuery(params);
  const noticeParam = Array.isArray(params.notice) ? params.notice[0] : params.notice;
  const notice = isProjectNotice(noticeParam) ? noticeParam : undefined;

  const supabase = await createSupabaseServerClient();
  const service = createProjectService(createSupabaseProjectRepository(supabase));
  const listResult = await service.list(user.id, query);

  if (!listResult.ok) {
    return (
      <main id="main-content" className="flex-1 py-10">
        <PageContainer>
          <Alert variant="destructive">
            <AlertTitle>Unable to load projects</AlertTitle>
            <AlertDescription>Try refreshing the page.</AlertDescription>
          </Alert>
        </PageContainer>
      </main>
    );
  }

  const { projects, totalMatching, totalPages, activeCount, archivedCount } = listResult.data;

  const projectIds = projects.map((project) => project.id);
  const briefStatusByProjectId = new Map<string, BriefStatus>();

  if (projectIds.length > 0) {
    const { data: briefRows } = await supabase
      .from('video_briefs')
      .select('project_id, completed_at')
      .in('project_id', projectIds);

    for (const projectId of projectIds) {
      briefStatusByProjectId.set(projectId, 'not_started');
    }

    for (const row of briefRows ?? []) {
      briefStatusByProjectId.set(
        row.project_id,
        deriveBriefStatus({
          id: row.project_id,
          projectId: row.project_id,
          completedAt: row.completed_at,
          createdAt: '',
          updatedAt: '',
        }),
      );
    }
  }

  const totalProjects = activeCount + archivedCount;
  const emptyState = getEmptyState(query, totalProjects);

  return (
    <main id="main-content" className="flex-1 py-10">
      <PageContainer className="space-y-8">
        <SectionHeading
          headingLevel={1}
          title="Projects"
          description="Manage your Prompt Pilot project containers. Video brief workflows begin in Phase 6."
        />

        {notice ? (
          <Alert>
            <AlertTitle>Project update</AlertTitle>
            <AlertDescription>{PROJECT_NOTICE_MESSAGES[notice]}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-semibold">{activeCount}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Archived</p>
            <p className="text-2xl font-semibold">{archivedCount}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold">{totalProjects}</p>
          </div>
        </div>

        <ProjectCreateForm />
        <ProjectQueryControls query={query} />

        {projects.length === 0 ? (
          <ProjectEmptyState title={emptyState.title} description={emptyState.description} />
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                briefStatus={briefStatusByProjectId.get(project.id) ?? 'not_started'}
              />
            ))}
          </div>
        )}

        <ProjectPagination query={query} totalPages={totalPages} />
        <p className="text-sm text-muted-foreground">
          Showing {projects.length} of {totalMatching} matching projects.
        </p>
      </PageContainer>
    </main>
  );
}
