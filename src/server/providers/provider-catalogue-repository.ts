import type {
  CatalogueCapabilityFact,
  CatalogueOffering,
  CatalogueProvider,
  CatalogueSource,
} from '@/domain/providerCatalogue';
import type { AiVideoProvider } from '@/domain/constants';

export type ProviderCatalogueRepositoryErrorCode = 'persistence_error' | 'not_found';

export type ProviderCatalogueRepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ProviderCatalogueRepositoryErrorCode };

export interface ProviderCatalogueRepository {
  listProviders(): Promise<ProviderCatalogueRepositoryResult<CatalogueProvider[]>>;
  getProviderById(
    providerId: AiVideoProvider,
  ): Promise<ProviderCatalogueRepositoryResult<CatalogueProvider>>;
  listOfferingsByProvider(
    providerId: AiVideoProvider,
  ): Promise<ProviderCatalogueRepositoryResult<CatalogueOffering[]>>;
  listCapabilityFactsByOffering(
    offeringId: string,
  ): Promise<ProviderCatalogueRepositoryResult<CatalogueCapabilityFact[]>>;
  listSourcesByProvider(
    providerId: AiVideoProvider,
  ): Promise<ProviderCatalogueRepositoryResult<CatalogueSource[]>>;
}
