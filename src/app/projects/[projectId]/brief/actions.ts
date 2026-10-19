'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { projectIdSchema } from '@/domain/project';
import {
  type BriefActionStatus,
  categoryStepSchema,
  destinationStepSchema,
  durationStepSchema,
  getNextStep,
  objectiveStepSchema,
  parseCheckboxValue,
  prioritiesStepSchema,
  requirementsStepSchema,
  sourceStepSchema,
  styleStepSchema,
  type WizardInputStep,
} from '@/domain/videoBriefDraft';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUserResult } from '@/server/auth/require-user';
import { createVideoBriefService } from '@/server/briefs/video-brief-service';
import { createSupabaseVideoBriefRepository } from '@/server/briefs/supabase-video-brief-repository';
import type { BriefFormState } from './form-state';

function mapFieldErrors(error: z.ZodError): Record<string, string | undefined> {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string | undefined> = {};

  for (const [key, messages] of Object.entries(flattened)) {
    if (Array.isArray(messages) && messages[0]) {
      fieldErrors[key] = messages[0];
    }
  }

  return fieldErrors;
}

async function getAuthenticatedBriefService() {
  const auth = await requireUserResult();

  if (!auth.ok) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const service = createVideoBriefService(createSupabaseVideoBriefRepository(supabase));

  return { user: auth.user, service };
}

function revalidateBriefPaths(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/brief`);
  revalidatePath(`/projects/${projectId}/brief/source`);
  revalidatePath(`/projects/${projectId}/brief/objective`);
  revalidatePath(`/projects/${projectId}/brief/destination`);
  revalidatePath(`/projects/${projectId}/brief/category`);
  revalidatePath(`/projects/${projectId}/brief/duration`);
  revalidatePath(`/projects/${projectId}/brief/style`);
  revalidatePath(`/projects/${projectId}/brief/requirements`);
  revalidatePath(`/projects/${projectId}/brief/priorities`);
  revalidatePath(`/projects/${projectId}/brief/review`);
}

function redirectAfterStepSave(projectId: string, currentStep: WizardInputStep): BriefFormState {
  const nextStep = getNextStep(currentStep);

  if (!nextStep) {
    return {
      status: 'success',
      redirectTo: `/projects/${projectId}/brief/review`,
    };
  }

  return {
    status: 'success',
    redirectTo: `/projects/${projectId}/brief/${nextStep}`,
  };
}

function parseProjectId(formData: FormData): string | null {
  const projectId = formData.get('projectId');
  const parsed = projectIdSchema.safeParse(projectId);
  return parsed.success ? parsed.data : null;
}

function buildFailureState(
  status: BriefActionStatus,
  values?: BriefFormState['values'],
): BriefFormState {
  return { status, values };
}

function parseSourceRaw(formData: FormData) {
  const sourceType = formData.get('sourceType');

  if (sourceType === 'idea' || sourceType === 'script') {
    return {
      sourceType,
      sourceText: formData.get('sourceText'),
      sourceUrl: null,
    };
  }

  if (sourceType === 'product_url' || sourceType === 'article_url') {
    return {
      sourceType,
      sourceText: null,
      sourceUrl: formData.get('sourceUrl'),
    };
  }

  return {
    sourceType,
    sourceText: formData.get('sourceText'),
    sourceUrl: formData.get('sourceUrl'),
  };
}

function parseRequirementsRaw(formData: FormData) {
  return {
    productionRequirements: {
      characterConsistency: parseCheckboxValue(formData.get('characterConsistency')),
      productConsistency: parseCheckboxValue(formData.get('productConsistency')),
      logoAccuracy: parseCheckboxValue(formData.get('logoAccuracy')),
      exactTextVisibility: parseCheckboxValue(formData.get('exactTextVisibility')),
      nativeAudio: parseCheckboxValue(formData.get('nativeAudio')),
      dialogue: parseCheckboxValue(formData.get('dialogue')),
      voiceover: parseCheckboxValue(formData.get('voiceover')),
      lipSync: parseCheckboxValue(formData.get('lipSync')),
      multipleLocations: parseCheckboxValue(formData.get('multipleLocations')),
      cameraControl: parseCheckboxValue(formData.get('cameraControl')),
      firstLastFrameControl: parseCheckboxValue(formData.get('firstLastFrameControl')),
      videoExtension: parseCheckboxValue(formData.get('videoExtension')),
      referenceImages: parseCheckboxValue(formData.get('referenceImages')),
      commercialUse: parseCheckboxValue(formData.get('commercialUse')),
    },
  };
}

function sourceValuesFromRaw(raw: ReturnType<typeof parseSourceRaw>): BriefFormState['values'] {
  return {
    sourceType: String(raw.sourceType ?? ''),
    sourceText: raw.sourceText === null ? '' : String(raw.sourceText ?? ''),
    sourceUrl: raw.sourceUrl === null ? '' : String(raw.sourceUrl ?? ''),
  };
}

export async function saveSourceStepAction(
  _prevState: BriefFormState,
  formData: FormData,
): Promise<BriefFormState> {
  const context = await getAuthenticatedBriefService();

  if (!context) {
    return { status: 'not_authenticated' };
  }

  const projectId = parseProjectId(formData);

  if (!projectId) {
    return { status: 'validation_error' };
  }

  const raw = parseSourceRaw(formData);
  const parsed = sourceStepSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: 'validation_error',
      fieldErrors: mapFieldErrors(parsed.error),
      values: sourceValuesFromRaw(raw),
    };
  }

  const result = await context.service.saveSourceStep(context.user.id, projectId, parsed.data);

  if (!result.ok) {
    return buildFailureState(result.status, sourceValuesFromRaw(raw));
  }

  revalidateBriefPaths(projectId);
  return redirectAfterStepSave(projectId, 'source');
}

export async function saveObjectiveStepAction(
  _prevState: BriefFormState,
  formData: FormData,
): Promise<BriefFormState> {
  const context = await getAuthenticatedBriefService();

  if (!context) {
    return { status: 'not_authenticated' };
  }

  const projectId = parseProjectId(formData);

  if (!projectId) {
    return { status: 'validation_error' };
  }

  const raw = {
    workingTitle: formData.get('workingTitle'),
    objective: formData.get('objective'),
    targetAudience: formData.get('targetAudience'),
  };
  const parsed = objectiveStepSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: 'validation_error',
      fieldErrors: mapFieldErrors(parsed.error),
      values: {
        workingTitle: String(raw.workingTitle ?? ''),
        objective: String(raw.objective ?? ''),
        targetAudience: String(raw.targetAudience ?? ''),
      },
    };
  }

  const result = await context.service.saveObjectiveStep(context.user.id, projectId, parsed.data);

  if (!result.ok) {
    return buildFailureState(result.status, {
      workingTitle: String(raw.workingTitle ?? ''),
      objective: String(raw.objective ?? ''),
      targetAudience: String(raw.targetAudience ?? ''),
    });
  }

  revalidateBriefPaths(projectId);
  return redirectAfterStepSave(projectId, 'objective');
}

export async function saveDestinationStepAction(
  _prevState: BriefFormState,
  formData: FormData,
): Promise<BriefFormState> {
  const context = await getAuthenticatedBriefService();

  if (!context) {
    return { status: 'not_authenticated' };
  }

  const projectId = parseProjectId(formData);

  if (!projectId) {
    return { status: 'validation_error' };
  }

  const raw = {
    publishingDestination: formData.get('publishingDestination'),
    aspectRatio: formData.get('aspectRatio'),
  };
  const parsed = destinationStepSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: 'validation_error',
      fieldErrors: mapFieldErrors(parsed.error),
      values: {
        publishingDestination: String(raw.publishingDestination ?? ''),
        aspectRatio: String(raw.aspectRatio ?? ''),
      },
    };
  }

  const result = await context.service.saveDestinationStep(context.user.id, projectId, parsed.data);

  if (!result.ok) {
    return buildFailureState(result.status, {
      publishingDestination: String(raw.publishingDestination ?? ''),
      aspectRatio: String(raw.aspectRatio ?? ''),
    });
  }

  revalidateBriefPaths(projectId);
  return redirectAfterStepSave(projectId, 'destination');
}

export async function saveCategoryStepAction(
  _prevState: BriefFormState,
  formData: FormData,
): Promise<BriefFormState> {
  const context = await getAuthenticatedBriefService();

  if (!context) {
    return { status: 'not_authenticated' };
  }

  const projectId = parseProjectId(formData);

  if (!projectId) {
    return { status: 'validation_error' };
  }

  const raw = {
    videoCategory: formData.get('videoCategory'),
  };
  const parsed = categoryStepSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: 'validation_error',
      fieldErrors: mapFieldErrors(parsed.error),
      values: {
        videoCategory: String(raw.videoCategory ?? ''),
      },
    };
  }

  const result = await context.service.saveCategoryStep(context.user.id, projectId, parsed.data);

  if (!result.ok) {
    return buildFailureState(result.status, {
      videoCategory: String(raw.videoCategory ?? ''),
    });
  }

  revalidateBriefPaths(projectId);
  return redirectAfterStepSave(projectId, 'category');
}

export async function saveDurationStepAction(
  _prevState: BriefFormState,
  formData: FormData,
): Promise<BriefFormState> {
  const context = await getAuthenticatedBriefService();

  if (!context) {
    return { status: 'not_authenticated' };
  }

  const projectId = parseProjectId(formData);

  if (!projectId) {
    return { status: 'validation_error' };
  }

  const raw = {
    durationSeconds: formData.get('durationSeconds'),
  };
  const parsed = durationStepSchema.safeParse({
    durationSeconds: raw.durationSeconds === '' ? undefined : Number(raw.durationSeconds),
  });

  if (!parsed.success) {
    return {
      status: 'validation_error',
      fieldErrors: mapFieldErrors(parsed.error),
      values: {
        durationSeconds: String(raw.durationSeconds ?? ''),
      },
    };
  }

  const result = await context.service.saveDurationStep(context.user.id, projectId, parsed.data);

  if (!result.ok) {
    return buildFailureState(result.status, {
      durationSeconds: String(raw.durationSeconds ?? ''),
    });
  }

  revalidateBriefPaths(projectId);
  return redirectAfterStepSave(projectId, 'duration');
}

export async function saveStyleStepAction(
  _prevState: BriefFormState,
  formData: FormData,
): Promise<BriefFormState> {
  const context = await getAuthenticatedBriefService();

  if (!context) {
    return { status: 'not_authenticated' };
  }

  const projectId = parseProjectId(formData);

  if (!projectId) {
    return { status: 'validation_error' };
  }

  const raw = {
    visualStyle: formData.get('visualStyle'),
    tone: formData.get('tone'),
  };
  const parsed = styleStepSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: 'validation_error',
      fieldErrors: mapFieldErrors(parsed.error),
      values: {
        visualStyle: String(raw.visualStyle ?? ''),
        tone: String(raw.tone ?? ''),
      },
    };
  }

  const result = await context.service.saveStyleStep(context.user.id, projectId, parsed.data);

  if (!result.ok) {
    return buildFailureState(result.status, {
      visualStyle: String(raw.visualStyle ?? ''),
      tone: String(raw.tone ?? ''),
    });
  }

  revalidateBriefPaths(projectId);
  return redirectAfterStepSave(projectId, 'style');
}

export async function saveRequirementsStepAction(
  _prevState: BriefFormState,
  formData: FormData,
): Promise<BriefFormState> {
  const context = await getAuthenticatedBriefService();

  if (!context) {
    return { status: 'not_authenticated' };
  }

  const projectId = parseProjectId(formData);

  if (!projectId) {
    return { status: 'validation_error' };
  }

  const raw = parseRequirementsRaw(formData);
  const parsed = requirementsStepSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: 'validation_error',
      fieldErrors: mapFieldErrors(parsed.error),
      values: Object.fromEntries(
        Object.entries(raw.productionRequirements).map(([key, value]) => [key, value]),
      ),
    };
  }

  const result = await context.service.saveRequirementsStep(
    context.user.id,
    projectId,
    parsed.data,
  );

  if (!result.ok) {
    return buildFailureState(
      result.status,
      Object.fromEntries(
        Object.entries(raw.productionRequirements).map(([key, value]) => [key, value]),
      ),
    );
  }

  revalidateBriefPaths(projectId);
  return redirectAfterStepSave(projectId, 'requirements');
}

export async function savePrioritiesStepAction(
  _prevState: BriefFormState,
  formData: FormData,
): Promise<BriefFormState> {
  const context = await getAuthenticatedBriefService();

  if (!context) {
    return { status: 'not_authenticated' };
  }

  const projectId = parseProjectId(formData);

  if (!projectId) {
    return { status: 'validation_error' };
  }

  const raw = {
    budgetPriority: formData.get('budgetPriority'),
    qualityPriority: formData.get('qualityPriority'),
    userConstraints: formData.get('userConstraints'),
  };
  const parsed = prioritiesStepSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: 'validation_error',
      fieldErrors: mapFieldErrors(parsed.error),
      values: {
        budgetPriority: String(raw.budgetPriority ?? ''),
        qualityPriority: String(raw.qualityPriority ?? ''),
        userConstraints: String(raw.userConstraints ?? ''),
      },
    };
  }

  const result = await context.service.savePrioritiesStep(context.user.id, projectId, parsed.data);

  if (!result.ok) {
    return buildFailureState(result.status, {
      budgetPriority: String(raw.budgetPriority ?? ''),
      qualityPriority: String(raw.qualityPriority ?? ''),
      userConstraints: String(raw.userConstraints ?? ''),
    });
  }

  revalidateBriefPaths(projectId);
  return redirectAfterStepSave(projectId, 'priorities');
}

export async function completeBriefAction(
  _prevState: BriefFormState,
  formData: FormData,
): Promise<BriefFormState> {
  const context = await getAuthenticatedBriefService();

  if (!context) {
    return { status: 'not_authenticated' };
  }

  const projectId = parseProjectId(formData);

  if (!projectId) {
    return { status: 'validation_error' };
  }

  const result = await context.service.completeBrief(context.user.id, projectId);

  if (!result.ok) {
    return { status: result.status };
  }

  revalidateBriefPaths(projectId);
  return {
    status: 'success',
    redirectTo: `/projects/${projectId}?notice=brief-ready`,
  };
}

