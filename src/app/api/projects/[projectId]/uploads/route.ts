import { NextResponse } from 'next/server';
import type { InitiateUploadRequestDto } from '@/server/upload/upload-dtos';
import { getCoordinator, resolveUploadScope, uploadJsonResponse } from '@/server/upload/upload-route-helpers';

type RouteContext = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const scopeResult = await resolveUploadScope(projectId);
  if (!scopeResult.ok) {
    return scopeResult.response;
  }

  let body: InitiateUploadRequestDto;
  try {
    body = (await request.json()) as InitiateUploadRequestDto;
  } catch {
    return NextResponse.json({ code: 'validation_error', message: 'Invalid JSON body' }, { status: 400 });
  }

  const result = await getCoordinator().initiateUpload({
    ...body,
    projectId: scopeResult.scope.projectId,
    ownerId: scopeResult.scope.ownerId,
    occurredAt: new Date().toISOString(),
  });

  return uploadJsonResponse(result, 201);
}
