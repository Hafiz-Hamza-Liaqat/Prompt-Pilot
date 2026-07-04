import { redirect, notFound } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { projectIdSchema } from '@/domain/project';
import { mockResultWorkspaceFixture } from '@/fixtures/mock-result-workspace';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/require-user';
import { createSupabaseVideoBriefRepository } from '@/server/briefs/supabase-video-brief-repository';
import { createSupabaseProjectRepository } from '@/server/projects/supabase-project-repository';
import { createSupabaseProviderCatalogueRepository } from '@/server/providers/supabase-provider-catalogue-repository';
import { createMockResultWorkspaceService } from '@/server/workspace/mock-result-workspace-service';

export const metadata = {
  title: 'Result workspace preview | Prompt Pilot',
  description:
    'Read-only preview of future Prompt Pilot planning output using static sample layouts and real brief context.',
};

type WorkspacePageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ section?: string }>;
};

export default async function ProjectWorkspacePage({ params, searchParams }: WorkspacePageProps) {
  const { projectId } = await params;
  const query = await searchParams;

  if (!projectIdSchema.safeParse(projectId).success) {
    notFound();
  }

  const user = await requireUser({
    redirectTo: `/projects/${projectId}/workspace`,
  });

  const supabase = await createSupabaseServerClient();
  const service = createMockResultWorkspaceService({
    projectRepository: createSupabaseProjectRepository(supabase),
    briefRepository: createSupabaseVideoBriefRepository(supabase),
    providerCatalogueRepository: createSupabaseProviderCatalogueRepository(supabase),
    fixture: mockResultWorkspaceFixture,
  });

  const result = await service.loadWorkspace(user.id, projectId, query.section);

  if (!result.ok) {
    if (result.code === 'not_found') {
      notFound();
    }

    if (result.code === 'brief_required') {
      redirect(`/projects/${projectId}?notice=brief-required`);
    }

    notFound();
  }

  return (
    <main id="main-content" className="flex-1 py-10">
      <PageContainer className="max-w-5xl">
        <WorkspaceShell workspace={result.data} />
      </PageContainer>
    </main>
  );
}
