import { describe, expect, it } from 'vitest';
import type { EntityId } from '@/domain/canonical/primitives';
import type { OwnerScope, PersistenceResult, ReferenceIntakePayloadRecord } from '@/server/persistence/contracts';
import type { CreateReferenceIntakePayloadInput } from '@/server/persistence/contracts';
import type { ReferenceIntakePayloadRepository } from '@/server/persistence/repositories/reference-intake-payload-repository';
import { SupabaseReferenceIntakePayloadRepository } from '@/server/persistence/adapters/supabase/supabase-reference-intake-payload-repository';

class InMemoryReferenceIntakePayloadRepository implements ReferenceIntakePayloadRepository {
  readonly rows = new Map<string, ReferenceIntakePayloadRecord>();

  async insert(
    scope: OwnerScope,
    input: CreateReferenceIntakePayloadInput,
  ): Promise<PersistenceResult<ReferenceIntakePayloadRecord>> {
    const record: ReferenceIntakePayloadRecord = {
      referenceId: input.referenceId,
      projectId: scope.projectId,
      ownerId: scope.ownerId,
      payloadKind: input.payloadKind,
      bodyText: input.bodyText,
      createdAt: new Date().toISOString(),
    };
    this.rows.set(input.referenceId, record);
    return { ok: true, data: record };
  }

  async getByReferenceId(
    scope: OwnerScope,
    referenceId: EntityId,
  ): Promise<PersistenceResult<ReferenceIntakePayloadRecord | null>> {
    const record = this.rows.get(referenceId);
    if (!record) {
      return { ok: true, data: null };
    }
    if (record.projectId !== scope.projectId || record.ownerId !== scope.ownerId) {
      return { ok: true, data: null };
    }
    return { ok: true, data: record };
  }
}

describe('ReferenceIntakePayloadRepository contract', () => {
  it('loads durable transcript payload by reference id and owner scope', async () => {
    const repo = new InMemoryReferenceIntakePayloadRepository();
    const scope: OwnerScope = {
      ownerId: '11111111-1111-1111-1111-111111111111',
      projectId: '22222222-2222-2222-2222-222222222222',
    };
    const referenceId = '33333333-3333-3333-3333-333333333333';
    const bodyText = 'This transcript is long enough to be loaded for analysis intake hydration.';

    const inserted = await repo.insert(scope, {
      referenceId,
      payloadKind: 'transcript',
      bodyText,
    });

    expect(inserted.ok).toBe(true);

    const loaded = await repo.getByReferenceId(scope, referenceId);
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data?.bodyText).toBe(bodyText);
      expect(loaded.data?.payloadKind).toBe('transcript');
    }

    const otherScope = await repo.getByReferenceId(
      { ownerId: '99999999-9999-9999-9999-999999999999', projectId: scope.projectId },
      referenceId,
    );
    expect(otherScope.ok).toBe(true);
    if (otherScope.ok) {
      expect(otherScope.data).toBeNull();
    }
  });

  it('accepts the Supabase adapter as a structural implementation', () => {
    expect(SupabaseReferenceIntakePayloadRepository).toBeTypeOf('function');
  });
});
