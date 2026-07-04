import { Badge } from '@/components/ui/badge';
import type { ApiAccessStatus } from '@/domain/providerCatalogue';

const accessLabels: Record<ApiAccessStatus, string> = {
  public: 'Public API',
  preview: 'Preview API',
  limited: 'Limited API',
  enterprise: 'Enterprise API',
  sunsetting: 'Sunsetting API',
  unavailable: 'Unavailable API',
  unknown: 'Unknown API access',
};

type ProviderAccessBadgeProps = {
  status: ApiAccessStatus;
};

export function ProviderAccessBadge({ status }: ProviderAccessBadgeProps) {
  return <Badge variant="outline">{accessLabels[status]}</Badge>;
}
