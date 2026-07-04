import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/layout/section-heading';
import { ProjectActionForm } from '@/components/projects/project-action-form';
import { ProjectEditForm } from '@/components/projects/project-edit-form';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import {
  deriveProjectStatus,
  isProjectNotice,
  projectIdSchema,
  PROJECT_NOTICE_MESSAGES,
} from '@/domain/project';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/require-user';
import { createProjectService } from '@/server/projects/project-service';
import { createSupabaseProjectRepository } from '@/server/projects/supabase-project-repository';

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ notice?: string }>;
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const user = await requireUser({ redirectTo: '/projects' });
  const { projectId } = await params;
  const query = await searchParams;

  if (!projectIdSchema.safeParse(projectId).success) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const service = createProjectService(createSupabaseProjectRepository(supabase));
  const result = await service.getById(user.id, projectId);

  if (!result.ok) {
    notFound();
  }

  const project = result.data;
  const status = deriveProjectStatus(project.archivedAt);
  const notice = isProjectNotice(query.notice) ? query.notice : undefined;

  return (
    <main id="main-content" className="flex-1 py-10">
      <PageContainer className="max-w-3xl space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/projects">Back to projects</Link>
          </Button>
        </div>

        <SectionHeading
          headingLevel={1}
          title={project.title}
          description="Project container for future planning workflows."
        />

        {notice ? (
          <Alert>
            <AlertTitle>Project update</AlertTitle>
            <AlertDescription>{PROJECT_NOTICE_MESSAGES[notice]}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusBadge project={project} />
          </div>
          <p className="text-sm text-muted-foreground">
            {project.description ?? 'No description provided.'}
          </p>
          <p className="text-sm text-muted-foreground">
            Created {new Date(project.createdAt).toLocaleDateString()} · Updated{' '}
            {new Date(project.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <Alert>
          <AlertTitle>Phase 6 preview</AlertTitle>
          <AlertDescription>
            Guided video brief creation begins in Phase 6. Prompt Pilot still does not generate
            videos or images.
          </AlertDescription>
        </Alert>

        <ProjectEditForm
          projectId={project.id}
          title={project.title}
          description={project.description}
        />

        <div className="flex flex-wrap gap-3">
          {status === 'active' ? (
            <ProjectActionForm
              projectId={project.id}
              action="archive"
              label="Archive project"
              pendingText="Archiving..."
            />
          ) : (
            <ProjectActionForm
              projectId={project.id}
              action="restore"
              label="Restore project"
              pendingText="Restoring..."
            />
          )}
          <ProjectActionForm
            projectId={project.id}
            action="duplicate"
            label="Duplicate project"
            pendingText="Duplicating..."
          />
          <Button asChild variant="destructive">
            <Link href={`/projects/${project.id}/delete`}>Delete project</Link>
          </Button>
        </div>
      </PageContainer>
    </main>
  );
}
