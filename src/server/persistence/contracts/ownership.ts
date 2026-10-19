import type { EntityId } from '@/domain/canonical/primitives';

/**
 * Caller scope for owner-scoped persistence operations (RLS-aligned).
 * Every pivot repository method receives this as the first argument.
 */
export type OwnerScope = {
  ownerId: EntityId;
  projectId: EntityId;
};
