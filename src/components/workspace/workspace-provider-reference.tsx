import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProviderAccessBadge } from '@/components/providers/provider-access-badge';
import { ProviderFreshnessBadge } from '@/components/providers/provider-freshness-badge';
import { ProviderStatusBadge } from '@/components/providers/provider-status-badge';
import { ProviderCatalogueNotice } from '@/components/providers/provider-catalogue-notice';
import { WORKSPACE_TRUTHFULNESS_NOTICES } from '@/config/result-workspace';
import type { MockResultWorkspaceViewModel } from '@/domain/mockResultWorkspace';
import type {
  ApiAccessStatus,
  FreshnessState,
  LifecycleStatus,
} from '@/domain/providerCatalogue';
import { WorkspaceCatalogueReferenceBadge } from './workspace-sample-badge';

type WorkspaceProviderReferenceProps = {
  providers: MockResultWorkspaceViewModel['providers'];
};

export function WorkspaceProviderReference({ providers }: WorkspaceProviderReferenceProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>{WORKSPACE_TRUTHFULNESS_NOTICES.providerPanelLabel}</AlertTitle>
        <AlertDescription>{WORKSPACE_TRUTHFULNESS_NOTICES.providerUnevaluatedNotice}</AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">
                  <Link
                    href={`/providers/${provider.id}`}
                    className="text-foreground no-underline hover:text-brand"
                  >
                    {provider.displayName}
                  </Link>
                </CardTitle>
                <WorkspaceCatalogueReferenceBadge />
                <ProviderStatusBadge status={provider.lifecycleStatus as LifecycleStatus} />
                <ProviderAccessBadge status={provider.apiAccessStatus as ApiAccessStatus} />
                <ProviderFreshnessBadge freshness={provider.freshness as FreshnessState} />
              </div>
              <CardDescription>Catalogue reference only — not a recommendation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProviderCatalogueNotice
                notice={provider.catalogueNotice}
                lifecycleStatus={provider.lifecycleStatus}
                sunsetAt={provider.sunsetAt}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
