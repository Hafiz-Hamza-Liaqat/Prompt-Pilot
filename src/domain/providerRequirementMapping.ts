import { z } from 'zod';
import type { AspectRatio, SourceType } from './constants';
import {
  PRODUCTION_REQUIREMENT_KEYS,
  PRODUCTION_REQUIREMENT_LABELS,
  type ProductionRequirementKey,
  type ProductionRequirements,
} from './productionRequirements';
import { CatalogueCapabilityKeySchema } from './providerCatalogue';
import type { SceneDecomposition } from './sceneDecomposition';

export const NEED_CATEGORIES = [
  'primary_input',
  'format',
  'duration',
  'production_requirement',
  'specialized_service',
] as const;

export const NEED_IMPORTANCE_LEVELS = ['critical', 'required', 'preferred'] as const;

export const SUPPORTING_SERVICE_REQUIREMENT_KEYS = [
  'nativeAudio',
  'dialogue',
  'voiceover',
  'lipSync',
  'videoExtension',
  'firstLastFrameControl',
  'referenceImages',
] as const satisfies readonly ProductionRequirementKey[];

export type SupportingServiceRequirementKey = (typeof SUPPORTING_SERVICE_REQUIREMENT_KEYS)[number];

export const NeedCategorySchema = z.enum(NEED_CATEGORIES);
export const NeedImportanceSchema = z.enum(NEED_IMPORTANCE_LEVELS);

export const ProviderCapabilityNeedSchema = z.object({
  key: z.string().trim().min(1),
  capabilityKey: CatalogueCapabilityKeySchema,
  category: NeedCategorySchema,
  importance: NeedImportanceSchema,
  weight: z.number().int().positive(),
  sourceFields: z.array(z.string().trim().min(1)).min(1),
  label: z.string().trim().min(1),
  rationale: z.string().trim().min(1),
});

export type ProviderCapabilityNeed = z.infer<typeof ProviderCapabilityNeedSchema>;
export type NeedCategory = z.infer<typeof NeedCategorySchema>;
export type NeedImportance = z.infer<typeof NeedImportanceSchema>;

type ProductionRequirementMappingEntry = {
  capabilityKeys: readonly [string, ...string[]];
  weight: number;
  importance: NeedImportance;
  category: 'production_requirement';
};

export const PRODUCTION_REQUIREMENT_CAPABILITY_MAPPING = {
  characterConsistency: {
    capabilityKeys: ['character_consistency'],
    weight: 8,
    importance: 'required',
    category: 'production_requirement',
  },
  productConsistency: {
    capabilityKeys: ['product_consistency'],
    weight: 8,
    importance: 'required',
    category: 'production_requirement',
  },
  logoAccuracy: {
    capabilityKeys: ['logo_accuracy'],
    weight: 6,
    importance: 'required',
    category: 'production_requirement',
  },
  exactTextVisibility: {
    capabilityKeys: ['exact_text_visibility'],
    weight: 6,
    importance: 'required',
    category: 'production_requirement',
  },
  nativeAudio: {
    capabilityKeys: ['native_audio'],
    weight: 8,
    importance: 'required',
    category: 'production_requirement',
  },
  dialogue: {
    capabilityKeys: ['dialogue'],
    weight: 6,
    importance: 'required',
    category: 'production_requirement',
  },
  voiceover: {
    capabilityKeys: ['voiceover'],
    weight: 4,
    importance: 'preferred',
    category: 'production_requirement',
  },
  lipSync: {
    capabilityKeys: ['lip_sync'],
    weight: 8,
    importance: 'required',
    category: 'production_requirement',
  },
  multipleLocations: {
    capabilityKeys: ['multiple_locations'],
    weight: 4,
    importance: 'preferred',
    category: 'production_requirement',
  },
  cameraControl: {
    capabilityKeys: ['camera_control'],
    weight: 6,
    importance: 'required',
    category: 'production_requirement',
  },
  firstLastFrameControl: {
    capabilityKeys: ['first_frame_control', 'last_frame_control'],
    weight: 4,
    importance: 'required',
    category: 'production_requirement',
  },
  videoExtension: {
    capabilityKeys: ['video_extension'],
    weight: 6,
    importance: 'required',
    category: 'production_requirement',
  },
  referenceImages: {
    capabilityKeys: ['reference_images'],
    weight: 6,
    importance: 'required',
    category: 'production_requirement',
  },
  commercialUse: {
    capabilityKeys: ['commercial_use'],
    weight: 6,
    importance: 'required',
    category: 'production_requirement',
  },
} as const satisfies Record<ProductionRequirementKey, ProductionRequirementMappingEntry>;

const NEED_SORT_PRIORITY: Record<string, number> = {
  primary_text_to_video: 0,
  requested_aspect_ratio: 1,
  maximum_scene_duration: 2,
};

function needSortPriority(key: string): number {
  if (key in NEED_SORT_PRIORITY) {
    return NEED_SORT_PRIORITY[key]!;
  }

  return 100;
}

function buildRequirementRationale(requirementKey: ProductionRequirementKey): string {
  return `The completed brief enables ${PRODUCTION_REQUIREMENT_LABELS[requirementKey].toLowerCase()}.`;
}

function buildFirstLastFrameRationale(capabilityKey: 'first_frame_control' | 'last_frame_control'): string {
  if (capabilityKey === 'first_frame_control') {
    return 'The completed brief enables first and last frame control, requiring first-frame control evidence.';
  }

  return 'The completed brief enables first and last frame control, requiring last-frame control evidence.';
}

export type BuildProviderCapabilityNeedsInput = {
  sourceType: SourceType;
  aspectRatio: AspectRatio;
  durationSeconds: number;
  sceneDecomposition: SceneDecomposition;
  productionRequirements: ProductionRequirements;
};

function deriveMaximumSceneDurationSeconds(sceneDecomposition: SceneDecomposition): number {
  return sceneDecomposition.scenes.reduce(
    (maximum, scene) => Math.max(maximum, scene.durationSeconds),
    0,
  );
}

function buildProductionRequirementNeeds(
  productionRequirements: ProductionRequirements,
): ProviderCapabilityNeed[] {
  const needs: ProviderCapabilityNeed[] = [];

  for (const requirementKey of PRODUCTION_REQUIREMENT_KEYS) {
    if (!productionRequirements[requirementKey]) {
      continue;
    }

    const mapping = PRODUCTION_REQUIREMENT_CAPABILITY_MAPPING[requirementKey];

    for (const capabilityKey of mapping.capabilityKeys) {
      const parsedCapabilityKey = CatalogueCapabilityKeySchema.parse(capabilityKey);

      needs.push(
        ProviderCapabilityNeedSchema.parse({
          key: capabilityKey,
          capabilityKey: parsedCapabilityKey,
          category: mapping.category,
          importance: mapping.importance,
          weight: mapping.weight,
          sourceFields: ['productionRequirements'],
          label: PRODUCTION_REQUIREMENT_LABELS[requirementKey],
          rationale:
            requirementKey === 'firstLastFrameControl'
              ? buildFirstLastFrameRationale(
                  capabilityKey as 'first_frame_control' | 'last_frame_control',
                )
              : buildRequirementRationale(requirementKey),
        }),
      );
    }
  }

  return needs;
}

function sortNeeds(needs: ProviderCapabilityNeed[]): ProviderCapabilityNeed[] {
  return [...needs].sort((left, right) => {
    const leftPriority = needSortPriority(left.key);
    const rightPriority = needSortPriority(right.key);

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return left.key.localeCompare(right.key);
  });
}

export function buildProviderCapabilityNeeds(
  input: BuildProviderCapabilityNeedsInput,
): ProviderCapabilityNeed[] {
  const maximumSceneDurationSeconds = deriveMaximumSceneDurationSeconds(input.sceneDecomposition);

  const baselineNeeds: ProviderCapabilityNeed[] = [
    ProviderCapabilityNeedSchema.parse({
      key: 'primary_text_to_video',
      capabilityKey: 'text_to_video',
      category: 'primary_input',
      importance: 'critical',
      weight: 20,
      sourceFields: ['sourceType'],
      label: 'Primary text-to-video generation',
      rationale:
        'Prompt Pilot plans text-directed video generation and requires source-backed text-to-video capability evidence.',
    }),
    ProviderCapabilityNeedSchema.parse({
      key: 'requested_aspect_ratio',
      capabilityKey: 'supported_aspect_ratios',
      category: 'format',
      importance: 'required',
      weight: 10,
      sourceFields: ['aspectRatio'],
      label: 'Requested aspect ratio support',
      rationale: `The completed brief requests the ${input.aspectRatio} aspect ratio.`,
    }),
    ProviderCapabilityNeedSchema.parse({
      key: 'maximum_scene_duration',
      capabilityKey: 'max_duration_seconds',
      category: 'duration',
      importance: 'required',
      weight: 10,
      sourceFields: ['durationSeconds', 'sceneDecomposition'],
      label: 'Maximum scene duration support',
      rationale: `Deterministic scene decomposition requires each scene to fit within provider per-generation duration limits; the longest scene is ${maximumSceneDurationSeconds} seconds.`,
    }),
  ];

  const requirementNeeds = buildProductionRequirementNeeds(input.productionRequirements);
  const combinedNeeds = [...baselineNeeds, ...requirementNeeds];

  const uniqueKeys = new Set(combinedNeeds.map((need) => need.key));
  if (uniqueKeys.size !== combinedNeeds.length) {
    throw new Error('Provider capability need keys must be unique');
  }

  void input.sourceType;
  void input.durationSeconds;

  return sortNeeds(combinedNeeds);
}

export function deriveMaximumSceneDurationFromDecomposition(
  sceneDecomposition: SceneDecomposition,
): number {
  return deriveMaximumSceneDurationSeconds(sceneDecomposition);
}
