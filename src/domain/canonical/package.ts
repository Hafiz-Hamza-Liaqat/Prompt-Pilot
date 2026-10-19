import { z } from 'zod';
import { IsoDateTimeSchema, NonEmptyTrimmedStringSchema } from '../common.js';
import {
  GeneratorKindSchema,
  PackageDependencyEntitySchema,
  PackageTypeSchema,
} from './constants.js';
import {
  EntityIdSchema,
  MonotonicVersionSchema,
  SemanticVersionSchema,
} from './primitives.js';
import {
  BlueprintPackagePayloadSchema,
  MarketingPackagePayloadSchema,
  PromptPackagePayloadSchema,
  RepurposingPackagePayloadSchema,
  SeoPackagePayloadSchema,
} from './packagePayloads.js';

export const PackageDependencySchema = z.object({
  entity: PackageDependencyEntitySchema,
  id: EntityIdSchema,
  version: MonotonicVersionSchema.optional(),
});

export const PackageInputManifestEntrySchema = z.object({
  entity: PackageDependencyEntitySchema,
  id: EntityIdSchema,
});

const PackageEnvelopeBaseSchema = z.object({
  packageId: EntityIdSchema,
  projectId: EntityIdSchema,
  referenceId: EntityIdSchema,
  analysisId: EntityIdSchema,
  analysisVersion: MonotonicVersionSchema,
  packageVersion: MonotonicVersionSchema,
  generatorVersion: SemanticVersionSchema,
  supersedesPackageId: EntityIdSchema.optional(),
  generatorKind: GeneratorKindSchema,
  generatorProvider: NonEmptyTrimmedStringSchema,
  dependsOn: z.array(PackageDependencySchema),
  inputManifest: z.array(PackageInputManifestEntrySchema),
  createdAt: IsoDateTimeSchema,
  createdByJobId: EntityIdSchema,
  confidenceSummary: NonEmptyTrimmedStringSchema.optional(),
  transformationNotice: NonEmptyTrimmedStringSchema,
  exportReady: z.boolean(),
});

/**
 * Shared Package envelope — all package types implement this contract.
 * PP-02 Package Engine §2. Payload is type-specific.
 */
export const PackageEnvelopeSchema = z.discriminatedUnion('packageType', [
  PackageEnvelopeBaseSchema.extend({
    packageType: z.literal('blueprint'),
    payload: BlueprintPackagePayloadSchema,
  }),
  PackageEnvelopeBaseSchema.extend({
    packageType: z.literal('prompt'),
    payload: PromptPackagePayloadSchema,
  }),
  PackageEnvelopeBaseSchema.extend({
    packageType: z.literal('seo'),
    payload: SeoPackagePayloadSchema,
  }),
  PackageEnvelopeBaseSchema.extend({
    packageType: z.literal('marketing'),
    payload: MarketingPackagePayloadSchema,
  }),
  PackageEnvelopeBaseSchema.extend({
    packageType: z.literal('repurposing'),
    payload: RepurposingPackagePayloadSchema,
  }),
]);

export type PackageDependency = z.infer<typeof PackageDependencySchema>;
export type PackageInputManifestEntry = z.infer<typeof PackageInputManifestEntrySchema>;
export type PackageEnvelope = z.infer<typeof PackageEnvelopeSchema>;

/** Type guard helper schema map keyed by package type */
export const PACKAGE_PAYLOAD_SCHEMAS = {
  blueprint: BlueprintPackagePayloadSchema,
  prompt: PromptPackagePayloadSchema,
  seo: SeoPackagePayloadSchema,
  marketing: MarketingPackagePayloadSchema,
  repurposing: RepurposingPackagePayloadSchema,
} as const satisfies Record<z.infer<typeof PackageTypeSchema>, z.ZodTypeAny>;
