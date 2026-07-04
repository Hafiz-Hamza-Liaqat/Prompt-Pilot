import type { SupabaseClient } from '@supabase/supabase-js';
import {
  mapProductionRequirementsFromDb,
  mapProductionRequirementsToDb,
  type ProductionRequirements,
} from '@/domain/productionRequirements';
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
import type { Database } from '@/types/database';
import type {
  VideoBriefRepository,
  VideoBriefRepositoryResult,
} from './video-brief-repository';

type VideoBriefRow = {
  id: string;
  project_id: string;
  source_type: string;
  source_text: string | null;
  source_url: string | null;
  working_title: string | null;
  objective: string | null;
  target_audience: string | null;
  publishing_destination: string | null;
  aspect_ratio: string | null;
  video_category: string | null;
  duration_seconds: number | null;
  visual_style: string | null;
  tone: string | null;
  requires_character_consistency: boolean;
  requires_product_consistency: boolean;
  requires_logo_accuracy: boolean;
  requires_exact_text_visibility: boolean;
  requires_native_audio: boolean;
  requires_dialogue: boolean;
  requires_voiceover: boolean;
  requires_lip_sync: boolean;
  requires_multiple_locations: boolean;
  requires_camera_control: boolean;
  requires_first_last_frame_control: boolean;
  requires_video_extension: boolean;
  requires_reference_images: boolean;
  requires_commercial_use: boolean;
  budget_priority: string | null;
  quality_priority: string | null;
  user_constraints: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectAccessRow = Pick<
  Database['public']['Tables']['projects']['Row'],
  'id' | 'owner_id' | 'archived_at' | 'deleted_at'
>;

const BRIEF_COLUMNS =
  'id, project_id, source_type, source_text, source_url, working_title, objective, target_audience, publishing_destination, aspect_ratio, video_category, duration_seconds, visual_style, tone, requires_character_consistency, requires_product_consistency, requires_logo_accuracy, requires_exact_text_visibility, requires_native_audio, requires_dialogue, requires_voiceover, requires_lip_sync, requires_multiple_locations, requires_camera_control, requires_first_last_frame_control, requires_video_extension, requires_reference_images, requires_commercial_use, budget_priority, quality_priority, user_constraints, completed_at, created_at, updated_at';

const PROJECT_ACCESS_COLUMNS = 'id, owner_id, archived_at, deleted_at';

function persistenceError<T>(): VideoBriefRepositoryResult<T> {
  return { ok: false, code: 'persistence_error' };
}

function notFound<T>(): VideoBriefRepositoryResult<T> {
  return { ok: false, code: 'not_found' };
}

function projectArchived<T>(): VideoBriefRepositoryResult<T> {
  return { ok: false, code: 'project_archived' };
}

function mapProductionRequirements(row: VideoBriefRow): ProductionRequirements {
  return mapProductionRequirementsFromDb(row);
}

function mapRequirementsToDb(requirements: ProductionRequirements) {
  return mapProductionRequirementsToDb(requirements);
}

function mapBriefRow(row: VideoBriefRow): PartialVideoBriefDraft {
  return {
    id: row.id,
    projectId: row.project_id,
    sourceType: row.source_type as PartialVideoBriefDraft['sourceType'],
    sourceText: row.source_text,
    sourceUrl: row.source_url,
    workingTitle: row.working_title,
    objective: row.objective,
    targetAudience: row.target_audience,
    publishingDestination:
      row.publishing_destination as PartialVideoBriefDraft['publishingDestination'],
    aspectRatio: row.aspect_ratio as PartialVideoBriefDraft['aspectRatio'],
    videoCategory: row.video_category as PartialVideoBriefDraft['videoCategory'],
    durationSeconds: row.duration_seconds,
    visualStyle: row.visual_style,
    tone: row.tone,
    productionRequirements: mapProductionRequirements(row),
    budgetPriority: row.budget_priority as PartialVideoBriefDraft['budgetPriority'],
    qualityPriority: row.quality_priority as PartialVideoBriefDraft['qualityPriority'],
    userConstraints: row.user_constraints,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseVideoBriefRepository implements VideoBriefRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getByProjectId(
    userId: string,
    projectId: string,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    const project = await this.verifyProjectForRead(userId, projectId);

    if (!project.ok) {
      return project;
    }

    const { data, error } = await (this.supabase as SupabaseClient)
      .from('video_briefs')
      .select(BRIEF_COLUMNS)
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      return persistenceError();
    }

    if (!data) {
      return notFound();
    }

    return { ok: true, data: mapBriefRow(data as unknown as VideoBriefRow) };
  }

  async saveSourceStep(
    userId: string,
    projectId: string,
    input: SourceStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsertStep(userId, projectId, {
      source_type: input.sourceType,
      source_text: input.sourceText,
      source_url: input.sourceUrl,
    });
  }

  async saveObjectiveStep(
    userId: string,
    projectId: string,
    input: ObjectiveStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsertStep(userId, projectId, {
      working_title: input.workingTitle,
      objective: input.objective,
      target_audience: input.targetAudience,
    });
  }

  async saveDestinationStep(
    userId: string,
    projectId: string,
    input: DestinationStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsertStep(userId, projectId, {
      publishing_destination: input.publishingDestination,
      aspect_ratio: input.aspectRatio,
    });
  }

  async saveCategoryStep(
    userId: string,
    projectId: string,
    input: CategoryStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsertStep(userId, projectId, {
      video_category: input.videoCategory,
    });
  }

  async saveDurationStep(
    userId: string,
    projectId: string,
    input: DurationStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsertStep(userId, projectId, {
      duration_seconds: input.durationSeconds,
    });
  }

  async saveStyleStep(
    userId: string,
    projectId: string,
    input: StyleStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsertStep(userId, projectId, {
      visual_style: input.visualStyle,
      tone: input.tone,
    });
  }

  async saveRequirementsStep(
    userId: string,
    projectId: string,
    input: RequirementsStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsertStep(userId, projectId, mapRequirementsToDb(input.productionRequirements));
  }

  async savePrioritiesStep(
    userId: string,
    projectId: string,
    input: PrioritiesStepInput,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    return this.upsertStep(userId, projectId, {
      budget_priority: input.budgetPriority,
      quality_priority: input.qualityPriority,
      user_constraints: input.userConstraints,
    });
  }

  async completeBrief(
    userId: string,
    projectId: string,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    const project = await this.verifyProjectForMutation(userId, projectId);

    if (!project.ok) {
      return project;
    }

    const { error } = await (this.supabase as SupabaseClient).rpc(
      'prompt_pilot_complete_video_brief',
      { project_uuid: projectId },
    );

    if (error) {
      if (error.code === 'P0002') {
        return notFound();
      }

      if (error.code === 'P0003') {
        return projectArchived();
      }

      return persistenceError();
    }

    return this.getByProjectId(userId, projectId);
  }

  private async verifyProjectForRead(
    userId: string,
    projectId: string,
  ): Promise<VideoBriefRepositoryResult<void>> {
    const { data, error } = await this.supabase
      .from('projects')
      .select(PROJECT_ACCESS_COLUMNS)
      .eq('id', projectId)
      .eq('owner_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      return persistenceError();
    }

    if (!data) {
      return notFound();
    }

    return { ok: true, data: undefined };
  }

  private async verifyProjectForMutation(
    userId: string,
    projectId: string,
  ): Promise<VideoBriefRepositoryResult<void>> {
    const { data, error } = await this.supabase
      .from('projects')
      .select(PROJECT_ACCESS_COLUMNS)
      .eq('id', projectId)
      .eq('owner_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      return persistenceError();
    }

    if (!data) {
      return notFound();
    }

    const project = data as ProjectAccessRow;

    if (project.archived_at !== null) {
      return projectArchived();
    }

    return { ok: true, data: undefined };
  }

  private async upsertStep(
    userId: string,
    projectId: string,
    fields: Record<string, string | number | boolean | null>,
  ): Promise<VideoBriefRepositoryResult<PartialVideoBriefDraft>> {
    const project = await this.verifyProjectForMutation(userId, projectId);

    if (!project.ok) {
      return project;
    }

    const { data, error } = await (this.supabase as SupabaseClient)
      .from('video_briefs')
      .upsert(
        {
          project_id: projectId,
          ...fields,
        },
        { onConflict: 'project_id' },
      )
      .select(BRIEF_COLUMNS)
      .single();

    if (error || !data) {
      return persistenceError();
    }

    return { ok: true, data: mapBriefRow(data as unknown as VideoBriefRow) };
  }
}

export function createSupabaseVideoBriefRepository(
  supabase: SupabaseClient<Database>,
): VideoBriefRepository {
  return new SupabaseVideoBriefRepository(supabase);
}
