import { z } from 'zod';
import { IsoDateTimeSchema, PositiveIntegerSchema } from '../common.js';
import { ReferenceKindSchema } from '../canonical/constants.js';
import { EntityIdSchema } from '../canonical/primitives.js';
import { UPLOAD_SESSION_STATES } from './constants.js';
import { StorageLocatorSchema } from './constants.js';
import type { UploadSessionState } from './constants.js';

export const UploadSessionSchema = z.object({
  sessionId: EntityIdSchema,
  projectId: EntityIdSchema,
  ownerId: EntityIdSchema,
  referenceId: EntityIdSchema,
  jobId: EntityIdSchema.optional(),
  referenceKind: ReferenceKindSchema,
  state: z.enum(UPLOAD_SESSION_STATES),
  expectedBytes: PositiveIntegerSchema.optional(),
  uploadedBytes: z.number().int().nonnegative().default(0),
  chunkSizeBytes: PositiveIntegerSchema.optional(),
  mimeType: z.string().trim().min(1).optional(),
  contentHash: z.string().trim().min(1).optional(),
  storageLocator: StorageLocatorSchema.optional(),
  expiresAt: IsoDateTimeSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  completedAt: IsoDateTimeSchema.optional(),
});

export type UploadSession = z.infer<typeof UploadSessionSchema>;

export function isUploadSessionTerminal(state: UploadSessionState): boolean {
  return state === 'completed' || state === 'cancelled' || state === 'expired' || state === 'failed';
}

export function canResumeUploadSession(session: UploadSession): boolean {
  return session.state === 'uploading' || session.state === 'paused';
}
