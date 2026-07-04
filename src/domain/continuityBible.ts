import { z } from 'zod';
import { NonEmptyTrimmedStringSchema } from './common.js';

export const CharacterLockSchema = z.object({
  id: NonEmptyTrimmedStringSchema,
  nameOrLabel: NonEmptyTrimmedStringSchema,
  ageDescription: NonEmptyTrimmedStringSchema,
  facialFeatures: NonEmptyTrimmedStringSchema,
  hair: NonEmptyTrimmedStringSchema,
  clothing: NonEmptyTrimmedStringSchema,
  bodyDescription: NonEmptyTrimmedStringSchema,
  accessories: NonEmptyTrimmedStringSchema,
  personality: NonEmptyTrimmedStringSchema,
  movementStyle: NonEmptyTrimmedStringSchema,
  immutableDetails: z.array(NonEmptyTrimmedStringSchema),
});

export const ProductLockSchema = z.object({
  id: NonEmptyTrimmedStringSchema,
  nameOrLabel: NonEmptyTrimmedStringSchema,
  shape: NonEmptyTrimmedStringSchema,
  colours: NonEmptyTrimmedStringSchema,
  materials: NonEmptyTrimmedStringSchema,
  packaging: NonEmptyTrimmedStringSchema,
  logoPlacement: NonEmptyTrimmedStringSchema,
  textPlacement: NonEmptyTrimmedStringSchema,
  relativeSize: NonEmptyTrimmedStringSchema,
  surfaceAndReflectivity: NonEmptyTrimmedStringSchema,
  immutableDetails: z.array(NonEmptyTrimmedStringSchema),
});

export const WorldLockSchema = z.object({
  id: NonEmptyTrimmedStringSchema,
  location: NonEmptyTrimmedStringSchema,
  timeOfDay: NonEmptyTrimmedStringSchema,
  weather: NonEmptyTrimmedStringSchema,
  lighting: NonEmptyTrimmedStringSchema,
  colourPalette: NonEmptyTrimmedStringSchema,
  architecture: NonEmptyTrimmedStringSchema,
  backgroundElements: z.array(NonEmptyTrimmedStringSchema),
  immutableDetails: z.array(NonEmptyTrimmedStringSchema),
});

export const StyleLockSchema = z.object({
  id: NonEmptyTrimmedStringSchema,
  visualStyle: NonEmptyTrimmedStringSchema,
  lensLanguage: NonEmptyTrimmedStringSchema,
  cameraBehaviour: NonEmptyTrimmedStringSchema,
  colourGrade: NonEmptyTrimmedStringSchema,
  contrast: NonEmptyTrimmedStringSchema,
  grain: NonEmptyTrimmedStringSchema,
  motionIntensity: NonEmptyTrimmedStringSchema,
  immutableDetails: z.array(NonEmptyTrimmedStringSchema),
});

export const ContinuityBibleSchema = z.object({
  characterLocks: z.array(CharacterLockSchema),
  productLocks: z.array(ProductLockSchema),
  worldLocks: z.array(WorldLockSchema),
  styleLocks: z.array(StyleLockSchema),
});

export type CharacterLock = z.infer<typeof CharacterLockSchema>;
export type ProductLock = z.infer<typeof ProductLockSchema>;
export type WorldLock = z.infer<typeof WorldLockSchema>;
export type StyleLock = z.infer<typeof StyleLockSchema>;
export type ContinuityBible = z.infer<typeof ContinuityBibleSchema>;

export function collectContinuityLockIds(bible: ContinuityBible): Set<string> {
  const ids = new Set<string>();
  for (const lock of bible.characterLocks) ids.add(lock.id);
  for (const lock of bible.productLocks) ids.add(lock.id);
  for (const lock of bible.worldLocks) ids.add(lock.id);
  for (const lock of bible.styleLocks) ids.add(lock.id);
  return ids;
}
