import { PageContainer } from '@/components/layout/page-container';
import { ProviderCard } from '@/components/providers/provider-card';
import { ProviderEmptyState } from '@/components/providers/provider-empty-state';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { providerCataloguePublicCopy } from '@/config/providerCatalogue';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createProviderCatalogueService } from '@/server/providers/provider-catalogue-service';
import { createSupabaseProviderCatalogueRepository } from '@/server/providers/supabase-provider-catalogue-repository';

export const metadata = {
  title: 'AI Video Providers | Prompt Pilot',
  description:
    'Source-backed catalogue snapshot of approved AI video providers for Prompt Pilot planning.',
};

export default async function ProvidersPage() {
  let listResult;

  try {
    const supabase = await createSupabaseServerClient();
    const service = createProviderCatalogueService(
      createSupabaseProviderCatalogueRepository(supabase),
    );
    listResult = await service.listProviders();
  } catch {
    return (
      <PageContainer className="py-12">
        <ProviderEmptyState />
      </PageContainer>
    );
  }

  if (!listResult.ok) {
    return (
      <PageContainer className="py-12">
        <ProviderEmptyState />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-12">
      <div className="max-w-4xl space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            AI video provider catalogue
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            {providerCataloguePublicCopy.pageDescription}
          </p>
        </div>

        <Alert>
          <AlertTitle>Catalogue disclaimer</AlertTitle>
          <AlertDescription>
            {providerCataloguePublicCopy.disclaimerLead}{' '}
            {providerCataloguePublicCopy.disclaimerBody}
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          {listResult.data.map((item) => (
            <ProviderCard key={item.provider.id} item={item} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
