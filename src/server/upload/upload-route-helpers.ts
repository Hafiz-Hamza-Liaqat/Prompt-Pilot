import { NextResponse } from 'next/server';
import type { EntityId } from '@/domain/canonical/primitives';
import { requireUserResult } from '@/server/auth/require-user';
import type { OwnerScope } from '@/server/persistence/contracts/ownership';
import { getUploadCoordinator } from './upload-factory.js';
import { mapUploadCoordinatorErrorToHttpStatus } from './upload-http.js';
import type { UploadCoordinatorResult } from './upload-coordinator.js';

export async function resolveUploadScope(projectId: string): Promise<
  | { ok: true; scope: OwnerScope }
  | { ok: false; response: NextResponse }
> {
  const auth = await requireUserResult();
  if (!auth.ok) {
    return {
      ok: false,
      response: NextResponse.json({ code: 'not_authenticated', message: 'Authentication required' }, { status: 401 }),
    };
  }

  return {
    ok: true,
    scope: {
      ownerId: auth.user.id as EntityId,
      projectId: projectId as EntityId,
    },
  };
}

export function uploadJsonResponse<T>(result: UploadCoordinatorResult<T>, successStatus = 200): NextResponse {
  if (!result.ok) {
    return NextResponse.json(
      { code: result.code, message: result.message },
      { status: mapUploadCoordinatorErrorToHttpStatus(result.code) },
    );
  }
  return NextResponse.json(result.data, { status: successStatus });
}

export function getCoordinator() {
  return getUploadCoordinator();
}
