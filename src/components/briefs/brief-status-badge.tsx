import { Badge } from '@/components/ui/badge';
import {
  deriveBriefStatus,
  type BriefStatus,
  type PartialVideoBriefDraft,
} from '@/domain/videoBriefDraft';

type BriefStatusBadgeProps = {
  draft?: PartialVideoBriefDraft | null;
  status?: BriefStatus;
};

const STATUS_LABELS = {
  not_started: 'Not started',
  draft: 'Draft',
  ready: 'Ready',
} as const;

export function BriefStatusBadge({ draft = null, status }: BriefStatusBadgeProps) {
  const resolvedStatus = status ?? deriveBriefStatus(draft);

  return (
    <Badge variant={resolvedStatus === 'ready' ? 'default' : 'secondary'}>
      {STATUS_LABELS[resolvedStatus]}
    </Badge>
  );
}
