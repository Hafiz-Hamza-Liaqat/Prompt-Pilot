import type { BriefStatus } from '@/domain/videoBriefDraft';
import type { ProjectStatus } from '@/domain/project';

export type ProjectCardAction = {
  label: string;
  href: string;
};

export function getProjectCardPrimaryAction(
  projectId: string,
  projectStatus: ProjectStatus,
  briefStatus: BriefStatus,
): ProjectCardAction {
  if (projectStatus === 'archived') {
    return {
      label: 'View project',
      href: `/projects/${projectId}`,
    };
  }

  if (briefStatus === 'ready') {
    return {
      label: 'Preview workspace',
      href: `/projects/${projectId}/workspace`,
    };
  }

  if (briefStatus === 'draft') {
    return {
      label: 'Continue brief',
      href: `/projects/${projectId}/brief`,
    };
  }

  return {
    label: 'Start brief',
    href: `/projects/${projectId}/brief`,
  };
}
