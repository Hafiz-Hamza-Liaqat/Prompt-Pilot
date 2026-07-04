import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ProviderCatalogueListItem } from '@/server/providers/provider-catalogue-service';
import { ProviderAccessBadge } from './provider-access-badge';
import { ProviderFreshnessBadge } from './provider-freshness-badge';
import { ProviderStatusBadge } from './provider-status-badge';

type ProviderCardProps = {
  item: ProviderCatalogueListItem;
};

export function ProviderCard({ item }: ProviderCardProps) {
  const { provider, offeringCount, freshness } = item;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl">
            <Link
              href={`/providers/${provider.id}`}
              className="text-foreground no-underline hover:text-brand"
            >
              {provider.displayName}
            </Link>
          </CardTitle>
          <ProviderStatusBadge status={provider.lifecycleStatus} />
          <ProviderAccessBadge status={provider.apiAccessStatus} />
          <ProviderFreshnessBadge freshness={freshness} />
        </div>
        <CardDescription>{provider.vendorName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">{provider.summary}</p>
        <p className="text-sm text-foreground">
          {offeringCount} catalogue {offeringCount === 1 ? 'offering' : 'offerings'}
        </p>
      </CardContent>
    </Card>
  );
}
