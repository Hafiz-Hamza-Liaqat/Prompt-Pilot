import { Badge } from '@/components/ui/badge';
import { EVALUATION_STATE_LABELS } from '@/config/result-workspace';
import type { EvaluationState } from '@/domain/mockResultWorkspace';

type WorkspaceEvaluationBadgeProps = {
  state: EvaluationState;
};

export function WorkspaceEvaluationBadge({ state }: WorkspaceEvaluationBadgeProps) {
  return <Badge variant="outline">{EVALUATION_STATE_LABELS[state]}</Badge>;
}
