'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  createProjectInputSchema,
  type ProjectActionStatus,
  updateProjectInputSchema,
} from '@/domain/project';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUserResult } from '@/server/auth/require-user';
import { createProjectService } from '@/server/projects/project-service';
import { createSupabaseProjectRepository } from '@/server/projects/supabase-project-repository';

export type ProjectFormState = {
  status: ProjectActionStatus;
  fieldErrors?: {
    title?: string;
    description?: string;
  };
  values?: {
    title?: string;
    description?: string;
  };
};

function mapFieldErrors(error: z.ZodError) {
  const flattened = error.flatten().fieldErrors;
  return {
    title: flattened.title?.[0],
    description: flattened.description?.[0],
  };
}

async function getAuthenticatedService() {
  const auth = await requireUserResult();

  if (!auth.ok) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const service = createProjectService(createSupabaseProjectRepository(supabase));

  return { user: auth.user, service };
}

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const context = await getAuthenticatedService();

  if (!context) {
    return { status: 'not_authenticated' };
  }

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
  };

  const parsed = createProjectInputSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: 'validation_error',
      fieldErrors: mapFieldErrors(parsed.error),
      values: {
        title: String(raw.title ?? ''),
        description: String(raw.description ?? ''),
      },
    };
  }

  const result = await context.service.create(context.user.id, parsed.data);

  if (!result.ok) {
    return {
      status: result.status,
      values: {
        title: parsed.data.title,
        description: parsed.data.description ?? '',
      },
    };
  }

  revalidatePath('/projects');
  redirect(`/projects/${result.data.id}?notice=created`);
}

export async function updateProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const context = await getAuthenticatedService();

  if (!context) {
    return { status: 'not_authenticated' };
  }

  const raw = {
    projectId: formData.get('projectId'),
    title: formData.get('title'),
    description: formData.get('description'),
  };

  const parsed = updateProjectInputSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: 'validation_error',
      fieldErrors: mapFieldErrors(parsed.error),
      values: {
        title: String(raw.title ?? ''),
        description: String(raw.description ?? ''),
      },
    };
  }

  const result = await context.service.update(context.user.id, parsed.data);

  if (!result.ok) {
    return {
      status: result.status,
      values: {
        title: parsed.data.title,
        description: parsed.data.description ?? '',
      },
    };
  }

  revalidatePath('/projects');
  revalidatePath(`/projects/${parsed.data.projectId}`);
  redirect(`/projects/${parsed.data.projectId}?notice=updated`);
}

export async function archiveProjectAction(formData: FormData) {
  const context = await getAuthenticatedService();

  if (!context) {
    redirect('/auth/sign-in?next=/projects');
  }

  const projectId = formData.get('projectId');
  const result = await context.service.archive(context.user.id, projectId);

  if (!result.ok) {
    redirect('/projects');
  }

  revalidatePath('/projects');
  revalidatePath(`/projects/${result.data.id}`);
  redirect(`/projects/${result.data.id}?notice=archived`);
}

export async function restoreProjectAction(formData: FormData) {
  const context = await getAuthenticatedService();

  if (!context) {
    redirect('/auth/sign-in?next=/projects');
  }

  const projectId = formData.get('projectId');
  const result = await context.service.restore(context.user.id, projectId);

  if (!result.ok) {
    redirect('/projects');
  }

  revalidatePath('/projects');
  revalidatePath(`/projects/${result.data.id}`);
  redirect(`/projects/${result.data.id}?notice=restored`);
}

export async function duplicateProjectAction(formData: FormData) {
  const context = await getAuthenticatedService();

  if (!context) {
    redirect('/auth/sign-in?next=/projects');
  }

  const projectId = formData.get('projectId');
  const result = await context.service.duplicate(context.user.id, projectId);

  if (!result.ok) {
    redirect('/projects');
  }

  revalidatePath('/projects');
  redirect(`/projects/${result.data.id}?notice=duplicated`);
}

export async function softDeleteProjectAction(formData: FormData) {
  const context = await getAuthenticatedService();

  if (!context) {
    redirect('/auth/sign-in?next=/projects');
  }

  const projectId = formData.get('projectId');
  const result = await context.service.softDelete(context.user.id, projectId);

  if (!result.ok) {
    redirect('/projects');
  }

  revalidatePath('/projects');
  redirect('/projects?notice=deleted');
}
