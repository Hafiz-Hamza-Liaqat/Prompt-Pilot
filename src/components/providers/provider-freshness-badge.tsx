import { Badge } from '@/components/ui/badge';
import type { FreshnessState } from '@/domain/providerCatalogue';

const freshnessLabels: Record<FreshnessState, string> = {
  fresh: 'Fresh',
  due_soon: 'Review due soon',
  overdue: 'Review overdue',
};

const freshnessVariants: Record<
  FreshnessState,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  fresh: 'secondary',
  due_soon: 'outline',
  overdue: 'destructive',
};

type ProviderFreshnessBadgeProps = {
  freshness: FreshnessState;
};

export function ProviderFreshnessBadge({ freshness }: ProviderFreshnessBadgeProps) {
  return (
    <Badge variant={freshnessVariants[freshness]}>
      {freshnessLabels[freshness]}
    </Badge>
  );
}

type ProviderFreshnessDatesProps = {
  verifiedAt: string;
  reviewDueAt: string;
};

export function ProviderFreshnessDates({
  verifiedAt,
  reviewDueAt,
}: ProviderFreshnessDatesProps) {
  const verified = new Date(verifiedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const reviewDue = new Date(reviewDueAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <p className="text-sm text-muted-foreground">
      Verified {verified}. Review due {reviewDue}.
    </p>
  );
}
