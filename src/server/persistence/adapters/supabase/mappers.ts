import type { Reference } from '@/domain/canonical';
import { ReferenceSchema } from '@/domain/canonical/reference';
import type { ReferenceVideoAnalysis } from '@/domain/canonical/referenceVideoAnalysis';
import { ReferenceVideoAnalysisSchema } from '@/domain/canonical/referenceVideoAnalysis';
import type { ContentFingerprint } from '@/domain/canonical/contentFingerprint';
import { ContentFingerprintSchema } from '@/domain/canonical/contentFingerprint';
import type { JobRecord } from '@/domain/canonical/job';
import { JobRecordSchema } from '@/domain/canonical/job';
import type { PackageEnvelope } from '@/domain/canonical/package';
import { PackageEnvelopeSchema } from '@/domain/canonical/package';
import type { ExportRecord } from '@/domain/canonical/export';
import { ExportRecordSchema } from '@/domain/canonical/export';

export type ContentReferenceRow = {
  id: string;
  project_id: string;
  owner_id: string;
  reference_kind: Reference['referenceKind'];
  platform: Reference['platform'] | null;
  canonical_url: string | null;
  platform_content_id: string | null;
  title: string | null;
  submitted_at: string;
  access_status: Reference['accessStatus'];
  rights_attestation_id: string | null;
};

export function mapContentReferenceRow(row: ContentReferenceRow): Reference {
  return ReferenceSchema.parse({
    referenceId: row.id,
    projectId: row.project_id,
    referenceKind: row.reference_kind,
    platform: row.platform ?? undefined,
    canonicalUrl: row.canonical_url ?? undefined,
    platformContentId: row.platform_content_id ?? undefined,
    title: row.title ?? undefined,
    submittedAt: row.submitted_at,
    accessStatus: row.access_status,
    rightsAttestationId: row.rights_attestation_id ?? undefined,
  });
}

export type ReferenceAnalysisRow = {
  id: string;
  payload: ReferenceVideoAnalysis;
};

export function mapReferenceAnalysisRow(row: ReferenceAnalysisRow): ReferenceVideoAnalysis {
  return ReferenceVideoAnalysisSchema.parse(row.payload);
}

export type ContentPackageRow = {
  payload: PackageEnvelope;
};

export function mapContentPackageRow(row: ContentPackageRow): PackageEnvelope {
  return PackageEnvelopeSchema.parse(row.payload);
}

export type AnalysisJobRow = {
  id: string;
  project_id: string;
  reference_id: string;
  state: JobRecord['state'];
  progress_percent: number;
  retry_of_job_id: string | null;
  cache_hit: boolean | null;
  failure: JobRecord['failure'];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export function mapAnalysisJobRow(row: AnalysisJobRow): JobRecord {
  return JobRecordSchema.parse({
    jobId: row.id,
    projectId: row.project_id,
    referenceId: row.reference_id,
    state: row.state,
    progressPercent: row.progress_percent,
    retryOfJobId: row.retry_of_job_id ?? undefined,
    cacheHit: row.cache_hit ?? undefined,
    failure: row.failure ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
  });
}

export type ContentFingerprintRow = {
  id: string;
  reference_kind: ContentFingerprint['referenceKind'];
  fingerprint_algorithm_version: number;
  fingerprint_inputs: ContentFingerprint['fingerprintInputs'];
  state: ContentFingerprint['state'];
  created_at: string;
  invalidated_at: string | null;
  expired_at: string | null;
};

export function mapContentFingerprintRow(row: ContentFingerprintRow): ContentFingerprint {
  return ContentFingerprintSchema.parse({
    fingerprintId: row.id,
    referenceKind: row.reference_kind,
    fingerprintAlgorithmVersion: row.fingerprint_algorithm_version,
    fingerprintInputs: row.fingerprint_inputs,
    state: row.state,
    createdAt: row.created_at,
    invalidatedAt: row.invalidated_at ?? undefined,
    expiredAt: row.expired_at ?? undefined,
  });
}

export type ContentExportRow = {
  id: string;
  project_id: string;
  reference_id: string;
  package_ids: string[];
  format: ExportRecord['format'];
  title: string;
  created_by_user_id: string;
  transformation_notice: string;
  created_at: string;
};

export function mapContentExportRow(row: ContentExportRow): ExportRecord {
  return ExportRecordSchema.parse({
    exportId: row.id,
    projectId: row.project_id,
    referenceId: row.reference_id,
    packageIds: row.package_ids,
    format: row.format,
    title: row.title,
    createdByUserId: row.created_by_user_id,
    transformationNotice: row.transformation_notice,
    createdAt: row.created_at,
  });
}

export type CacheEntryRow = {
  cache_key: string;
  fingerprint_id: string;
  analysis_id: string;
  scope_user_id: string;
  analysis_version: number;
  pipeline_version: string;
  hit_count: number;
  created_at: string;
  last_hit_at: string | null;
  expires_at: string;
  invalidated_at: string | null;
};
