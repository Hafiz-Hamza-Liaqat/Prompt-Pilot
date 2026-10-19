import { randomUUID } from 'node:crypto';
import type { ReferenceKind } from '@/domain/canonical';
import type { EntityId } from '@/domain/canonical/primitives';
import type { ReferenceIntakeFormInput } from '@/app/projects/[projectId]/reference/validation';
import { normalizeUrl } from '@/server/link/url-normalizer';
import type { CreateReferenceInput, OwnerScope } from '@/server/persistence/contracts';
import type { AttestationRepository } from '@/server/persistence/repositories/attestation-repository';
import type { ReferenceIntakePayloadRepository } from '@/server/persistence/repositories/reference-intake-payload-repository';
import type { ReferenceRepository } from '@/server/persistence/repositories/reference-repository';

export type ReferenceCreatedResult = {
  attestationId: EntityId;
  referenceId: EntityId;
  referenceKind: ReferenceKind;
};

export type ReferenceIntakeServiceErrorCode =
  | 'invalid_url'
  | 'persistence_error';

export type ReferenceIntakeServiceResult =
  | { ok: true; data: ReferenceCreatedResult }
  | { ok: false; code: ReferenceIntakeServiceErrorCode; message: string };

export type ReferenceIntakeServiceDeps = {
  attestationRepository: AttestationRepository;
  referenceRepository: ReferenceRepository;
  referenceIntakePayloadRepository: ReferenceIntakePayloadRepository;
  idGenerator?: () => EntityId;
};

export type ReferenceIntakeBuildInputResult =
  | { ok: true; data: CreateReferenceInput }
  | { ok: false; code: ReferenceIntakeServiceErrorCode; message: string };

export class ReferenceIntakeService {
  private readonly idGenerator: () => EntityId;

  constructor(private readonly deps: ReferenceIntakeServiceDeps) {
    this.idGenerator = deps.idGenerator ?? (() => randomUUID());
  }

  async submitIntake(
    scope: OwnerScope,
    input: ReferenceIntakeFormInput,
  ): Promise<ReferenceIntakeServiceResult> {
    const attestationId = this.idGenerator();
    const referenceId = this.idGenerator();

    const attestationResult = await this.deps.attestationRepository.insert(
      scope,
      { attestationVersion: input.attestationVersion },
      attestationId,
    );

    if (!attestationResult.ok) {
      return {
        ok: false,
        code: 'persistence_error',
        message: 'Unable to record rights attestation. Try again in a moment.',
      };
    }

    const referenceInputResult = this.buildReferenceInput(input, attestationId);
    if (!referenceInputResult.ok) {
      return referenceInputResult;
    }

    const referenceResult = await this.deps.referenceRepository.insert(
      scope,
      referenceInputResult.data,
      referenceId,
    );

    if (!referenceResult.ok) {
      return {
        ok: false,
        code: 'persistence_error',
        message: 'Unable to save the reference. Try again in a moment.',
      };
    }

    if (input.referenceKind === 'transcript' || input.referenceKind === 'script') {
      const payloadResult = await this.deps.referenceIntakePayloadRepository.insert(scope, {
        referenceId,
        payloadKind: input.referenceKind,
        bodyText: input.bodyText,
      });

      if (!payloadResult.ok) {
        return {
          ok: false,
          code: 'persistence_error',
          message: 'Unable to save reference content. Try again in a moment.',
        };
      }
    }

    return {
      ok: true,
      data: {
        attestationId,
        referenceId,
        referenceKind: input.referenceKind,
      },
    };
  }

  private buildReferenceInput(
    input: ReferenceIntakeFormInput,
    attestationId: EntityId,
  ): ReferenceIntakeBuildInputResult {
    if (input.referenceKind === 'youtube_url') {
      const normalized = normalizeUrl(input.canonicalUrl);
      if (!normalized.ok) {
        return {
          ok: false,
          code: 'invalid_url',
          message:
            normalized.code === 'unsupported_platform'
              ? 'Only supported YouTube URLs can be submitted in this phase.'
              : 'Enter a valid HTTPS YouTube URL.',
        };
      }

      return {
        ok: true,
        data: {
          referenceKind: 'youtube_url',
          platform: 'youtube',
          canonicalUrl: normalized.data.canonicalUrl,
          platformContentId: normalized.data.platformContentId,
          accessStatus: 'public',
          rightsAttestationId: attestationId,
        },
      };
    }

    return {
      ok: true,
      data: {
        referenceKind: input.referenceKind,
        accessStatus: 'public',
        rightsAttestationId: attestationId,
      },
    };
  }
}

export function createReferenceIntakeService(
  deps: ReferenceIntakeServiceDeps,
): ReferenceIntakeService {
  return new ReferenceIntakeService(deps);
}
