import { z } from 'zod';

export const AI_VIDEO_PROVIDERS = [
  'google_veo',
  'openai_sora',
  'runway',
  'kling',
  'adobe_firefly',
] as const;

export const PUBLISHING_DESTINATIONS = [
  'youtube',
  'youtube_shorts',
  'instagram_reels',
  'instagram_feed',
  'facebook_reels',
  'facebook_feed',
  'tiktok',
  'website',
  'custom',
] as const;

export const VIDEO_CATEGORIES = [
  'product_advertisement',
  'ugc_advertisement',
  'cinematic_short',
  'faceless_educational',
  'explainer',
  'product_demonstration',
  'story_narrative',
  'realistic_social_scene',
  'youtube_intro_trailer',
  'real_estate_showcase',
  'news_informational_recap',
  'app_software_promotion',
] as const;

export const DURATION_PRESETS_SECONDS = [
  5, 8, 10, 15, 20, 30, 45, 60, 90, 120, 180,
] as const;

export const INTERACTION_STATES = [
  'idle',
  'validating',
  'submitting',
  'success',
  'recoverable_error',
  'blocked',
] as const;

export const SOURCE_TYPES = [
  'idea',
  'script',
  'product_url',
  'article_url',
  'template',
] as const;

export const BUDGET_PRIORITIES = [
  'free_only',
  'low_cost',
  'balanced',
  'highest_quality',
  'fastest',
] as const;

export const QUALITY_PRIORITIES = [
  'fastest',
  'balanced',
  'highest_quality',
] as const;

export const RECOMMENDATION_CONFIDENCE_LEVELS = [
  'low',
  'medium',
  'high',
] as const;

export const COMPLEXITY_LEVELS = [
  'simple',
  'structured',
  'advanced',
  'production',
] as const;

export const RISK_LEVELS = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export const NARRATIVE_ROLES = [
  'hook',
  'setup',
  'problem',
  'solution',
  'benefit',
  'proof',
  'transition',
  'call_to_action',
  'closing',
  'custom',
] as const;

export const RECOMMENDATION_ROLES = [
  'primary',
  'alternative',
  'budget_alternative',
] as const;

export const WARNING_SEVERITIES = [
  'info',
  'warning',
  'error',
] as const;

export const ASPECT_RATIOS = [
  '16:9',
  '9:16',
  '1:1',
  '4:5',
  'custom',
] as const;

export const MIN_DURATION_SECONDS = 5;
export const MAX_DURATION_SECONDS = 180;

export const AiVideoProviderSchema = z.enum(AI_VIDEO_PROVIDERS);
export const PublishingDestinationSchema = z.enum(PUBLISHING_DESTINATIONS);
export const VideoCategorySchema = z.enum(VIDEO_CATEGORIES);
export const InteractionStateSchema = z.enum(INTERACTION_STATES);
export const SourceTypeSchema = z.enum(SOURCE_TYPES);
export const BudgetPrioritySchema = z.enum(BUDGET_PRIORITIES);
export const QualityPrioritySchema = z.enum(QUALITY_PRIORITIES);
export const RecommendationConfidenceSchema = z.enum(RECOMMENDATION_CONFIDENCE_LEVELS);
export const ComplexityLevelSchema = z.enum(COMPLEXITY_LEVELS);
export const RiskLevelSchema = z.enum(RISK_LEVELS);
export const NarrativeRoleSchema = z.enum(NARRATIVE_ROLES);
export const RecommendationRoleSchema = z.enum(RECOMMENDATION_ROLES);
export const WarningSeveritySchema = z.enum(WARNING_SEVERITIES);
export const AspectRatioSchema = z.enum(ASPECT_RATIOS);

export type AiVideoProvider = z.infer<typeof AiVideoProviderSchema>;
export type PublishingDestination = z.infer<typeof PublishingDestinationSchema>;
export type VideoCategory = z.infer<typeof VideoCategorySchema>;
export type InteractionState = z.infer<typeof InteractionStateSchema>;
export type SourceType = z.infer<typeof SourceTypeSchema>;
export type BudgetPriority = z.infer<typeof BudgetPrioritySchema>;
export type QualityPriority = z.infer<typeof QualityPrioritySchema>;
export type RecommendationConfidence = z.infer<typeof RecommendationConfidenceSchema>;
export type ComplexityLevel = z.infer<typeof ComplexityLevelSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type NarrativeRole = z.infer<typeof NarrativeRoleSchema>;
export type RecommendationRole = z.infer<typeof RecommendationRoleSchema>;
export type WarningSeverity = z.infer<typeof WarningSeveritySchema>;
export type AspectRatio = z.infer<typeof AspectRatioSchema>;
