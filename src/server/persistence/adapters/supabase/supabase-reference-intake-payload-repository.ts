import type { SupabaseClient } from '@supabase/supabase-js';
import type { EntityId } from '@/domain/canonical/primitives';
import type {
  CreateReferenceIntakePayloadInput,
  OwnerScope,
  PersistenceResult,
  ReferenceIntakePayloadRecord,
} from '../../contracts';
import type { ReferenceIntakePayloadRepository } from '../../repositories/reference-intake-payload-repository';
import { persistenceFailure, persistenceOk } from './shared';

type ReferenceIntakePayloadRow = {
  reference_id: string;
  project_id: string;
  owner_id: string;
  payload_kind: ReferenceIntakePayloadRecord['payloadKind'];
  body_text: string;
  created_at: string;
};

const PAYLOAD_COLUMNS =
  'reference_id, project_id, owner_id, payload_kind, body_text, created_at';

function mapPayloadRow(row: ReferenceIntakePayloadRow): ReferenceIntakePayloadRecord {
  return {
    referenceId: row.reference_id,
    projectId: row.project_id,
    ownerId: row.owner_id,
    payloadKind: row.payload_kind,
    bodyText: row.body_text,
    createdAt: row.created_at,
  };
}

export class SupabaseReferenceIntakePayloadRepository implements ReferenceIntakePayloadRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async insert(
    scope: OwnerScope,
    input: CreateReferenceIntakePayloadInput,
  ): Promise<PersistenceResult<ReferenceIntakePayloadRecord>> {
    const { data, error } = await this.supabase
      .from('reference_intake_payloads')
      .insert({
        reference_id: input.referenceId,
        project_id: scope.projectId,
        owner_id: scope.ownerId,
        payload_kind: input.payloadKind,
        body_text: input.bodyText,
      })
      .select(PAYLOAD_COLUMNS)
      .single();

    if (error || !data) {
      return persistenceFailure(error);
    }

    return persistenceOk(mapPayloadRow(data as ReferenceIntakePayloadRow));
  }

  async getByReferenceId(
    scope: OwnerScope,
    referenceId: EntityId,
  ): Promise<PersistenceResult<ReferenceIntakePayloadRecord | null>> {
    const { data, error } = await this.supabase
      .from('reference_intake_payloads')
      .select(PAYLOAD_COLUMNS)
      .eq('reference_id', referenceId)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceOk(null);
    }

    return persistenceOk(mapPayloadRow(data as ReferenceIntakePayloadRow));
  }
}
