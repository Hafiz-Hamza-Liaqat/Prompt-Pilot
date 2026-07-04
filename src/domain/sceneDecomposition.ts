import { z } from 'zod';
import { MAX_DURATION_SECONDS, MIN_DURATION_SECONDS } from './constants';

export const SCENE_DECOMPOSITION_ALGORITHM_VERSION = 'duration-v1' as const;
export const SCENE_DECOMPOSITION_ORIGIN = 'deterministic_rule_engine' as const;

export const MIN_SCENE_COUNT = 2 as const;
export const MAX_SCENE_COUNT = 12 as const;

export const SCENE_ROLES = [
  'opening_hook',
  'context_setup',
  'core_message',
  'development',
  'proof_or_demonstration',
  'closing_direction',
] as const;

export const SCENE_PACING_EMPHASIS = [
  'hook',
  'setup',
  'develop',
  'focus',
  'proof',
  'close',
] as const;

export const SCENE_ROLE_LABELS: Record<(typeof SCENE_ROLES)[number], string> = {
  opening_hook: 'Opening hook',
  context_setup: 'Context and setup',
  core_message: 'Core message',
  development: 'Message development',
  proof_or_demonstration: 'Proof or demonstration',
  closing_direction: 'Closing direction',
};

export const SCENE_ROLE_WEIGHTS: Record<(typeof SCENE_ROLES)[number], number> = {
  opening_hook: 1.0,
  context_setup: 1.1,
  core_message: 1.5,
  development: 1.2,
  proof_or_demonstration: 1.3,
  closing_direction: 1.0,
};

export const ROLE_TO_PACING: Record<(typeof SCENE_ROLES)[number], (typeof SCENE_PACING_EMPHASIS)[number]> =
  {
    opening_hook: 'hook',
    context_setup: 'setup',
    development: 'develop',
    core_message: 'focus',
    proof_or_demonstration: 'proof',
    closing_direction: 'close',
  };

export const SceneRoleSchema = z.enum(SCENE_ROLES);
export const ScenePacingEmphasisSchema = z.enum(SCENE_PACING_EMPHASIS);

export const TotalDurationSecondsSchema = z
  .number()
  .int('Duration must be a whole number of seconds')
  .min(MIN_DURATION_SECONDS, `Duration must be at least ${MIN_DURATION_SECONDS} seconds`)
  .max(MAX_DURATION_SECONDS, `Duration must be at most ${MAX_DURATION_SECONDS} seconds`);

export const SceneTimingSchema = z
  .object({
    id: z.string().trim().min(1),
    order: z.number().int().min(1),
    role: SceneRoleSchema,
    label: z.string().trim().min(1),
    pacingEmphasis: ScenePacingEmphasisSchema,
    startSecond: z.number().int().min(0),
    endSecond: z.number().int().min(0),
    durationSeconds: z.number().int().min(1),
  })
  .superRefine((scene, ctx) => {
    if (scene.endSecond <= scene.startSecond) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endSecond must be greater than startSecond',
        path: ['endSecond'],
      });
    }

    if (scene.durationSeconds !== scene.endSecond - scene.startSecond) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'durationSeconds must equal endSecond minus startSecond',
        path: ['durationSeconds'],
      });
    }
  });

export const SceneDecompositionSchema = z
  .object({
    algorithmVersion: z.literal(SCENE_DECOMPOSITION_ALGORITHM_VERSION),
    origin: z.literal(SCENE_DECOMPOSITION_ORIGIN),
    isAiGenerated: z.literal(false),
    isPersisted: z.literal(false),
    totalDurationSeconds: TotalDurationSecondsSchema,
    sceneCount: z.number().int().min(MIN_SCENE_COUNT).max(MAX_SCENE_COUNT),
    scenes: z.array(SceneTimingSchema).min(MIN_SCENE_COUNT),
  })
  .superRefine((value, ctx) => {
    if (value.sceneCount !== value.scenes.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'sceneCount must match scenes length',
        path: ['sceneCount'],
      });
    }

    if (value.sceneCount > value.totalDurationSeconds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'sceneCount cannot exceed totalDurationSeconds',
        path: ['sceneCount'],
      });
    }

    const durationSum = value.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
    if (durationSum !== value.totalDurationSeconds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Scene durations must sum to totalDurationSeconds',
        path: ['scenes'],
      });
    }

    if (value.scenes.length > 0) {
      if (value.scenes[0]?.startSecond !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'First scene must start at 0',
          path: ['scenes'],
        });
      }

      const lastScene = value.scenes[value.scenes.length - 1];
      if (lastScene && lastScene.endSecond !== value.totalDurationSeconds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Last scene must end at totalDurationSeconds',
          path: ['scenes'],
        });
      }

      for (let index = 1; index < value.scenes.length; index += 1) {
        const previous = value.scenes[index - 1];
        const current = value.scenes[index];
        if (previous && current && previous.endSecond !== current.startSecond) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Scene boundaries must be contiguous',
            path: ['scenes', index, 'startSecond'],
          });
        }
      }
    }
  });

export type SceneRole = z.infer<typeof SceneRoleSchema>;
export type ScenePacingEmphasis = z.infer<typeof ScenePacingEmphasisSchema>;
export type SceneTiming = z.infer<typeof SceneTimingSchema>;
export type SceneDecomposition = z.infer<typeof SceneDecompositionSchema>;

export function calculateSceneCount(totalDurationSeconds: number): number {
  const parsed = TotalDurationSecondsSchema.parse(totalDurationSeconds);
  return Math.min(MAX_SCENE_COUNT, Math.max(MIN_SCENE_COUNT, Math.round(parsed / 10)));
}

export function buildSceneRoleSequence(sceneCount: number): SceneRole[] {
  if (sceneCount < MIN_SCENE_COUNT || sceneCount > MAX_SCENE_COUNT) {
    throw new Error(`Scene count must be between ${MIN_SCENE_COUNT} and ${MAX_SCENE_COUNT}`);
  }

  if (sceneCount === 2) {
    return ['opening_hook', 'closing_direction'];
  }

  if (sceneCount === 3) {
    return ['opening_hook', 'core_message', 'closing_direction'];
  }

  if (sceneCount === 4) {
    return ['opening_hook', 'context_setup', 'core_message', 'closing_direction'];
  }

  const developmentCount = sceneCount - 5;
  const sequence: SceneRole[] = ['opening_hook', 'context_setup'];

  for (let index = 0; index < developmentCount; index += 1) {
    sequence.push('development');
  }

  sequence.push('core_message', 'proof_or_demonstration', 'closing_direction');
  return sequence;
}

function buildRoleLabel(role: SceneRole, developmentIndex: number): string {
  if (role === 'development' && developmentIndex > 0) {
    return `${SCENE_ROLE_LABELS.development} ${developmentIndex}`;
  }

  return SCENE_ROLE_LABELS[role];
}

export function allocateSceneDurations(
  roles: SceneRole[],
  totalDurationSeconds: number,
): number[] {
  const parsedTotal = TotalDurationSecondsSchema.parse(totalDurationSeconds);

  if (roles.length < MIN_SCENE_COUNT || roles.length > MAX_SCENE_COUNT) {
    throw new Error('Invalid role sequence length for allocation');
  }

  if (roles.length > parsedTotal) {
    throw new Error('sceneCount cannot exceed totalDurationSeconds');
  }

  const baseAllocation = roles.map(() => 1);
  const remaining = parsedTotal - roles.length;

  if (remaining === 0) {
    return baseAllocation;
  }

  const weights = roles.map((role) => SCENE_ROLE_WEIGHTS[role]);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);

  const rawShares = weights.map((weight) => (remaining * weight) / weightSum);
  const floorShares = rawShares.map((share) => Math.floor(share));
  const allocatedExtra = floorShares.reduce((sum, share) => sum + share, 0);

  const remainders = rawShares.map((share, index) => ({
    index,
    remainder: share - floorShares[index]!,
  }));

  remainders.sort((left, right) => {
    if (right.remainder !== left.remainder) {
      return right.remainder - left.remainder;
    }

    return left.index - right.index;
  });

  const extraSeconds = Array.from({ length: roles.length }, () => 0);
  let leftover = remaining - allocatedExtra;

  for (const entry of remainders) {
    if (leftover <= 0) {
      break;
    }

    extraSeconds[entry.index] = (extraSeconds[entry.index] ?? 0) + 1;
    leftover -= 1;
  }

  return baseAllocation.map((base, index) => base + floorShares[index]! + extraSeconds[index]!);
}

export function buildSceneTimings(
  roles: SceneRole[],
  durations: number[],
  totalDurationSeconds: number,
): SceneTiming[] {
  if (roles.length !== durations.length) {
    throw new Error('Roles and durations must have the same length');
  }

  let developmentCounter = 0;
  let cursor = 0;

  const scenes = roles.map((role, index) => {
    if (role === 'development') {
      developmentCounter += 1;
    }

    const label = buildRoleLabel(role, developmentCounter);
    const durationSeconds = durations[index]!;
    const startSecond = cursor;
    const endSecond = startSecond + durationSeconds;
    cursor = endSecond;

    return {
      id: `scene-${String(index + 1).padStart(2, '0')}`,
      order: index + 1,
      role,
      label,
      pacingEmphasis: ROLE_TO_PACING[role],
      startSecond,
      endSecond,
      durationSeconds,
    };
  });

  return SceneDecompositionSchema.parse({
    algorithmVersion: SCENE_DECOMPOSITION_ALGORITHM_VERSION,
    origin: SCENE_DECOMPOSITION_ORIGIN,
    isAiGenerated: false,
    isPersisted: false,
    totalDurationSeconds,
    sceneCount: scenes.length,
    scenes,
  }).scenes;
}

export function decomposeDurationIntoScenes(totalDurationSeconds: number): SceneDecomposition {
  const parsedTotal = TotalDurationSecondsSchema.parse(totalDurationSeconds);
  const sceneCount = calculateSceneCount(parsedTotal);
  const roles = buildSceneRoleSequence(sceneCount);
  const durations = allocateSceneDurations(roles, parsedTotal);
  const scenes = buildSceneTimings(roles, durations, parsedTotal);

  return SceneDecompositionSchema.parse({
    algorithmVersion: SCENE_DECOMPOSITION_ALGORITHM_VERSION,
    origin: SCENE_DECOMPOSITION_ORIGIN,
    isAiGenerated: false,
    isPersisted: false,
    totalDurationSeconds: parsedTotal,
    sceneCount: scenes.length,
    scenes,
  });
}

export function formatSceneBoundary(second: number): string {
  if (second < 60) {
    return `${second}s`;
  }

  const minutes = Math.floor(second / 60);
  const seconds = second % 60;

  if (seconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}
