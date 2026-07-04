import { z } from 'zod';

/** Authoritative production-requirement keys shared by Phase 1 and Phase 6 wizard contracts. */
export const PRODUCTION_REQUIREMENT_KEYS = [
  'characterConsistency',
  'productConsistency',
  'logoAccuracy',
  'exactTextVisibility',
  'nativeAudio',
  'dialogue',
  'voiceover',
  'lipSync',
  'multipleLocations',
  'cameraControl',
  'firstLastFrameControl',
  'videoExtension',
  'referenceImages',
  'commercialUse',
] as const;

export type ProductionRequirementKey = (typeof PRODUCTION_REQUIREMENT_KEYS)[number];

export const PRODUCTION_REQUIREMENT_COUNT = PRODUCTION_REQUIREMENT_KEYS.length;

export const ProductionRequirementsSchema = z.object({
  characterConsistency: z.boolean(),
  productConsistency: z.boolean(),
  logoAccuracy: z.boolean(),
  exactTextVisibility: z.boolean(),
  nativeAudio: z.boolean(),
  dialogue: z.boolean(),
  voiceover: z.boolean(),
  lipSync: z.boolean(),
  multipleLocations: z.boolean(),
  cameraControl: z.boolean(),
  firstLastFrameControl: z.boolean(),
  videoExtension: z.boolean(),
  referenceImages: z.boolean(),
  commercialUse: z.boolean(),
});

export type ProductionRequirements = z.infer<typeof ProductionRequirementsSchema>;

export const PRODUCTION_REQUIREMENT_DB_COLUMNS = {
  characterConsistency: 'requires_character_consistency',
  productConsistency: 'requires_product_consistency',
  logoAccuracy: 'requires_logo_accuracy',
  exactTextVisibility: 'requires_exact_text_visibility',
  nativeAudio: 'requires_native_audio',
  dialogue: 'requires_dialogue',
  voiceover: 'requires_voiceover',
  lipSync: 'requires_lip_sync',
  multipleLocations: 'requires_multiple_locations',
  cameraControl: 'requires_camera_control',
  firstLastFrameControl: 'requires_first_last_frame_control',
  videoExtension: 'requires_video_extension',
  referenceImages: 'requires_reference_images',
  commercialUse: 'requires_commercial_use',
} as const satisfies Record<ProductionRequirementKey, string>;

export type ProductionRequirementDbColumn =
  (typeof PRODUCTION_REQUIREMENT_DB_COLUMNS)[ProductionRequirementKey];

export const PRODUCTION_REQUIREMENT_DB_COLUMN_NAMES = PRODUCTION_REQUIREMENT_KEYS.map(
  (key) => PRODUCTION_REQUIREMENT_DB_COLUMNS[key],
);

export const PRODUCTION_REQUIREMENT_LABELS = {
  characterConsistency: 'Character consistency across scenes',
  productConsistency: 'Product consistency across scenes',
  logoAccuracy: 'Logo accuracy',
  exactTextVisibility: 'Exact on-screen text visibility',
  nativeAudio: 'Native audio support',
  dialogue: 'Spoken dialogue',
  voiceover: 'Voiceover narration',
  lipSync: 'Lip sync',
  multipleLocations: 'Multiple locations',
  cameraControl: 'Camera control',
  firstLastFrameControl: 'First and last frame control',
  videoExtension: 'Video extension',
  referenceImages: 'Reference images',
  commercialUse: 'Commercial use',
} as const satisfies Record<ProductionRequirementKey, string>;

export function parseProductionRequirementCheckbox(
  value: FormDataEntryValue | null | undefined,
): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  const normalized = String(value);
  return normalized === 'on' || normalized === 'true';
}

export function createDefaultProductionRequirements(): ProductionRequirements {
  return ProductionRequirementsSchema.parse(
    Object.fromEntries(PRODUCTION_REQUIREMENT_KEYS.map((key) => [key, false])),
  );
}

type RequirementDbRow = Record<ProductionRequirementDbColumn, boolean>;

export function mapProductionRequirementsFromDb(
  row: RequirementDbRow,
): ProductionRequirements {
  const mapped = {} as Record<ProductionRequirementKey, boolean>;

  for (const key of PRODUCTION_REQUIREMENT_KEYS) {
    mapped[key] = row[PRODUCTION_REQUIREMENT_DB_COLUMNS[key]];
  }

  return ProductionRequirementsSchema.parse(mapped);
}

export function mapProductionRequirementsToDb(
  requirements: ProductionRequirements,
): RequirementDbRow {
  const parsed = ProductionRequirementsSchema.parse(requirements);
  const mapped = {} as RequirementDbRow;

  for (const key of PRODUCTION_REQUIREMENT_KEYS) {
    mapped[PRODUCTION_REQUIREMENT_DB_COLUMNS[key]] = parsed[key];
  }

  return mapped;
}

export function getEnabledProductionRequirementLabels(
  requirements: ProductionRequirements,
): string[] {
  return PRODUCTION_REQUIREMENT_KEYS.filter((key) => requirements[key]).map(
    (key) => PRODUCTION_REQUIREMENT_LABELS[key],
  );
}
