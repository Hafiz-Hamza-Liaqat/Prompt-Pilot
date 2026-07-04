import { notFound, redirect } from 'next/navigation';
import { deriveProjectStatus, projectIdSchema } from '@/domain/project';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/require-user';
import { createVideoBriefService } from '@/server/briefs/video-brief-service';
import { createSupabaseVideoBriefRepository } from '@/server/briefs/supabase-video-brief-repository';
import { createProjectService } from '@/server/projects/project-service';
import { createSupabaseProjectRepository } from '@/server/projects/supabase-project-repository';

type BriefIndexPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function BriefIndexPage({ params }: BriefIndexPageProps) {
  const user = await requireUser({ redirectTo: '/projects' });
  const { projectId } = await params;

  if (!projectIdSchema.safeParse(projectId).success) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const projectService = createProjectService(createSupabaseProjectRepository(supabase));
  const projectResult = await projectService.getById(user.id, projectId);

  if (!projectResult.ok) {
    notFound();
  }

  const project = projectResult.data;

  if (deriveProjectStatus(project.archivedAt) === 'archived') {
    redirect(`/projects/${projectId}?notice=project-archived`);
  }

  const briefService = createVideoBriefService(createSupabaseVideoBriefRepository(supabase));
  const briefResult = await briefService.getByProjectId(user.id, projectId);

  if (!briefResult.ok) {
    if (briefResult.status === 'not_found') {
      redirect(`/projects/${projectId}/brief/source`);
    }

    notFound();
  }

  redirect(`/projects/${projectId}/brief/${briefResult.data.firstIncompleteStep}`);
}
