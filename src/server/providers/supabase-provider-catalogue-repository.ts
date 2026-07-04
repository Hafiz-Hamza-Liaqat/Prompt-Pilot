import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CatalogueCapabilityFactSchema,
  CatalogueOfferingSchema,
  CatalogueProviderSchema,
  CatalogueSourceSchema,
  CatalogueProviderIdSchema,
} from '@/domain/providerCatalogue';
import type { AiVideoProvider } from '@/domain/constants';
import type { Database } from '@/types/database';
import type {
  ProviderCatalogueRepository,
  ProviderCatalogueRepositoryResult,
} from './provider-catalogue-repository';

const PROVIDER_COLUMNS =
  'id, display_name, vendor_name, summary, lifecycle_status, api_access_status, recommendation_eligible, sunset_at, catalogue_notice, verified_at, review_due_at, created_at, updated_at';

const OFFERING_COLUMNS =
  'id, provider_id, offering_key, display_name, offering_type, ownership_type, official_identifier, summary, lifecycle_status, api_access_status, recommendation_eligible, sunset_at, verified_at, review_due_at, created_at, updated_at';

const SOURCE_COLUMNS =
  'id, provider_id, offering_id, source_kind, title, url, published_or_updated_at, verified_at, created_at';

const FACT_COLUMNS =
  'id, offering_id, capability_key, support_level, numeric_value, text_value, structured_value, evidence_summary, limitation_summary, source_id, verified_at, review_due_at, created_at, updated_at';

const MAX_LIST_SIZE = 200;

type ProviderRow = Database['public']['Tables']['ai_video_providers']['Row'];
type OfferingRow = Database['public']['Tables']['ai_video_offerings']['Row'];
type SourceRow = Database['public']['Tables']['ai_video_sources']['Row'];
type FactRow = Database['public']['Tables']['ai_video_capability_facts']['Row'];

function persistenceError<T>(): ProviderCatalogueRepositoryResult<T> {
  return { ok: false, code: 'persistence_error' };
}

function notFound<T>(): ProviderCatalogueRepositoryResult<T> {
  return { ok: false, code: 'not_found' };
}

function mapProvider(row: ProviderRow) {
  return CatalogueProviderSchema.parse({
    id: row.id,
    displayName: row.display_name,
    vendorName: row.vendor_name,
    summary: row.summary,
    lifecycleStatus: row.lifecycle_status,
    apiAccessStatus: row.api_access_status,
    recommendationEligible: row.recommendation_eligible,
    sunsetAt: row.sunset_at,
    catalogueNotice: row.catalogue_notice,
    verifiedAt: row.verified_at,
    reviewDueAt: row.review_due_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function mapOffering(row: OfferingRow) {
  return CatalogueOfferingSchema.parse({
    id: row.id,
    providerId: row.provider_id,
    offeringKey: row.offering_key,
    displayName: row.display_name,
    offeringType: row.offering_type,
    ownershipType: row.ownership_type,
    officialIdentifier: row.official_identifier,
    summary: row.summary,
    lifecycleStatus: row.lifecycle_status,
    apiAccessStatus: row.api_access_status,
    recommendationEligible: row.recommendation_eligible,
    sunsetAt: row.sunset_at,
    verifiedAt: row.verified_at,
    reviewDueAt: row.review_due_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function mapSource(row: SourceRow) {
  return CatalogueSourceSchema.parse({
    id: row.id,
    providerId: row.provider_id,
    offeringId: row.offering_id,
    sourceKind: row.source_kind,
    title: row.title,
    url: row.url,
    publishedOrUpdatedAt: row.published_or_updated_at,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
  });
}

function mapFact(row: FactRow) {
  const structuredValue = Array.isArray(row.structured_value)
    ? row.structured_value.filter((item): item is string => typeof item === 'string')
    : row.structured_value;

  return CatalogueCapabilityFactSchema.parse({
    id: row.id,
    offeringId: row.offering_id,
    capabilityKey: row.capability_key,
    supportLevel: row.support_level,
    numericValue: row.numeric_value === null ? null : Number(row.numeric_value),
    textValue: row.text_value,
    structuredValue,
    evidenceSummary: row.evidence_summary,
    limitationSummary: row.limitation_summary,
    sourceId: row.source_id,
    verifiedAt: row.verified_at,
    reviewDueAt: row.review_due_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export class SupabaseProviderCatalogueRepository implements ProviderCatalogueRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listProviders(): Promise<ProviderCatalogueRepositoryResult<ReturnType<typeof mapProvider>[]>> {
    const { data, error } = await this.supabase
      .from('ai_video_providers')
      .select(PROVIDER_COLUMNS)
      .order('id', { ascending: true })
      .limit(MAX_LIST_SIZE);

    if (error) {
      return persistenceError();
    }

    try {
      return { ok: true, data: (data ?? []).map(mapProvider) };
    } catch {
      return persistenceError();
    }
  }

  async getProviderById(
    providerId: AiVideoProvider,
  ): Promise<ProviderCatalogueRepositoryResult<ReturnType<typeof mapProvider>>> {
    if (!CatalogueProviderIdSchema.safeParse(providerId).success) {
      return notFound();
    }

    const { data, error } = await this.supabase
      .from('ai_video_providers')
      .select(PROVIDER_COLUMNS)
      .eq('id', providerId)
      .maybeSingle();

    if (error) {
      return persistenceError();
    }

    if (!data) {
      return notFound();
    }

    try {
      return { ok: true, data: mapProvider(data) };
    } catch {
      return persistenceError();
    }
  }

  async listOfferingsByProvider(
    providerId: AiVideoProvider,
  ): Promise<ProviderCatalogueRepositoryResult<ReturnType<typeof mapOffering>[]>> {
    if (!CatalogueProviderIdSchema.safeParse(providerId).success) {
      return notFound();
    }

    const { data, error } = await this.supabase
      .from('ai_video_offerings')
      .select(OFFERING_COLUMNS)
      .eq('provider_id', providerId)
      .order('offering_key', { ascending: true })
      .limit(MAX_LIST_SIZE);

    if (error) {
      return persistenceError();
    }

    try {
      return { ok: true, data: (data ?? []).map(mapOffering) };
    } catch {
      return persistenceError();
    }
  }

  async listCapabilityFactsByOffering(
    offeringId: string,
  ): Promise<ProviderCatalogueRepositoryResult<ReturnType<typeof mapFact>[]>> {
    const { data, error } = await this.supabase
      .from('ai_video_capability_facts')
      .select(FACT_COLUMNS)
      .eq('offering_id', offeringId)
      .order('capability_key', { ascending: true })
      .limit(MAX_LIST_SIZE);

    if (error) {
      return persistenceError();
    }

    try {
      return { ok: true, data: (data ?? []).map(mapFact) };
    } catch {
      return persistenceError();
    }
  }

  async listSourcesByProvider(
    providerId: AiVideoProvider,
  ): Promise<ProviderCatalogueRepositoryResult<ReturnType<typeof mapSource>[]>> {
    if (!CatalogueProviderIdSchema.safeParse(providerId).success) {
      return notFound();
    }

    const { data, error } = await this.supabase
      .from('ai_video_sources')
      .select(SOURCE_COLUMNS)
      .eq('provider_id', providerId)
      .order('verified_at', { ascending: false })
      .limit(MAX_LIST_SIZE);

    if (error) {
      return persistenceError();
    }

    try {
      return { ok: true, data: (data ?? []).map(mapSource) };
    } catch {
      return persistenceError();
    }
  }
}

export function createSupabaseProviderCatalogueRepository(
  supabase: SupabaseClient<Database>,
): ProviderCatalogueRepository {
  return new SupabaseProviderCatalogueRepository(supabase);
}
