import { projectIdSchema } from '@/domain/project';
import type {
  BriefActionStatus,
  CategoryStepInput,
  DestinationStepInput,
  DurationStepInput,
  ObjectiveStepInput,
  PartialVideoBriefDraft,
  PrioritiesStepInput,
  RequirementsStepInput,
  SourceStepInput,
  StyleStepInput,
  WizardInputStep,
  WizardStep,
} from '@/domain/videoBriefDraft';
import {
  areAllInputStepsComplete,
  categoryStepSchema,
  destinationStepSchema,
  durationStepSchema,
  getFirstIncompleteStep,
  getNextStep,
  getReachableSteps,
  getStepIndex,
  isStepComplete,
  objectiveStepSchema,
  prioritiesStepSchema,
  requirementsStepSchema,
  sourceStepSchema,
  styleStepSchema,
  WIZARD_INPUT_STEPS,
} from '@/domain/videoBriefDraft';
import type {
  VideoBriefRepository,
  VideoBriefRepositoryErrorCode,
} from './video-brief-repository';

export type VideoBriefServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: BriefActionStatus };

export type VideoBriefWizardState = {
  draft: PartialVideoBriefDraft;
  firstIncompleteStep: WizardStep;
  reachableSteps: WizardStep[];
  nextStep: WizardStep | null;
};

export class VideoBriefService {
  constructor(private readonly repository: VideoBriefRepository) {}

  async getByProjectId(
    userId: string,
    projectId: unknown,
  ): Promise<VideoBriefServiceResult<VideoBriefWizardState>> {
    const parsedProjectId = projectIdSchema.safeParse(projectId);

    if (!parsedProjectId.success) {
      return { ok: false, status: 'validation_error' };
    }

    const result = await this.repository.getByProjectId(userId, parsedProjectId.data);

    if (!result.ok) {
      return { ok: false, status: this.mapRepositoryError(result.code) };
    }

    return { ok: true, data: this.buildWizardState(result.data) };
  }

  async saveSourceStep(
    userId: string,
    projectId: unknown,
    input: unknown,
  ): Promise<VideoBriefServiceResult<PartialVideoBriefDraft>> {
    return this.saveStep(userId, projectId, 'source', sourceStepSchema, input, (parsed) =>
      this.repository.saveSourceStep(userId, this.requireProjectId(projectId), parsed),
    );
  }

  async saveObjectiveStep(
    userId: string,
    projectId: unknown,
    input: unknown,
  ): Promise<VideoBriefServiceResult<PartialVideoBriefDraft>> {
    return this.saveStep(userId, projectId, 'objective', objectiveStepSchema, input, (parsed) =>
      this.repository.saveObjectiveStep(userId, this.requireProjectId(projectId), parsed),
    );
  }

  async saveDestinationStep(
    userId: string,
    projectId: unknown,
    input: unknown,
  ): Promise<VideoBriefServiceResult<PartialVideoBriefDraft>> {
    return this.saveStep(userId, projectId, 'destination', destinationStepSchema, input, (parsed) =>
      this.repository.saveDestinationStep(userId, this.requireProjectId(projectId), parsed),
    );
  }

  async saveCategoryStep(
    userId: string,
    projectId: unknown,
    input: unknown,
  ): Promise<VideoBriefServiceResult<PartialVideoBriefDraft>> {
    return this.saveStep(userId, projectId, 'category', categoryStepSchema, input, (parsed) =>
      this.repository.saveCategoryStep(userId, this.requireProjectId(projectId), parsed),
    );
  }

  async saveDurationStep(
    userId: string,
    projectId: unknown,
    input: unknown,
  ): Promise<VideoBriefServiceResult<PartialVideoBriefDraft>> {
    return this.saveStep(userId, projectId, 'duration', durationStepSchema, input, (parsed) =>
      this.repository.saveDurationStep(userId, this.requireProjectId(projectId), parsed),
    );
  }

  async saveStyleStep(
    userId: string,
    projectId: unknown,
    input: unknown,
  ): Promise<VideoBriefServiceResult<PartialVideoBriefDraft>> {
    return this.saveStep(userId, projectId, 'style', styleStepSchema, input, (parsed) =>
      this.repository.saveStyleStep(userId, this.requireProjectId(projectId), parsed),
    );
  }

  async saveRequirementsStep(
    userId: string,
    projectId: unknown,
    input: unknown,
  ): Promise<VideoBriefServiceResult<PartialVideoBriefDraft>> {
    return this.saveStep(userId, projectId, 'requirements', requirementsStepSchema, input, (parsed) =>
      this.repository.saveRequirementsStep(userId, this.requireProjectId(projectId), parsed),
    );
  }

  async savePrioritiesStep(
    userId: string,
    projectId: unknown,
    input: unknown,
  ): Promise<VideoBriefServiceResult<PartialVideoBriefDraft>> {
    return this.saveStep(userId, projectId, 'priorities', prioritiesStepSchema, input, (parsed) =>
      this.repository.savePrioritiesStep(userId, this.requireProjectId(projectId), parsed),
    );
  }

  async completeBrief(
    userId: string,
    projectId: unknown,
  ): Promise<VideoBriefServiceResult<PartialVideoBriefDraft>> {
    const parsedProjectId = projectIdSchema.safeParse(projectId);

    if (!parsedProjectId.success) {
      return { ok: false, status: 'validation_error' };
    }

    const draftResult = await this.loadDraftForOrdering(userId, parsedProjectId.data);

    if (!draftResult.ok) {
      return draftResult;
    }

    if (!areAllInputStepsComplete(draftResult.data)) {
      return { ok: false, status: 'validation_error' };
    }

    const result = await this.repository.completeBrief(userId, parsedProjectId.data);

    if (!result.ok) {
      return { ok: false, status: this.mapRepositoryError(result.code) };
    }

    return { ok: true, data: result.data };
  }

  getFirstIncompleteStep(draft: PartialVideoBriefDraft): WizardStep {
    return getFirstIncompleteStep(draft);
  }

  getNextStep(step: WizardStep): WizardStep | null {
    return getNextStep(step);
  }

  private async saveStep<T>(
    userId: string,
    projectId: unknown,
    step: WizardInputStep,
    schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } },
    input: unknown,
    persist: (parsed: T) => ReturnType<VideoBriefRepository['saveSourceStep']>,
  ): Promise<VideoBriefServiceResult<PartialVideoBriefDraft>> {
    const parsedProjectId = projectIdSchema.safeParse(projectId);

    if (!parsedProjectId.success) {
      return { ok: false, status: 'validation_error' };
    }

    const sanitizedInput = this.stripUntrustedIdentityFields(input);
    const normalizedInput =
      step === 'source' ? this.normalizeSourceInput(sanitizedInput) : sanitizedInput;
    const parsed = schema.safeParse(normalizedInput);

    if (!parsed.success) {
      return { ok: false, status: 'validation_error' };
    }

    const ordering = await this.assertStepReachable(userId, parsedProjectId.data, step);

    if (!ordering.ok) {
      return ordering;
    }

    const result = await persist(parsed.data);

    if (!result.ok) {
      return { ok: false, status: this.mapRepositoryError(result.code) };
    }

    return { ok: true, data: result.data };
  }

  private async assertStepReachable(
    userId: string,
    projectId: string,
    step: WizardInputStep,
  ): Promise<VideoBriefServiceResult<void>> {
    const draftResult = await this.loadDraftForOrdering(userId, projectId);

    if (!draftResult.ok) {
      return draftResult;
    }

    const draft = draftResult.data;
    const stepIndex = getStepIndex(step);

    for (const priorStep of WIZARD_INPUT_STEPS.slice(0, stepIndex)) {
      if (!isStepComplete(priorStep, draft)) {
        return { ok: false, status: 'validation_error' };
      }
    }

    return { ok: true, data: undefined };
  }

  private async loadDraftForOrdering(
    userId: string,
    projectId: string,
  ): Promise<VideoBriefServiceResult<PartialVideoBriefDraft>> {
    const result = await this.repository.getByProjectId(userId, projectId);

    if (result.ok) {
      return { ok: true, data: result.data };
    }

    if (result.code === 'not_found') {
      return { ok: true, data: this.createEmptyDraft(projectId) };
    }

    return { ok: false, status: this.mapRepositoryError(result.code) };
  }

  private createEmptyDraft(projectId: string): PartialVideoBriefDraft {
    const now = new Date().toISOString();

    return {
      id: '00000000-0000-0000-0000-000000000000',
      projectId,
      createdAt: now,
      updatedAt: now,
    };
  }

  private normalizeSourceInput(input: unknown): unknown {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
      return input;
    }

    const record = input as Record<string, unknown>;

    if (record.sourceType === 'idea' || record.sourceType === 'script') {
      return { ...record, sourceUrl: null };
    }

    if (record.sourceType === 'product_url' || record.sourceType === 'article_url') {
      return { ...record, sourceText: null };
    }

    return input;
  }

  private buildWizardState(draft: PartialVideoBriefDraft): VideoBriefWizardState {
    const firstIncompleteStep = getFirstIncompleteStep(draft);

    return {
      draft,
      firstIncompleteStep,
      reachableSteps: getReachableSteps(draft),
      nextStep: getNextStep(firstIncompleteStep),
    };
  }

  private stripUntrustedIdentityFields(input: unknown): unknown {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
      return input;
    }

    const record = input as Record<string, unknown>;
    const rest = { ...record };
    delete rest.userId;
    delete rest.ownerId;
    return rest;
  }

  private requireProjectId(projectId: unknown): string {
    const parsed = projectIdSchema.parse(projectId);
    return parsed;
  }

  private mapRepositoryError(code: VideoBriefRepositoryErrorCode): BriefActionStatus {
    switch (code) {
      case 'not_found':
        return 'not_found';
      case 'forbidden':
        return 'forbidden';
      case 'project_archived':
        return 'project_archived';
      default:
        return 'persistence_error';
    }
  }
}

export function createVideoBriefService(repository: VideoBriefRepository): VideoBriefService {
  return new VideoBriefService(repository);
}

export type {
  CategoryStepInput,
  DestinationStepInput,
  DurationStepInput,
  ObjectiveStepInput,
  PrioritiesStepInput,
  RequirementsStepInput,
  SourceStepInput,
  StyleStepInput,
};
