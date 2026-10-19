import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type {
  CreateAttestationInput,
  OwnerScope,
  PersistenceResult,
  RightsAttestationRecord,
} from '../../src/server/persistence/contracts/index.js';
import { SupabaseAttestationRepository } from '../../src/server/persistence/adapters/supabase/supabase-attestation-repository.js';
import type { AttestationRepository } from '../../src/server/persistence/repositories/attestation-repository.js';
import { REFERENCE_ATTESTATION_VERSION } from '../../src/config/reference-intake.js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const hasLocalSupabase = Boolean(url && publishableKey);

function randomSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

class InMemoryAttestationRepository implements AttestationRepository {
  readonly records: RightsAttestationRecord[] = [];

  async insert(
    scope: OwnerScope,
    input: CreateAttestationInput,
    attestationId: string,
  ): Promise<PersistenceResult<RightsAttestationRecord>> {
    const now = new Date().toISOString();
    const record: RightsAttestationRecord = {
      attestationId,
      projectId: scope.projectId,
      ownerId: scope.ownerId,
      attestationVersion: input.attestationVersion,
      acceptedAt: now,
      createdAt: now,
    };
    this.records.push(record);
    return { ok: true, data: record };
  }
}

describe('AttestationRepository contract', () => {
  it('accepts an in-memory structural implementation', async () => {
    const repo = new InMemoryAttestationRepository();
    const scope: OwnerScope = {
      ownerId: '11111111-1111-1111-1111-111111111111',
      projectId: '22222222-2222-2222-2222-222222222222',
    };
    const attestationId = '33333333-3333-3333-3333-333333333333';

    const result = await repo.insert(
      scope,
      { attestationVersion: REFERENCE_ATTESTATION_VERSION },
      attestationId,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.attestationId).toBe(attestationId);
      expect(result.data.projectId).toBe(scope.projectId);
      expect(result.data.ownerId).toBe(scope.ownerId);
      expect(result.data.attestationVersion).toBe(REFERENCE_ATTESTATION_VERSION);
    }
  });
});

describe.skipIf(!hasLocalSupabase)('SupabaseAttestationRepository integration', () => {
  let client: SupabaseClient;
  let ownerId: string;
  let projectId: string;
  let scope: OwnerScope;

  beforeAll(async () => {
    const email = `attestation-repo-${randomSuffix()}@test.local`;
    const password = `Pw-${randomSuffix()}!`;

    client = createClient(url!, publishableKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const signup = await client.auth.signUp({
      email,
      password,
      options: { data: { display_name: 'Attestation Repo Test' } },
    });

    if (!signup.data.session) {
      throw new Error('Failed to sign up integration test user');
    }

    ownerId = signup.data.user!.id;

    const { data: project } = await client
      .from('projects')
      .insert({ owner_id: ownerId, title: 'Attestation Repository Project' })
      .select('id')
      .single();

    if (!project) {
      throw new Error('Failed to create project');
    }

    projectId = project.id;
    scope = { ownerId, projectId };
  });

  afterAll(async () => {
    await client.auth.signOut();
  });

  it('inserts a rights attestation row scoped to owner and project', async () => {
    const repo = new SupabaseAttestationRepository(client);
    const attestationId = crypto.randomUUID();

    const result = await repo.insert(
      scope,
      { attestationVersion: REFERENCE_ATTESTATION_VERSION },
      attestationId,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.attestationId).toBe(attestationId);
      expect(result.data.projectId).toBe(projectId);
      expect(result.data.ownerId).toBe(ownerId);
      expect(result.data.attestationVersion).toBe(REFERENCE_ATTESTATION_VERSION);
      expect(result.data.acceptedAt).toBeTruthy();
      expect(result.data.createdAt).toBeTruthy();
    }
  });
});
