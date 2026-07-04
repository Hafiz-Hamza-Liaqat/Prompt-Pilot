import { Badge } from '@/components/ui/badge';
import { deriveBriefStatus, type PartialVideoBriefDraft } from '@/domain/videoBriefDraft';

type BriefStatusBadgeProps = {
  draft: PartialVideoBriefDraft | null;
};

const STATUS_LABELS = {
  not_started: 'Not started',
  draft: 'Draft',
  ready: 'Ready',
} as const;

export function BriefStatusBadge({ draft }: BriefStatusBadgeProps) {
  const status = deriveBriefStatus(draft);

  return (
    <Badge variant={status === 'ready' ? 'default' : 'secondary'}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
