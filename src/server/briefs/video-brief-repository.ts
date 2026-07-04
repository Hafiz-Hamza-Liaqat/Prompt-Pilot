import type {
  CategoryStepInput,
  DestinationStepInput,
  DurationStepInput,
  ObjectiveStepInput,
  PartialVideoBriefDraft,
  PrioritiesStepInput,
  RequirementsStepInput,
  SourceStepInput,
  StyleStepInput,
} from '@/domain/videoBriefDraft';

export type VideoBriefRepositoryErrorCode =
  | 'not_found'
  | 'persistence_error'
  | 'forbidden'
  | 'project_archived';

export type VideoBriefRepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: VideoBriefRepositoryErrorCode };

export type VideoBriefStepUpdate =
  | { step: 'source'; input: SourceStepInput }
  | { step: 'objective'; input: ObjectiveStepInput }
  | { step: 'destination'; input: DestinationStepInput }
  | { step: 'category'; input: CategoryStepInput }
  | { step: 'duration'; input: DurationStepInput }
  | { step: 'style'; input: StyleStepInput }
  | { step: 'requirements'; input: RequirementsStepInput }
  | { step: 'priorities'; input: PrioritiesStepInput };

export interface VideoBriefRepository {
  getByProjectId(
    userId: string,
    projectId: string,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>>;
  saveSourceStep(
    userId: string,
    projectId: string,
    input: SourceStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>>;
  saveObjectiveStep(
    userId: string,
    projectId: string,
    input: ObjectiveStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>>;
  saveDestinationStep(
    userId: string,
    projectId: string,
    input: DestinationStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>>;
  saveCategoryStep(
    userId: string,
    projectId: string,
    input: CategoryStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>>;
  saveDurationStep(
    userId: string,
    projectId: string,
    input: DurationStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>>;
  saveStyleStep(
    userId: string,
    projectId: string,
    input: StyleStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>>;
  saveRequirementsStep(
    userId: string,
    projectId: string,
    input: RequirementsStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>>;
  savePrioritiesStep(
    userId: string,
    projectId: string,
    input: PrioritiesStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>>;
  completeBrief(
    userId: string,
    projectId: string,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>>;
}
