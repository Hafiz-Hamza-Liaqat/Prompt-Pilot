import { Badge } from '@/components/ui/badge';
import {
  WORKSPACE_CATALOGUE_REFERENCE_LABEL,
  WORKSPACE_INTERFACE_PREVIEW_LABEL,
  WORKSPACE_SAMPLE_BADGE_LABEL,
} from '@/config/result-workspace';

type WorkspaceSampleBadgeProps = {
  label?: typeof WORKSPACE_SAMPLE_BADGE_LABEL | typeof WORKSPACE_INTERFACE_PREVIEW_LABEL;
};

export function WorkspaceSampleBadge({
  label = WORKSPACE_SAMPLE_BADGE_LABEL,
}: WorkspaceSampleBadgeProps) {
  return <Badge variant="secondary">{label}</Badge>;
}

export function WorkspaceCatalogueReferenceBadge() {
  return <Badge variant="outline">{WORKSPACE_CATALOGUE_REFERENCE_LABEL}</Badge>;
}
