import type { EntityId } from '@/domain/canonical/primitives';
import { getCoordinator, resolveUploadScope, uploadJsonResponse } from '@/server/upload/upload-route-helpers';

type RouteContext = { params: Promise<{ projectId: string; sessionId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { projectId, sessionId } = await context.params;
  const scopeResult = await resolveUploadScope(projectId);
  if (!scopeResult.ok) {
    return scopeResult.response;
  }

  const result = await getCoordinator().getStatus(scopeResult.scope, sessionId as EntityId);
  return uploadJsonResponse(result);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { projectId, sessionId } = await context.params;
  const scopeResult = await resolveUploadScope(projectId);
  if (!scopeResult.ok) {
    return scopeResult.response;
  }

  let reason: string | undefined;
  try {
    const body = (await request.json()) as { reason?: string };
    reason = body.reason;
  } catch {
    reason = undefined;
  }

  const result = await getCoordinator().cancelUpload(
    scopeResult.scope,
    sessionId as EntityId,
    new Date().toISOString(),
    reason,
  );
  return uploadJsonResponse(result);
}
