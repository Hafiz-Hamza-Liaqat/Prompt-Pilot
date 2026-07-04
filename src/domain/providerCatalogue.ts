import { z } from 'zod';
import { IsoDateTimeSchema } from './common';
import { AI_VIDEO_PROVIDERS, AiVideoProviderSchema } from './constants';
import type { ProductionRequirementKey } from './productionRequirements';

export const LIFECYCLE_STATUSES = [
  'active',
  'preview',
  'limited',
  'sunsetting',
  'deprecated',
  'unavailable',
  'unknown',
] as const;

export const API_ACCESS_STATUSES = [
  'public',
  'preview',
  'limited',
  'enterprise',
  'sunsetting',
  'unavailable',
  'unknown',
] as const;

export const OFFERING_TYPES = [
  'model',
  'model_family',
  'api_service',
  'platform_service',
] as const;

export const OWNERSHIP_TYPES = ['first_party', 'third_party_hosted'] as const;

export const SUPPORT_LEVELS = ['supported', 'limited', 'unsupported', 'unknown'] as const;

export const SOURCE_KINDS = [
  'developer_docs',
  'api_reference',
  'help_center',
  'release_notes',
  'model_docs',
  'pricing',
] as const;

export const CATALOGUE_CAPABILITY_KEYS = [
  'text_to_video',
  'image_to_video',
  'video_to_video',
  'native_audio',
  'dialogue',
  'voiceover',
  'lip_sync',
  'character_consistency',
  'product_consistency',
  'logo_accuracy',
  'exact_text_visibility',
  'multiple_locations',
  'camera_control',
  'first_frame_control',
  'last_frame_control',
  'video_extension',
  'reference_images',
  'commercial_use',
  'max_duration_seconds',
  'supported_aspect_ratios',
  'supported_resolutions',
] as const;

export const NUMERIC_CATALOGUE_CAPABILITY_KEYS = ['max_duration_seconds'] as const;

export const LIST_CATALOGUE_CAPABILITY_KEYS = [
  'supported_aspect_ratios',
  'supported_resolutions',
] as const;

export const BOOLEAN_CATALOGUE_CAPABILITY_KEYS = CATALOGUE_CAPABILITY_KEYS.filter(
  (key) =>
    !(NUMERIC_CATALOGUE_CAPABILITY_KEYS as readonly string[]).includes(key) &&
    !(LIST_CATALOGUE_CAPABILITY_KEYS as readonly string[]).includes(key),
) as Exclude<
  (typeof CATALOGUE_CAPABILITY_KEYS)[number],
  (typeof NUMERIC_CATALOGUE_CAPABILITY_KEYS)[number] | (typeof LIST_CATALOGUE_CAPABILITY_KEYS)[number]
>[];

export const PRODUCTION_REQUIREMENT_TO_CATALOGUE_CAPABILITY: Record<
  ProductionRequirementKey,
  (typeof CATALOGUE_CAPABILITY_KEYS)[number]
> = {
  characterConsistency: 'character_consistency',
  productConsistency: 'product_consistency',
  logoAccuracy: 'logo_accuracy',
  exactTextVisibility: 'exact_text_visibility',
  nativeAudio: 'native_audio',
  dialogue: 'dialogue',
  voiceover: 'voiceover',
  lipSync: 'lip_sync',
  multipleLocations: 'multiple_locations',
  cameraControl: 'camera_control',
  firstLastFrameControl: 'first_frame_control',
  videoExtension: 'video_extension',
  referenceImages: 'reference_images',
  commercialUse: 'commercial_use',
};

export const OFFICIAL_SOURCE_HOSTS: Record<
  (typeof AI_VIDEO_PROVIDERS)[number],
  readonly string[]
> = {
  google_veo: ['ai.google.dev', 'developers.googleblog.com', 'cloud.google.com'],
  openai_sora: ['help.openai.com', 'platform.openai.com', 'openai.com'],
  runway: ['docs.dev.runwayml.com', 'dev.runwayml.com'],
  kling: ['app.klingai.com', 'api.klingai.com', 'klingai.com'],
  adobe_firefly: ['developer.adobe.com'],
};

export const DEFAULT_REVIEW_INTERVAL_DAYS = 30;
export const REVIEW_DUE_SOON_DAYS = 7;

export const RETIRED_PRODUCT_NAMES = [
  'prompt pilot pro',
  'video pilot',
  'ai video generator',
] as const;

export const LifecycleStatusSchema = z.enum(LIFECYCLE_STATUSES);
export const ApiAccessStatusSchema = z.enum(API_ACCESS_STATUSES);
export const OfferingTypeSchema = z.enum(OFFERING_TYPES);
export const OwnershipTypeSchema = z.enum(OWNERSHIP_TYPES);
export const SupportLevelSchema = z.enum(SUPPORT_LEVELS);
export const SourceKindSchema = z.enum(SOURCE_KINDS);
export const CatalogueCapabilityKeySchema = z.enum(CATALOGUE_CAPABILITY_KEYS);
export const CatalogueProviderIdSchema = AiVideoProviderSchema;

export const MachineSafeOfferingKeySchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, 'Offering key must be lowercase machine-safe text');

export const HttpsOfficialUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .refine((value) => value.startsWith('https://'), 'URL must use HTTPS')
  .refine((value) => !/:\/\/[^/]*@/.test(value), 'URL must not contain credentials');

const NoControlCharactersSchema = z
  .string()
  .refine((value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value), {
    message: 'Must not contain control characters',
  });

export const ProviderDisplayNameSchema = NoControlCharactersSchema.pipe(
  z.string().trim().min(2).max(80),
);

export const OfferingDisplayNameSchema = NoControlCharactersSchema.pipe(
  z.string().trim().min(2).max(120),
);

export const ProviderSummarySchema = NoControlCharactersSchema.pipe(
  z.string().trim().min(10).max(600),
);

export const OfferingSummarySchema = NoControlCharactersSchema.pipe(
  z.string().trim().min(10).max(800),
);

export const CatalogueNoticeSchema = NoControlCharactersSchema.pipe(
  z.string().trim().max(1000),
).nullable();

export const EvidenceSummarySchema = NoControlCharactersSchema.pipe(
  z.string().trim().min(5).max(600),
);

export const LimitationSummarySchema = NoControlCharactersSchema.pipe(
  z.string().trim().min(1).max(600),
);

export const SourceTitleSchema = NoControlCharactersSchema.pipe(
  z.string().trim().min(3).max(240),
);

export type FreshnessState = 'fresh' | 'due_soon' | 'overdue';

export function isRecommendationEligibleLifecycle(lifecycle: z.infer<typeof LifecycleStatusSchema>): boolean {
  return lifecycle !== 'sunsetting' && lifecycle !== 'deprecated' && lifecycle !== 'unavailable';
}

export function addReviewDueDate(verifiedAt: Date, intervalDays = DEFAULT_REVIEW_INTERVAL_DAYS): Date {
  const reviewDue = new Date(verifiedAt);
  reviewDue.setUTCDate(reviewDue.getUTCDate() + intervalDays);
  return reviewDue;
}

export function getFreshnessState(
  verifiedAt: string | Date,
  reviewDueAt: string | Date,
  now: Date = new Date(),
): FreshnessState {
  const reviewDue = typeof reviewDueAt === 'string' ? new Date(reviewDueAt) : reviewDueAt;
  const current = now.getTime();

  if (current > reviewDue.getTime()) {
    return 'overdue';
  }

  const dueSoonThreshold = new Date(reviewDue);
  dueSoonThreshold.setUTCDate(dueSoonThreshold.getUTCDate() - REVIEW_DUE_SOON_DAYS);

  if (current >= dueSoonThreshold.getTime()) {
    return 'due_soon';
  }

  void verifiedAt;
  return 'fresh';
}

export function isOfficialHostForProvider(
  providerId: z.infer<typeof CatalogueProviderIdSchema>,
  url: string,
): boolean {
  let hostname: string;

  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }

  const approvedHosts = OFFICIAL_SOURCE_HOSTS[providerId];

  return approvedHosts.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  );
}

export function containsRetiredProductName(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return RETIRED_PRODUCT_NAMES.some((name) => normalized.includes(name));
}

function validateReviewDates(
  verifiedAt: string,
  reviewDueAt: string,
  ctx: z.RefinementCtx,
  pathPrefix: string,
): void {
  const verified = new Date(verifiedAt);
  const reviewDue = new Date(reviewDueAt);

  if (Number.isNaN(verified.getTime()) || Number.isNaN(reviewDue.getTime())) {
    return;
  }

  if (reviewDue.getTime() <= verified.getTime()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Review due date must follow verification date',
      path: [`${pathPrefix}reviewDueAt`],
    });
  }
}

function validateRecommendationEligibility(
  lifecycleStatus: z.infer<typeof LifecycleStatusSchema>,
  recommendationEligible: boolean,
  ctx: z.RefinementCtx,
  path = 'recommendationEligible',
): void {
  if (recommendationEligible && !isRecommendationEligibleLifecycle(lifecycleStatus)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Sunsetting, deprecated, and unavailable records cannot be recommendation eligible',
      path: [path],
    });
  }
}

export const CatalogueSourceSchema = z
  .object({
    id: z.string().uuid(),
    providerId: CatalogueProviderIdSchema,
    offeringId: z.string().uuid().nullable(),
    sourceKind: SourceKindSchema,
    title: SourceTitleSchema,
    url: HttpsOfficialUrlSchema,
    publishedOrUpdatedAt: IsoDateTimeSchema.nullable(),
    verifiedAt: IsoDateTimeSchema,
    createdAt: IsoDateTimeSchema,
  })
  .superRefine((value, ctx) => {
    if (!isOfficialHostForProvider(value.providerId, value.url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Source URL host is not approved for this provider',
        path: ['url'],
      });
    }
  });

export const CatalogueCapabilityFactSchema = z
  .object({
    id: z.string().uuid(),
    offeringId: z.string().uuid(),
    capabilityKey: CatalogueCapabilityKeySchema,
    supportLevel: SupportLevelSchema,
    numericValue: z.number().nullable(),
    textValue: z.string().trim().nullable(),
    structuredValue: z.union([z.array(z.string()), z.record(z.unknown())]).nullable(),
    evidenceSummary: EvidenceSummarySchema,
    limitationSummary: LimitationSummarySchema.nullable(),
    sourceId: z.string().uuid(),
    verifiedAt: IsoDateTimeSchema,
    reviewDueAt: IsoDateTimeSchema,
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .superRefine((value, ctx) => {
    validateReviewDates(value.verifiedAt, value.reviewDueAt, ctx, '');

    if (value.supportLevel === 'limited' && !value.limitationSummary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Limited capability facts require limitation text',
        path: ['limitationSummary'],
      });
    }

    if (value.supportLevel === 'unsupported' && !value.evidenceSummary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unsupported capability facts require explicit evidence text',
        path: ['evidenceSummary'],
      });
    }

    if (value.supportLevel === 'supported' && !value.sourceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Supported capability facts require a source',
        path: ['sourceId'],
      });
    }

    const isNumeric = (NUMERIC_CATALOGUE_CAPABILITY_KEYS as readonly string[]).includes(
      value.capabilityKey,
    );
    const isList = (LIST_CATALOGUE_CAPABILITY_KEYS as readonly string[]).includes(value.capabilityKey);
    const isBoolean = (BOOLEAN_CATALOGUE_CAPABILITY_KEYS as readonly string[]).includes(
      value.capabilityKey,
    );

    if (isNumeric && value.numericValue === null && value.supportLevel === 'supported') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Numeric capability requires a numeric value when supported',
        path: ['numericValue'],
      });
    }

    if (isList && value.structuredValue === null && value.supportLevel === 'supported') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'List capability requires structured values when supported',
        path: ['structuredValue'],
      });
    }

    if (isBoolean && value.numericValue !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Boolean capability facts must not include numeric payloads',
        path: ['numericValue'],
      });
    }
  });

export const CatalogueOfferingSchema = z
  .object({
    id: z.string().uuid(),
    providerId: CatalogueProviderIdSchema,
    offeringKey: MachineSafeOfferingKeySchema,
    displayName: OfferingDisplayNameSchema,
    offeringType: OfferingTypeSchema,
    ownershipType: OwnershipTypeSchema,
    officialIdentifier: z.string().trim().min(1).nullable(),
    summary: OfferingSummarySchema,
    lifecycleStatus: LifecycleStatusSchema,
    apiAccessStatus: ApiAccessStatusSchema,
    recommendationEligible: z.boolean(),
    sunsetAt: IsoDateTimeSchema.nullable(),
    verifiedAt: IsoDateTimeSchema,
    reviewDueAt: IsoDateTimeSchema,
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .superRefine((value, ctx) => {
    validateReviewDates(value.verifiedAt, value.reviewDueAt, ctx, '');
    validateRecommendationEligibility(
      value.lifecycleStatus,
      value.recommendationEligible,
      ctx,
    );

    if (containsRetiredProductName(value.displayName) || containsRetiredProductName(value.summary)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Retired product names are not permitted in catalogue descriptions',
        path: ['displayName'],
      });
    }
  });

export const CatalogueProviderSchema = z
  .object({
    id: CatalogueProviderIdSchema,
    displayName: ProviderDisplayNameSchema,
    vendorName: ProviderDisplayNameSchema,
    summary: ProviderSummarySchema,
    lifecycleStatus: LifecycleStatusSchema,
    apiAccessStatus: ApiAccessStatusSchema,
    recommendationEligible: z.boolean(),
    sunsetAt: IsoDateTimeSchema.nullable(),
    catalogueNotice: CatalogueNoticeSchema,
    verifiedAt: IsoDateTimeSchema,
    reviewDueAt: IsoDateTimeSchema,
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .superRefine((value, ctx) => {
    validateReviewDates(value.verifiedAt, value.reviewDueAt, ctx, '');
    validateRecommendationEligibility(
      value.lifecycleStatus,
      value.recommendationEligible,
      ctx,
    );

    if (containsRetiredProductName(value.displayName) || containsRetiredProductName(value.summary)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Retired product names are not permitted in catalogue descriptions',
        path: ['displayName'],
      });
    }
  });

export type LifecycleStatus = z.infer<typeof LifecycleStatusSchema>;
export type ApiAccessStatus = z.infer<typeof ApiAccessStatusSchema>;
export type OfferingType = z.infer<typeof OfferingTypeSchema>;
export type OwnershipType = z.infer<typeof OwnershipTypeSchema>;
export type SupportLevel = z.infer<typeof SupportLevelSchema>;
export type SourceKind = z.infer<typeof SourceKindSchema>;
export type CatalogueCapabilityKey = z.infer<typeof CatalogueCapabilityKeySchema>;
export type CatalogueSource = z.infer<typeof CatalogueSourceSchema>;
export type CatalogueCapabilityFact = z.infer<typeof CatalogueCapabilityFactSchema>;
export type CatalogueOffering = z.infer<typeof CatalogueOfferingSchema>;
export type CatalogueProvider = z.infer<typeof CatalogueProviderSchema>;

export function assertApprovedProviderCatalogue(providerIds: readonly string[]): void {
  if (providerIds.length !== AI_VIDEO_PROVIDERS.length) {
    throw new Error(`Expected exactly ${AI_VIDEO_PROVIDERS.length} approved providers`);
  }

  const unique = new Set(providerIds);

  if (unique.size !== providerIds.length) {
    throw new Error('Provider IDs must be unique');
  }

  for (const id of providerIds) {
    if (!AiVideoProviderSchema.safeParse(id).success) {
      throw new Error(`Unknown provider ID: ${id}`);
    }
  }
}
