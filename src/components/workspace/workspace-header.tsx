import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import type { MockResultWorkspaceViewModel } from '@/domain/mockResultWorkspace';
import type { ProjectRecord } from '@/domain/project';

type WorkspaceHeaderProps = {
  project: MockResultWorkspaceViewModel['project'];
  briefTitle: string;
};

export function WorkspaceHeader({ project, briefTitle }: WorkspaceHeaderProps) {
  const projectForBadge = {
    id: project.id,
    ownerId: '00000000-0000-4000-8000-000000000000',
    title: project.title,
    description: project.description,
    archivedAt: project.status === 'archived' ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } satisfies ProjectRecord;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${project.id}`}>Back to project</Link>
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Result workspace preview
          </h1>
          <ProjectStatusBadge project={projectForBadge} />
        </div>
        <p className="text-base text-muted-foreground">{project.title}</p>
        <p className="text-sm text-muted-foreground">Brief: {briefTitle}</p>
        {project.status === 'archived' ? (
          <p className="text-sm text-foreground">
            This archived project workspace is read-only. No planning output is persisted.
          </p>
        ) : null}
      </div>
    </div>
  );
}
