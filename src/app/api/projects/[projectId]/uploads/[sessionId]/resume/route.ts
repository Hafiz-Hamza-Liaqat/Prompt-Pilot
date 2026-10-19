import type { EntityId } from '@/domain/canonical/primitives';
import { getCoordinator, resolveUploadScope, uploadJsonResponse } from '@/server/upload/upload-route-helpers';

type RouteContext = { params: Promise<{ projectId: string; sessionId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { projectId, sessionId } = await context.params;
  const scopeResult = await resolveUploadScope(projectId);
  if (!scopeResult.ok) {
    return scopeResult.response;
  }

  const result = await getCoordinator().resumeUpload(
    scopeResult.scope,
    sessionId as EntityId,
    new Date().toISOString(),
  );

  return uploadJsonResponse(result);
}
