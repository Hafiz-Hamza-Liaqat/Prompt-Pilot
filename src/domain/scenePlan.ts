import { z } from 'zod';
import { NonEmptyTrimmedStringSchema, PositiveIntegerSchema } from './common.js';
import {
  AiVideoProviderSchema,
  NarrativeRoleSchema,
} from './constants.js';
import { CompiledPromptSchema } from './compiledPrompt.js';

export const SceneSchema = z
  .object({
    sceneId: NonEmptyTrimmedStringSchema,
    sceneNumber: PositiveIntegerSchema,
    startSecond: z.number().int().min(0),
    endSecond: z.number().int().min(0),
    durationSeconds: z.number().int().positive(),
    scenePurpose: NonEmptyTrimmedStringSchema,
    narrativeRole: NarrativeRoleSchema,
    subject: NonEmptyTrimmedStringSchema,
    subjectAppearance: NonEmptyTrimmedStringSchema,
    action: NonEmptyTrimmedStringSchema,
    environment: NonEmptyTrimmedStringSchema,
    composition: NonEmptyTrimmedStringSchema,
    shotSize: NonEmptyTrimmedStringSchema,
    cameraAngle: NonEmptyTrimmedStringSchema,
    cameraMovement: NonEmptyTrimmedStringSchema,
    lighting: NonEmptyTrimmedStringSchema,
    colourDirection: NonEmptyTrimmedStringSchema,
    visualStyle: NonEmptyTrimmedStringSchema,
    motion: NonEmptyTrimmedStringSchema,
    dialogue: NonEmptyTrimmedStringSchema.optional(),
    voiceover: NonEmptyTrimmedStringSchema.optional(),
    audio: NonEmptyTrimmedStringSchema.optional(),
    soundEffects: z.array(NonEmptyTrimmedStringSchema),
    musicDirection: NonEmptyTrimmedStringSchema.optional(),
    textOverlay: NonEmptyTrimmedStringSchema.optional(),
    transition: NonEmptyTrimmedStringSchema,
    continuityLockIds: z.array(NonEmptyTrimmedStringSchema),
    recommendedProvider: AiVideoProviderSchema,
    generationOrder: PositiveIntegerSchema,
    compiledPrompts: z.array(CompiledPromptSchema).min(1, 'Each scene must contain at least one compiled prompt'),
  })
  .superRefine((scene, ctx) => {
    if (scene.endSecond <= scene.startSecond) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endSecond must be greater than startSecond',
        path: ['endSecond'],
      });
    }

    const expectedDuration = scene.endSecond - scene.startSecond;
    if (scene.durationSeconds !== expectedDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'durationSeconds must equal endSecond minus startSecond',
        path: ['durationSeconds'],
      });
    }

    for (const [index, prompt] of scene.compiledPrompts.entries()) {
      if (prompt.sceneId !== scene.sceneId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'compiled prompt sceneId must match the scene identifier',
          path: ['compiledPrompts', index, 'sceneId'],
        });
      }
    }
  });

export const SceneTimelineSchema = z.array(SceneSchema);

export type Scene = z.infer<typeof SceneSchema>;
export type SceneTimeline = z.infer<typeof SceneTimelineSchema>;
