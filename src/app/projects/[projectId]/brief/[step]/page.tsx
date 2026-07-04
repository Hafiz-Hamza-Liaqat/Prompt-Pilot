import { notFound, redirect } from 'next/navigation';
import { BriefReview } from '@/components/briefs/brief-review';
import { BriefWizardShell } from '@/components/briefs/brief-wizard-shell';
import { CategoryStepForm } from '@/components/briefs/category-step-form';
import { DestinationStepForm } from '@/components/briefs/destination-step-form';
import { DurationStepForm } from '@/components/briefs/duration-step-form';
import { ObjectiveStepForm } from '@/components/briefs/objective-step-form';
import { PrioritiesStepForm } from '@/components/briefs/priorities-step-form';
import { RequirementsStepForm } from '@/components/briefs/requirements-step-form';
import { SourceStepForm } from '@/components/briefs/source-step-form';
import { StyleStepForm } from '@/components/briefs/style-step-form';
import { deriveProjectStatus, projectIdSchema } from '@/domain/project';
import {
  getFirstIncompleteStep,
  getReachableSteps,
  parseWizardStep,
  type WizardStep,
} from '@/domain/videoBriefDraft';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/require-user';
import { createVideoBriefService } from '@/server/briefs/video-brief-service';
import { createSupabaseVideoBriefRepository } from '@/server/briefs/supabase-video-brief-repository';
import { createProjectService } from '@/server/projects/project-service';
import { createSupabaseProjectRepository } from '@/server/projects/supabase-project-repository';

type BriefStepPageProps = {
  params: Promise<{ projectId: string; step: string }>;
};

function renderStepForm(projectId: string, step: WizardStep, draft: Parameters<typeof SourceStepForm>[0]['draft']) {
  switch (step) {
    case 'source':
      return <SourceStepForm projectId={projectId} draft={draft} />;
    case 'objective':
      return <ObjectiveStepForm projectId={projectId} draft={draft} />;
    case 'destination':
      return <DestinationStepForm projectId={projectId} draft={draft} />;
    case 'category':
      return <CategoryStepForm projectId={projectId} draft={draft} />;
    case 'duration':
      return <DurationStepForm projectId={projectId} draft={draft} />;
    case 'style':
      return <StyleStepForm projectId={projectId} draft={draft} />;
    case 'requirements':
      return <RequirementsStepForm projectId={projectId} draft={draft} />;
    case 'priorities':
      return <PrioritiesStepForm projectId={projectId} draft={draft} />;
    case 'review':
      return <BriefReview projectId={projectId} draft={draft} />;
    default: {
      const exhaustiveCheck: never = step;
      return exhaustiveCheck;
    }
  }
}

export default async function BriefStepPage({ params }: BriefStepPageProps) {
  const user = await requireUser({ redirectTo: '/projects' });
  const { projectId, step: stepParam } = await params;

  if (!projectIdSchema.safeParse(projectId).success) {
    notFound();
  }

  const step = parseWizardStep(stepParam);

  if (!step) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const projectService = createProjectService(createSupabaseProjectRepository(supabase));
  const projectResult = await projectService.getById(user.id, projectId);

  if (!projectResult.ok) {
    notFound();
  }

  const project = projectResult.data;

  if (deriveProjectStatus(project.archivedAt) === 'archived') {
    redirect(`/projects/${projectId}?notice=project-archived`);
  }

  const briefService = createVideoBriefService(createSupabaseVideoBriefRepository(supabase));
  const briefResult = await briefService.getByProjectId(user.id, projectId);

  let wizardState;

  if (!briefResult.ok) {
    if (briefResult.status !== 'not_found') {
      notFound();
    }

    if (step !== 'source') {
      redirect(`/projects/${projectId}/brief/source`);
    }

    const now = new Date().toISOString();
    wizardState = {
      draft: {
        id: '00000000-0000-0000-0000-000000000000',
        projectId,
        createdAt: now,
        updatedAt: now,
      },
      firstIncompleteStep: 'source',
      reachableSteps: ['source'],
      nextStep: 'objective',
    };
  } else {
    wizardState = briefResult.data;
  }

  const { draft } = wizardState;
  const firstIncompleteStep = getFirstIncompleteStep(draft);
  const reachable = getReachableSteps(draft);

  if (!reachable.includes(step)) {
    redirect(`/projects/${projectId}/brief/${firstIncompleteStep}`);
  }

  return (
    <BriefWizardShell
      projectId={projectId}
      projectTitle={project.title}
      currentStep={step}
      draft={draft}
      reachableSteps={reachable}
    >
      {renderStepForm(projectId, step, draft)}
    </BriefWizardShell>
  );
}
