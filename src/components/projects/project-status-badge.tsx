import { Badge } from '@/components/ui/badge';
import { deriveProjectStatus, type ProjectRecord } from '@/domain/project';

type ProjectStatusBadgeProps = {
  project: Pick<ProjectRecord, 'archivedAt'>;
};

export function ProjectStatusBadge({ project }: ProjectStatusBadgeProps) {
  const status = deriveProjectStatus(project.archivedAt);

  return (
    <Badge variant={status === 'archived' ? 'secondary' : 'default'}>
      {status === 'archived' ? 'Archived' : 'Active'}
    </Badge>
  );
}
