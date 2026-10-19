import type { EntityId } from '@/domain/canonical/primitives';
import { getCoordinator, resolveUploadScope, uploadJsonResponse } from '@/server/upload/upload-route-helpers';

type RouteContext = {
  params: Promise<{ projectId: string; sessionId: string; chunkIndex: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { projectId, sessionId, chunkIndex: chunkIndexRaw } = await context.params;
  const scopeResult = await resolveUploadScope(projectId);
  if (!scopeResult.ok) {
    return scopeResult.response;
  }

  const chunkIndex = Number.parseInt(chunkIndexRaw, 10);
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
    return uploadJsonResponse({ ok: false, code: 'validation_error', message: 'Invalid chunk index' });
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  const result = await getCoordinator().uploadChunk(
    scopeResult.scope,
    sessionId as EntityId,
    chunkIndex,
    buffer,
    new Date().toISOString(),
  );

  return uploadJsonResponse(result);
}
