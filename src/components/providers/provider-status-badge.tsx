import { Badge } from '@/components/ui/badge';
import type { LifecycleStatus } from '@/domain/providerCatalogue';

const lifecycleLabels: Record<LifecycleStatus, string> = {
  active: 'Active',
  preview: 'Preview',
  limited: 'Limited',
  sunsetting: 'Sunsetting',
  deprecated: 'Deprecated',
  unavailable: 'Unavailable',
  unknown: 'Unknown',
};

const lifecycleVariants: Record<
  LifecycleStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  active: 'default',
  preview: 'secondary',
  limited: 'outline',
  sunsetting: 'destructive',
  deprecated: 'destructive',
  unavailable: 'destructive',
  unknown: 'outline',
};

type ProviderStatusBadgeProps = {
  status: LifecycleStatus;
};

export function ProviderStatusBadge({ status }: ProviderStatusBadgeProps) {
  return (
    <Badge variant={lifecycleVariants[status]}>
      {lifecycleLabels[status]}
    </Badge>
  );
}
