import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';
import {
  decomposeDurationIntoScenes,
  TotalDurationSecondsSchema,
  type SceneDecomposition,
} from '@/domain/sceneDecomposition';

export type SceneDecompositionServiceErrorCode =
  | 'brief_required'
  | 'invalid_duration'
  | 'decomposition_error';

export type SceneDecompositionServiceResult =
  | { ok: true; data: SceneDecomposition }
  | { ok: false; code: SceneDecompositionServiceErrorCode };

export type SceneDecompositionInput = {
  completedAt: string | null | undefined;
  durationSeconds: number | null | undefined;
};

export function decomposeBriefDuration(
  brief: SceneDecompositionInput,
): SceneDecompositionServiceResult {
  if (!brief.completedAt) {
    return { ok: false, code: 'brief_required' };
  }

  const durationResult = TotalDurationSecondsSchema.safeParse(brief.durationSeconds);

  if (!durationResult.success) {
    return { ok: false, code: 'invalid_duration' };
  }

  try {
    const decomposition = decomposeDurationIntoScenes(durationResult.data);
    return { ok: true, data: decomposition };
  } catch {
    return { ok: false, code: 'decomposition_error' };
  }
}

export function decomposeCompletedBrief(
  brief: PartialVideoBriefDraft,
): SceneDecompositionServiceResult {
  return decomposeBriefDuration({
    completedAt: brief.completedAt,
    durationSeconds: brief.durationSeconds,
  });
}

export function createSceneDecompositionService() {
  return {
    decomposeBriefDuration,
    decomposeCompletedBrief,
  };
}

export type SceneDecompositionService = ReturnType<typeof createSceneDecompositionService>;
