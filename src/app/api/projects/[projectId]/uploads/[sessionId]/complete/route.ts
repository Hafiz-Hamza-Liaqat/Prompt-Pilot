import type { EntityId } from '@/domain/canonical/primitives';
import type { CompleteUploadRequestDto } from '@/server/upload/upload-dtos';
import { NextResponse } from 'next/server';
import { getCoordinator, resolveUploadScope, uploadJsonResponse } from '@/server/upload/upload-route-helpers';

type RouteContext = { params: Promise<{ projectId: string; sessionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { projectId, sessionId } = await context.params;
  const scopeResult = await resolveUploadScope(projectId);
  if (!scopeResult.ok) {
    return scopeResult.response;
  }

  let body: CompleteUploadRequestDto;
  try {
    body = (await request.json()) as CompleteUploadRequestDto;
  } catch {
    return NextResponse.json({ code: 'validation_error', message: 'Invalid JSON body' }, { status: 400 });
  }

  const result = await getCoordinator().completeUpload(
    scopeResult.scope,
    sessionId as EntityId,
    body,
    new Date().toISOString(),
  );

  return uploadJsonResponse(result);
}
