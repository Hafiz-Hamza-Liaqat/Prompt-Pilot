import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BriefStatusBadge } from '@/components/briefs/brief-status-badge';
import type { BriefStatus } from '@/domain/videoBriefDraft';
import { deriveProjectStatus, type ProjectRecord } from '@/domain/project';
import { getProjectCardPrimaryAction } from '@/lib/projects/project-card-action';
import { ProjectStatusBadge } from './project-status-badge';

type ProjectCardProps = {
  project: ProjectRecord;
  briefStatus: BriefStatus;
};

export function ProjectCard({ project, briefStatus }: ProjectCardProps) {
  const projectStatus = deriveProjectStatus(project.archivedAt);
  const primaryAction = getProjectCardPrimaryAction(project.id, projectStatus, briefStatus);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">
            <Link
              href={`/projects/${project.id}`}
              className="no-underline hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              {project.title}
            </Link>
          </CardTitle>
          <ProjectStatusBadge project={project} />
          <BriefStatusBadge status={briefStatus} />
        </div>
        {project.description ? (
          <CardDescription>{project.description}</CardDescription>
        ) : (
          <CardDescription>No description yet.</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>Updated {new Date(project.updatedAt).toLocaleDateString()}</p>
        <Button asChild size="sm">
          <Link href={primaryAction.href}>{primaryAction.label}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
