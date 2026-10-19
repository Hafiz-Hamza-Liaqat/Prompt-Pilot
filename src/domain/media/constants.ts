import { z } from 'zod';

/** Media intake limits — operational tuning deferred to upload engine phase. */
export const MEDIA_INTAKE_MAX_FILE_BYTES = 524_288_000; // 500 MiB MVP ceiling
export const MEDIA_INTAKE_MIN_FILE_BYTES = 1;

/** Default temp asset TTL — PP-04 G-26 / PP-05A WorkspaceAsset lifecycle. */
export const DEFAULT_TEMP_ASSET_TTL_HOURS = 24;

/** Allowed upload MIME types for intake validation (provider-agnostic). */
export const MEDIA_UPLOAD_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export const MEDIA_UPLOAD_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
] as const;

export const MEDIA_UPLOAD_MIME_TYPES = [
  ...MEDIA_UPLOAD_VIDEO_MIME_TYPES,
  ...MEDIA_UPLOAD_AUDIO_MIME_TYPES,
] as const;

export type MediaUploadMimeType = (typeof MEDIA_UPLOAD_MIME_TYPES)[number];

/** Upload session lifecycle states. */
export const UPLOAD_SESSION_STATES = [
  'initiated',
  'uploading',
  'paused',
  'completed',
  'cancelled',
  'expired',
  'failed',
] as const;

export type UploadSessionState = (typeof UPLOAD_SESSION_STATES)[number];

/** Stored object lifecycle — maps to WorkspaceAsset conceptual states. */
export const ASSET_STATES = [
  'pending',
  'staging',
  'active',
  'expired',
  'deleted',
  'quarantined',
] as const;

export type AssetState = (typeof ASSET_STATES)[number];

/** Terminal upload session states — no further intake transitions. */
export const UPLOAD_SESSION_TERMINAL_STATES = [
  'completed',
  'cancelled',
  'expired',
  'failed',
] as const satisfies readonly UploadSessionState[];

/** Content hash algorithms supported at intake boundary. */
export const CONTENT_HASH_ALGORITHMS = ['sha256'] as const;

export type ContentHashAlgorithm = (typeof CONTENT_HASH_ALGORITHMS)[number];

/** Opaque internal storage key — never exposed to clients (PP-04 G-29). */
export type StorageLocator = string & { readonly __brand: 'StorageLocator' };

export function asStorageLocator(value: string): StorageLocator {
  return value as StorageLocator;
}

/** Zod boundary for internal storage locators (G-29 — never client-facing). */
export const StorageLocatorSchema = z
  .string()
  .trim()
  .min(1, 'Storage locator must not be empty')
  .transform((value) => asStorageLocator(value));

/** Asset classification for storage policy selection. */
export const ASSET_CLASSIFICATIONS = ['temporary', 'permanent'] as const;

export type AssetClassification = (typeof ASSET_CLASSIFICATIONS)[number];

/** Reference kinds that require binary upload intake. */
export const UPLOAD_REFERENCE_KINDS = ['video_upload', 'audio_upload'] as const;

export type UploadReferenceKind = (typeof UPLOAD_REFERENCE_KINDS)[number];
