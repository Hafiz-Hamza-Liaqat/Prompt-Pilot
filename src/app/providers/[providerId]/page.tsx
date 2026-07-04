import { notFound } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { OfferingCard } from '@/components/providers/offering-card';
import { ProviderAccessBadge } from '@/components/providers/provider-access-badge';
import { ProviderCatalogueNotice } from '@/components/providers/provider-catalogue-notice';
import { ProviderEmptyState } from '@/components/providers/provider-empty-state';
import {
  ProviderFreshnessBadge,
  ProviderFreshnessDates,
} from '@/components/providers/provider-freshness-badge';
import { ProviderSourceList } from '@/components/providers/provider-source-list';
import { ProviderStatusBadge } from '@/components/providers/provider-status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AiVideoProviderSchema } from '@/domain/constants';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createProviderCatalogueService } from '@/server/providers/provider-catalogue-service';
import { createSupabaseProviderCatalogueRepository } from '@/server/providers/supabase-provider-catalogue-repository';

type ProviderDetailPageProps = {
  params: Promise<{ providerId: string }>;
};

export async function generateMetadata({ params }: ProviderDetailPageProps) {
  const { providerId } = await params;
  const parsed = AiVideoProviderSchema.safeParse(providerId);

  if (!parsed.success) {
    return { title: 'Provider not found | Prompt Pilot' };
  }

  return {
    title: `${parsed.data.replace('_', ' ')} | Prompt Pilot Providers`,
  };
}

export default async function ProviderDetailPage({ params }: ProviderDetailPageProps) {
  const { providerId } = await params;
  const parsed = AiVideoProviderSchema.safeParse(providerId);

  if (!parsed.success) {
    notFound();
  }

  let detailResult;

  try {
    const supabase = await createSupabaseServerClient();
    const service = createProviderCatalogueService(
      createSupabaseProviderCatalogueRepository(supabase),
    );
    detailResult = await service.getProviderDetail(parsed.data);
  } catch {
    return (
      <PageContainer className="py-12">
        <ProviderEmptyState />
      </PageContainer>
    );
  }

  if (!detailResult.ok) {
    if (detailResult.code === 'not_found') {
      notFound();
    }

    return (
      <PageContainer className="py-12">
        <ProviderEmptyState />
      </PageContainer>
    );
  }

  const { provider, offerings, sources, providerFreshness } = detailResult.data;

  return (
    <PageContainer className="py-12">
      <div className="max-w-4xl space-y-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {provider.displayName}
            </h1>
            <ProviderStatusBadge status={provider.lifecycleStatus} />
            <ProviderAccessBadge status={provider.apiAccessStatus} />
            <ProviderFreshnessBadge freshness={providerFreshness} />
          </div>
          <p className="text-sm text-muted-foreground">{provider.vendorName}</p>
          <p className="text-base leading-relaxed text-muted-foreground">{provider.summary}</p>
          <ProviderFreshnessDates
            verifiedAt={provider.verifiedAt}
            reviewDueAt={provider.reviewDueAt}
          />
        </div>

        <ProviderCatalogueNotice
          notice={provider.catalogueNotice}
          sunsetAt={provider.sunsetAt}
          lifecycleStatus={provider.lifecycleStatus}
        />

        <Alert>
          <AlertTitle>Recommendation not implemented</AlertTitle>
          <AlertDescription>
            Prompt Pilot does not yet calculate provider recommendations, rankings, or match
            percentages. This page presents source-backed catalogue facts only.
          </AlertDescription>
        </Alert>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Offerings</h2>
          <div className="grid gap-4">
            {offerings.map(({ offering, facts }) => (
              <OfferingCard key={offering.id} offering={offering} facts={facts} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Official sources</h2>
          <ProviderSourceList sources={sources} />
        </section>
      </div>
    </PageContainer>
  );
}
