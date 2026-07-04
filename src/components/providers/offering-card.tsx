import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { CatalogueOffering } from '@/domain/providerCatalogue';
import { ProviderAccessBadge } from './provider-access-badge';
import { ProviderStatusBadge } from './provider-status-badge';
import { CapabilityFactList } from './capability-fact-list';
import type { CatalogueCapabilityFact } from '@/domain/providerCatalogue';

const ownershipLabels = {
  first_party: 'First-party',
  third_party_hosted: 'Third-party hosted',
} as const;

type OfferingCardProps = {
  offering: CatalogueOffering;
  facts: CatalogueCapabilityFact[];
};

export function OfferingCard({ offering, facts }: OfferingCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">{offering.displayName}</CardTitle>
          <Badge variant="secondary">{offering.offeringType.replace('_', ' ')}</Badge>
          <Badge variant="outline">{ownershipLabels[offering.ownershipType]}</Badge>
          <ProviderStatusBadge status={offering.lifecycleStatus} />
          <ProviderAccessBadge status={offering.apiAccessStatus} />
        </div>
        <CardDescription>
          {offering.officialIdentifier
            ? `Official identifier: ${offering.officialIdentifier}`
            : 'No official model identifier (service offering)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{offering.summary}</p>
        <CapabilityFactList facts={facts} />
      </CardContent>
    </Card>
  );
}
