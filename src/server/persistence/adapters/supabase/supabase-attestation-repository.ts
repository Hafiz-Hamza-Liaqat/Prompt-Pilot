import type { SupabaseClient } from '@supabase/supabase-js';
import type { EntityId } from '@/domain/canonical/primitives';
import type {
  CreateAttestationInput,
  OwnerScope,
  PersistenceResult,
  RightsAttestationRecord,
} from '../../contracts';
import type { AttestationRepository } from '../../repositories/attestation-repository';
import { persistenceFailure, persistenceOk } from './shared';

type RightsAttestationRow = {
  id: string;
  project_id: string;
  owner_id: string;
  attestation_version: string;
  accepted_at: string;
  created_at: string;
};

const ATTESTATION_COLUMNS =
  'id, project_id, owner_id, attestation_version, accepted_at, created_at';

function mapAttestationRow(row: RightsAttestationRow): RightsAttestationRecord {
  return {
    attestationId: row.id,
    projectId: row.project_id,
    ownerId: row.owner_id,
    attestationVersion: row.attestation_version,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

export class SupabaseAttestationRepository implements AttestationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async insert(
    scope: OwnerScope,
    input: CreateAttestationInput,
    attestationId: EntityId,
  ): Promise<PersistenceResult<RightsAttestationRecord>> {
    const { data, error } = await this.supabase
      .from('rights_attestations')
      .insert({
        id: attestationId,
        project_id: scope.projectId,
        owner_id: scope.ownerId,
        attestation_version: input.attestationVersion,
      })
      .select(ATTESTATION_COLUMNS)
      .single();

    if (error || !data) {
      return persistenceFailure(error);
    }

    return persistenceOk(mapAttestationRow(data as RightsAttestationRow));
  }
}
