import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ProjectRecord } from '@/domain/project';
import { ProjectStatusBadge } from './project-status-badge';

type ProjectCardProps = {
  project: ProjectRecord;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">
            <Link href={`/projects/${project.id}`} className="no-underline hover:text-brand">
              {project.title}
            </Link>
          </CardTitle>
          <ProjectStatusBadge project={project} />
        </div>
        {project.description ? (
          <CardDescription>{project.description}</CardDescription>
        ) : (
          <CardDescription>No description yet.</CardDescription>
        )}
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Updated {new Date(project.updatedAt).toLocaleDateString()}
      </CardContent>
    </Card>
  );
}
