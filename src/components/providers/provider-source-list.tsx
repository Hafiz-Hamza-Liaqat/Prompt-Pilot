import { ExternalLink } from 'lucide-react';
import type { CatalogueSource } from '@/domain/providerCatalogue';

type ProviderSourceListProps = {
  sources: CatalogueSource[];
};

export function ProviderSourceList({ sources }: ProviderSourceListProps) {
  if (sources.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No official sources are recorded for this provider.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {sources.map((source) => (
        <li key={source.id}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand no-underline hover:text-brand/80"
          >
            {source.title}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
          <p className="text-xs text-muted-foreground">{source.sourceKind.replace('_', ' ')}</p>
        </li>
      ))}
    </ul>
  );
}
