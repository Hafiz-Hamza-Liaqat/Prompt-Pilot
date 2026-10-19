import type { IsoDateTime } from '../../common.js';
import type { StorageLocator } from '../constants.js';
import type {
  ObjectDeleteRequest,
  ObjectDeleteResult,
  ObjectHeadRequest,
  ObjectHeadResult,
  ObjectPutRequest,
  ObjectPutResult,
} from './descriptors.js';

/**
 * Storage provider boundary — PP-07 contracts only.
 * Implementations (Supabase Storage, R2, etc.) are deferred.
 */
export interface StorageProvider {
  readonly providerId: string;

  prepareUpload(request: ObjectPutRequest): Promise<ObjectPutResult>;

  confirmUpload(scope: ObjectHeadRequest): Promise<ObjectHeadResult>;

  headObject(request: ObjectHeadRequest): Promise<ObjectHeadResult>;

  deleteObject(request: ObjectDeleteRequest): Promise<ObjectDeleteResult>;

  /** Lists locators eligible for cleanup before deadline — sweeper contract. */
  listExpiredObjects(before: IsoDateTime): Promise<readonly StorageLocator[]>;
}

export type StorageProviderRegistry = {
  getProvider(providerId: string): StorageProvider | undefined;
  registerProvider(provider: StorageProvider): void;
};

export const STORAGE_PROVIDER_TOKENS = {
  defaultProvider: Symbol.for('prompt-pilot.media.StorageProvider'),
  registry: Symbol.for('prompt-pilot.media.StorageProviderRegistry'),
} as const;
