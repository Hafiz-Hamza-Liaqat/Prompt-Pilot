import { z } from 'zod';
import {
  NonEmptyTrimmedStringSchema,
  PercentageScoreSchema,
  VersionStringSchema,
} from './common.js';
import {
  AiVideoProviderSchema,
  RecommendationConfidenceSchema,
  RecommendationRoleSchema,
} from './constants.js';

export const ProviderRecommendationSchema = z.object({
  providerId: AiVideoProviderSchema,
  capabilityVersionUsed: VersionStringSchema,
  fitScore: PercentageScoreSchema,
  confidence: RecommendationConfidenceSchema,
  eligible: z.boolean(),
  disqualificationReasons: z.array(NonEmptyTrimmedStringSchema),
  matchingReasons: z.array(NonEmptyTrimmedStringSchema),
  limitations: z.array(NonEmptyTrimmedStringSchema),
  recommendedWorkflow: NonEmptyTrimmedStringSchema,
  recommendationRole: RecommendationRoleSchema,
});

export const ProviderRecommendationSetSchema = z
  .array(ProviderRecommendationSchema)
  .min(2, 'Recommendation set must include a primary and at least one alternative')
  .superRefine((recommendations, ctx) => {
    const providerIds = recommendations.map((item) => item.providerId);
    const uniqueProviderIds = new Set(providerIds);
    if (uniqueProviderIds.size !== providerIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Recommendation set must not contain duplicate providers',
      });
    }

    const primaryRecommendations = recommendations.filter(
      (item) => item.recommendationRole === 'primary',
    );
    if (primaryRecommendations.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Recommendation set must contain exactly one primary recommendation',
      });
    }

    const alternativeRecommendations = recommendations.filter(
      (item) =>
        item.recommendationRole === 'alternative' ||
        item.recommendationRole === 'budget_alternative',
    );
    if (alternativeRecommendations.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Recommendation set must contain at least one alternative recommendation',
      });
    }

    const primary = primaryRecommendations[0];
    if (primary) {
      if (!primary.eligible) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Primary recommendation must be eligible',
          path: [recommendations.indexOf(primary), 'eligible'],
        });
      }
      if (primary.disqualificationReasons.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Primary recommendation must not contain disqualification reasons',
          path: [recommendations.indexOf(primary), 'disqualificationReasons'],
        });
      }
    }
  });

export type ProviderRecommendation = z.infer<typeof ProviderRecommendationSchema>;
export type ProviderRecommendationSet = z.infer<typeof ProviderRecommendationSetSchema>;
