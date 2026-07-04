import { z } from 'zod';
import {
  DurationSecondsSchema,
  IsoDateTimeSchema,
  NonEmptyTrimmedStringSchema,
  PercentageScoreSchema,
  SourceReferenceSchema,
  VersionStringSchema,
} from './common.js';
import {
  AiVideoProviderSchema,
  AspectRatioSchema,
} from './constants.js';

export const ProviderCapabilitySchema = z.object({
  providerId: AiVideoProviderSchema,
  displayName: NonEmptyTrimmedStringSchema,
  modelName: NonEmptyTrimmedStringSchema,
  capabilityVersion: VersionStringSchema,
  active: z.boolean(),
  supportedInputModes: z.array(NonEmptyTrimmedStringSchema),
  supportedAspectRatios: z.array(AspectRatioSchema),
  minClipDurationSeconds: DurationSecondsSchema,
  maxClipDurationSeconds: DurationSecondsSchema,
  nativeAudioSupport: z.boolean(),
  dialogueSupport: z.boolean(),
  referenceImageSupport: z.boolean(),
  firstLastFrameSupport: z.boolean(),
  videoExtensionSupport: z.boolean(),
  apiAvailability: NonEmptyTrimmedStringSchema,
  relativeQualityScore: PercentageScoreSchema,
  relativeSpeedScore: PercentageScoreSchema,
  relativeCostScore: PercentageScoreSchema,
  easeOfUseScore: PercentageScoreSchema,
  bestUseCases: z.array(NonEmptyTrimmedStringSchema),
  limitations: z.array(NonEmptyTrimmedStringSchema),
  commercialUseNote: NonEmptyTrimmedStringSchema,
  lastVerifiedAt: IsoDateTimeSchema,
  officialSourceReferences: z.array(SourceReferenceSchema),
}).superRefine((value, ctx) => {
  if (value.maxClipDurationSeconds < value.minClipDurationSeconds) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'maxClipDurationSeconds must be greater than or equal to minClipDurationSeconds',
      path: ['maxClipDurationSeconds'],
    });
  }
});

export type ProviderCapability = z.infer<typeof ProviderCapabilitySchema>;
