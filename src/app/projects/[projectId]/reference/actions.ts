'use server';

import { revalidatePath } from 'next/cache';
import {
  initialReferenceIntakeFormState,
  initialStartAnalysisJobFormState,
  type ReferenceIntakeFormState,
  type StartAnalysisJobFormState,
} from './form-state';
import { parseReferenceIntakeFormData, parseStartAnalysisJobFormData, parseJobStatusQuery } from './validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUserResult } from '@/server/auth/require-user';
import { createDefaultJobLifecycleService } from '@/server/job';
import { createLinkIntelligenceStack } from '@/server/link/link-intelligence-factory';
import { createDefaultJobOrchestrator } from '@/server/orchestration';
import { createSupabasePivotRepositoryRegistry } from '@/server/persistence/adapters/supabase';
import { createReferenceIntakeService } from '@/server/reference/reference-intake-service';
import { createAnalysisStack } from '@/server/analysis/analysis-factory';
import { createCacheStack } from '@/server/cache/cache-factory';
import { createPipelineTriggerService } from '@/server/workspace/pipeline-trigger-service';
import { mapPersistedJobToStatusViewModel } from '@/server/workspace/job-status-view-model';
import type { JobStatusViewModel } from '@/domain/workspace/job-status-display';
import type { EntityId } from '@/domain/canonical/primitives';

function createReferencePipelineTrigger(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const registry = createSupabasePivotRepositoryRegistry(supabase);
  const orchestrator = createDefaultJobOrchestrator({
    lifecycle: createDefaultJobLifecycleService(),
  });
  const analysisStack = createAnalysisStack({
    analysisRepository: registry.analysisRepository,
    cacheRepository: registry.cacheRepository,
    resolvePortInput: () => ({
      referenceKind: 'transcript',
      fingerprintId: '00000000-0000-4000-8000-000000000001' as EntityId,
      fingerprintAlgorithmVersion: 1,
      intake: {},
    }),
  });
  const cacheStack = createCacheStack({
    cacheRepository: registry.cacheRepository,
    analysisRepository: registry.analysisRepository,
  });

  return createPipelineTriggerService({
    orchestrator,
    jobRepository: registry.jobRepository,
    referenceRepository: registry.referenceRepository,
    referenceIntakePayloadRepository: registry.referenceIntakePayloadRepository,
    linkCoordinator: createLinkIntelligenceStack(),
    cacheCoordinator: cacheStack.coordinator,
    analysisCoordinator: analysisStack.coordinator,
  });
}

export async function submitReferenceIntakeAction(
  _previousState: ReferenceIntakeFormState,
  formData: FormData,
): Promise<ReferenceIntakeFormState> {
  const auth = await requireUserResult();

  if (!auth.ok) {
    return {
      status: 'not_authenticated',
      message: 'Sign in to submit a reference for analysis.',
    };
  }

  const parsed = parseReferenceIntakeFormData(formData);

  if (!parsed.ok) {
    return {
      status: 'validation_error',
      fieldErrors: parsed.fieldErrors,
      values: {
        referenceKind: String(formData.get('referenceKind') ?? ''),
        bodyText: String(formData.get('bodyText') ?? ''),
        canonicalUrl: String(formData.get('canonicalUrl') ?? ''),
        attestationAccepted: formData.get('attestationAccepted') === 'on',
      },
    };
  }

  const { projectId } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const registry = createSupabasePivotRepositoryRegistry(supabase);
  const service = createReferenceIntakeService({
    attestationRepository: registry.attestationRepository,
    referenceRepository: registry.referenceRepository,
    referenceIntakePayloadRepository: registry.referenceIntakePayloadRepository,
  });

  const result = await service.submitIntake(
    { ownerId: auth.user.id, projectId },
    parsed.data,
  );

  if (!result.ok) {
    if (result.code === 'invalid_url') {
      return {
        status: 'invalid_url',
        message: result.message,
        fieldErrors: { canonicalUrl: result.message },
        values: {
          referenceKind: parsed.data.referenceKind,
          bodyText: 'bodyText' in parsed.data ? parsed.data.bodyText : '',
          canonicalUrl:
            parsed.data.referenceKind === 'youtube_url' ? parsed.data.canonicalUrl : '',
          attestationAccepted: true,
        },
      };
    }

    return {
      status: 'persistence_error',
      message: result.message,
      values: {
        referenceKind: parsed.data.referenceKind,
        bodyText: 'bodyText' in parsed.data ? parsed.data.bodyText : '',
        canonicalUrl:
          parsed.data.referenceKind === 'youtube_url' ? parsed.data.canonicalUrl : '',
        attestationAccepted: true,
      },
    };
  }

  revalidatePath(`/projects/${projectId}`);

  return {
    status: 'success',
    referenceId: result.data.referenceId,
    attestationId: result.data.attestationId,
    referenceKind: result.data.referenceKind,
    message:
      'Reference saved. You can start analysis from this project when ready.',
  };
}

export async function startAnalysisJobAction(
  _previousState: StartAnalysisJobFormState,
  formData: FormData,
): Promise<StartAnalysisJobFormState> {
  const auth = await requireUserResult();

  if (!auth.ok) {
    return {
      status: 'not_authenticated',
      message: 'Sign in to start reference analysis.',
    };
  }

  const parsed = parseStartAnalysisJobFormData(formData);

  if (!parsed.ok) {
    return {
      status: 'validation_error',
      fieldErrors: parsed.fieldErrors,
      message: 'Fix the highlighted fields before starting analysis.',
    };
  }

  const { projectId, referenceId, referenceKind } = parsed.data;
  const scope = { ownerId: auth.user.id, projectId };
  const supabase = await createSupabaseServerClient();
  const trigger = createReferencePipelineTrigger(supabase);

  const result = await trigger.runReferenceAnalysis({
    scope,
    referenceId,
    referenceKind,
    occurredAt: new Date().toISOString(),
  });

  if (!result.ok) {
    if (result.code === 'not_found') {
      return {
        status: 'not_found',
        message: result.message,
      };
    }

    if (result.code === 'conflict') {
      return {
        status: 'conflict',
        message: result.message,
        jobId: result.jobId,
      };
    }

    if (result.code === 'validation_error') {
      return {
        status: 'validation_error',
        message: result.message,
      };
    }

    return {
      status: 'error',
      message: result.message,
      jobId: result.jobId,
      failure: result.failure,
    };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/workspace`);

  return {
    status: 'success',
    jobId: result.jobId,
    analysisId: result.analysisId,
    terminalState: result.terminalState,
    message: 'Reference analysis completed. Open the workspace to review persisted results.',
  };
}

export type JobStatusActionResult =
  | {
      ok: true;
      activeJob: JobStatusViewModel | null;
      polledAt: string;
    }
  | {
      ok: false;
      code: 'not_authenticated' | 'validation_error' | 'persistence_error';
      message?: string;
    };

export async function getJobStatusAction(input: {
  projectId: string;
}): Promise<JobStatusActionResult> {
  const auth = await requireUserResult();

  if (!auth.ok) {
    return {
      ok: false,
      code: 'not_authenticated',
      message: 'Sign in to view analysis job status.',
    };
  }

  const parsed = parseJobStatusQuery(input);

  if (!parsed.ok) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Project ID is invalid.',
    };
  }

  const scope = { ownerId: auth.user.id, projectId: parsed.data.projectId };
  const supabase = await createSupabaseServerClient();
  const registry = createSupabasePivotRepositoryRegistry(supabase);
  const activeJobResult = await registry.jobRepository.getActiveByProject(scope);

  if (!activeJobResult.ok) {
    return {
      ok: false,
      code: 'persistence_error',
      message: 'Unable to load analysis job status. Try again in a moment.',
    };
  }

  return {
    ok: true,
    activeJob: activeJobResult.data
      ? mapPersistedJobToStatusViewModel(activeJobResult.data)
      : null,
    polledAt: new Date().toISOString(),
  };
}

export { initialReferenceIntakeFormState, initialStartAnalysisJobFormState };
