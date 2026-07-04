import { Badge } from '@/components/ui/badge';
import type { CatalogueCapabilityFact } from '@/domain/providerCatalogue';

const supportLabels = {
  supported: 'Supported',
  limited: 'Limited',
  unsupported: 'Unsupported',
  unknown: 'Not verified',
} as const;

const supportVariants = {
  supported: 'default',
  limited: 'outline',
  unsupported: 'destructive',
  unknown: 'secondary',
} as const;

function formatCapabilityLabel(key: string): string {
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatFactValue(fact: CatalogueCapabilityFact): string | null {
  if (fact.numericValue !== null) {
    return String(fact.numericValue);
  }

  if (Array.isArray(fact.structuredValue)) {
    return fact.structuredValue.join(', ');
  }

  if (fact.textValue) {
    return fact.textValue;
  }

  return null;
}

type CapabilityFactListProps = {
  facts: CatalogueCapabilityFact[];
};

export function CapabilityFactList({ facts }: CapabilityFactListProps) {
  if (facts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No verified capability facts are recorded for this offering yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {facts.map((fact) => {
        const value = formatFactValue(fact);

        return (
          <li key={fact.id} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {formatCapabilityLabel(fact.capabilityKey)}
              </span>
              <Badge variant={supportVariants[fact.supportLevel]}>
                {supportLabels[fact.supportLevel]}
              </Badge>
            </div>
            {value ? (
              <p className="mt-1 text-sm text-muted-foreground">Value: {value}</p>
            ) : null}
            <p className="mt-2 text-sm text-muted-foreground">{fact.evidenceSummary}</p>
            {fact.limitationSummary ? (
              <p className="mt-1 text-sm text-foreground">{fact.limitationSummary}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
