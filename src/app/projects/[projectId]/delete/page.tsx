import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/layout/section-heading';
import { ProjectActionForm } from '@/components/projects/project-action-form';
import { projectIdSchema } from '@/domain/project';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/require-user';
import { createProjectService } from '@/server/projects/project-service';
import { createSupabaseProjectRepository } from '@/server/projects/supabase-project-repository';

type ProjectDeletePageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDeletePage({ params }: ProjectDeletePageProps) {
  const user = await requireUser({ redirectTo: '/projects' });
  const { projectId } = await params;

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

  return (
    <main id="main-content" className="flex-1 py-10">
      <PageContainer className="max-w-xl space-y-6">
        <SectionHeading
          headingLevel={1}
          title="Delete project"
          description="This removes the project from your dashboard. Prompt Pilot does not delete external media."
        />

        <div className="rounded-lg border border-border p-4">
          <p className="font-medium text-foreground">{project.title}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            The project will be removed from normal project access. This action uses soft deletion
            and cannot be undone from the dashboard in Phase 5.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ProjectActionForm
            projectId={project.id}
            action="soft-delete"
            label="Confirm delete"
            pendingText="Deleting..."
            variant="destructive"
          />
          <Button asChild variant="outline">
            <Link href={`/projects/${project.id}`}>Cancel</Link>
          </Button>
        </div>
      </PageContainer>
    </main>
  );
}
