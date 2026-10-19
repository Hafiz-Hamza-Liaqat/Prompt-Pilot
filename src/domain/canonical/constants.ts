import { z } from 'zod';

/** Reference intake kinds — PP-02 Metadata.referenceKind */
export const REFERENCE_KINDS = [
  'youtube_url',
  'video_upload',
  'audio_upload',
  'transcript',
  'script',
] as const;

/** Reference access status — PP-02 Metadata.accessStatus */
export const ACCESS_STATUSES = [
  'public',
  'restricted',
  'unavailable',
  'blocked',
] as const;

/** Media kind within analysis — PP-02 Media.mediaKind */
export const MEDIA_KINDS = ['video', 'audio', 'text'] as const;

/** Transcript provenance — PP-02 Transcript.transcriptSource */
export const TRANSCRIPT_SOURCES = [
  'user_supplied',
  'platform_caption',
  'speech_to_text',
] as const;

/** Confidence classification — PP-02 Confidence section */
export const CONFIDENCE_CLASSIFICATIONS = [
  'observed',
  'measured',
  'derived',
  'unknown',
  'unsupported',
] as const;

/** Fingerprint lifecycle — PP-02 Content Fingerprint §4 */
export const FINGERPRINT_STATES = [
  'candidate',
  'active',
  'invalidated',
  'expired',
] as const;

/** Analysis version change reason — PP-02 Analysis Version */
export const ANALYSIS_CHANGE_REASONS = [
  'initial',
  'reanalysis',
  'correction',
] as const;

/** Package types — PP-02 Package Engine §3 */
export const PACKAGE_TYPES = [
  'blueprint',
  'prompt',
  'seo',
  'marketing',
  'repurposing',
] as const;

/** Package generator kinds — PP-02 Package Engine §2 */
export const GENERATOR_KINDS = ['mock', 'rules', 'ai_compilation'] as const;

/** Dependency entity kinds referenced by Package.dependsOn */
export const PACKAGE_DEPENDENCY_ENTITIES = [
  'reference_video_analysis',
  'video_brief',
  'scene_decomposition',
  'provider_recommendation',
] as const;

/** Job lifecycle states — PP-02 Job State Machine */
export const JOB_STATES = [
  'created',
  'validated',
  'queued',
  'preparing',
  'uploading',
  'fingerprinting',
  'analyzing',
  'generating_packages',
  'saving',
  'completed',
  'failed',
  'cancelled',
  'expired',
  'retry_pending',
] as const;

export const JOB_TERMINAL_STATES = [
  'completed',
  'failed',
  'cancelled',
  'expired',
] as const;

export const JOB_ACTIVE_STATES = [
  'created',
  'validated',
  'queued',
  'preparing',
  'uploading',
  'fingerprinting',
  'analyzing',
  'generating_packages',
  'saving',
  'retry_pending',
] as const;

/** Failure code categories — PP-02 Job State Machine §4 */
export const JOB_FAILURE_CATEGORIES = [
  'validation',
  'access',
  'rights',
  'processing',
  'infrastructure',
  'cache',
] as const;

/** Validation failure codes */
export const JOB_VALIDATION_FAILURE_CODES = [
  'invalid_url',
  'unsupported_platform',
  'file_too_large',
  'duration_exceeded',
] as const;

/** Access failure codes */
export const JOB_ACCESS_FAILURE_CODES = [
  'private_content',
  'geo_blocked',
  'content_removed',
] as const;

/** Rights failure codes */
export const JOB_RIGHTS_FAILURE_CODES = [
  'attestation_missing',
  'policy_blocked',
] as const;

/** Processing failure codes */
export const JOB_PROCESSING_FAILURE_CODES = [
  'transcription_failed',
  'analysis_failed',
  'package_generation_failed',
] as const;

/** Infrastructure failure codes */
export const JOB_INFRASTRUCTURE_FAILURE_CODES = [
  'timeout',
  'worker_unavailable',
  'storage_error',
] as const;

/** Cache failure codes */
export const JOB_CACHE_FAILURE_CODES = ['cache_corrupt'] as const;

export const JOB_FAILURE_CODES = [
  ...JOB_VALIDATION_FAILURE_CODES,
  ...JOB_ACCESS_FAILURE_CODES,
  ...JOB_RIGHTS_FAILURE_CODES,
  ...JOB_PROCESSING_FAILURE_CODES,
  ...JOB_INFRASTRUCTURE_FAILURE_CODES,
  ...JOB_CACHE_FAILURE_CODES,
] as const;

/** Export delivery formats */
export const EXPORT_FORMATS = ['json', 'markdown', 'clipboard_text'] as const;

/** Platforms detected from URL references */
export const REFERENCE_PLATFORMS = ['youtube', 'vimeo'] as const;

export const ReferenceKindSchema = z.enum(REFERENCE_KINDS);
export const AccessStatusSchema = z.enum(ACCESS_STATUSES);
export const MediaKindSchema = z.enum(MEDIA_KINDS);
export const TranscriptSourceSchema = z.enum(TRANSCRIPT_SOURCES);
export const ConfidenceClassificationSchema = z.enum(CONFIDENCE_CLASSIFICATIONS);
export const FingerprintStateSchema = z.enum(FINGERPRINT_STATES);
export const AnalysisChangeReasonSchema = z.enum(ANALYSIS_CHANGE_REASONS);
export const PackageTypeSchema = z.enum(PACKAGE_TYPES);
export const GeneratorKindSchema = z.enum(GENERATOR_KINDS);
export const PackageDependencyEntitySchema = z.enum(PACKAGE_DEPENDENCY_ENTITIES);
export const JobStateSchema = z.enum(JOB_STATES);
export const JobFailureCategorySchema = z.enum(JOB_FAILURE_CATEGORIES);
export const JobFailureCodeSchema = z.enum(JOB_FAILURE_CODES);
export const ExportFormatSchema = z.enum(EXPORT_FORMATS);
export const ReferencePlatformSchema = z.enum(REFERENCE_PLATFORMS);

export type ReferenceKind = z.infer<typeof ReferenceKindSchema>;
export type AccessStatus = z.infer<typeof AccessStatusSchema>;
export type MediaKind = z.infer<typeof MediaKindSchema>;
export type TranscriptSource = z.infer<typeof TranscriptSourceSchema>;
export type ConfidenceClassification = z.infer<typeof ConfidenceClassificationSchema>;
export type FingerprintState = z.infer<typeof FingerprintStateSchema>;
export type AnalysisChangeReason = z.infer<typeof AnalysisChangeReasonSchema>;
export type PackageType = z.infer<typeof PackageTypeSchema>;
export type GeneratorKind = z.infer<typeof GeneratorKindSchema>;
export type PackageDependencyEntity = z.infer<typeof PackageDependencyEntitySchema>;
export type JobState = z.infer<typeof JobStateSchema>;
export type JobFailureCategory = z.infer<typeof JobFailureCategorySchema>;
export type JobFailureCode = z.infer<typeof JobFailureCodeSchema>;
export type ExportFormat = z.infer<typeof ExportFormatSchema>;
export type ReferencePlatform = z.infer<typeof ReferencePlatformSchema>;
