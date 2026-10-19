import type { ReferenceKind } from '@/domain/canonical';

/** Single source of truth for rights attestation version (PP-11 Slice 4A). */
export const REFERENCE_ATTESTATION_VERSION = '1';

/** Reference kinds exposed in Slice 4A project intake UI. */
export const REFERENCE_INTAKE_KINDS = ['transcript', 'script', 'youtube_url'] as const;

export type ReferenceIntakeKind = (typeof REFERENCE_INTAKE_KINDS)[number];

export const REFERENCE_INTAKE_KIND_LABELS: Record<ReferenceIntakeKind, string> = {
  transcript: 'Transcript',
  script: 'Script',
  youtube_url: 'YouTube URL',
};

export const REFERENCE_INTAKE_TEXT_MIN_LENGTH = 20;
export const REFERENCE_INTAKE_TEXT_MAX_LENGTH = 50_000;

export const REFERENCE_ATTESTATION_POLICY_COPY =
  'I confirm I have the rights to submit this reference for analysis in Prompt Pilot. ' +
  'Prompt Pilot analyzes references to produce planning output; it does not generate or publish videos on my behalf.';

export function isReferenceIntakeKind(value: unknown): value is ReferenceIntakeKind {
  return (
    typeof value === 'string' &&
    (REFERENCE_INTAKE_KINDS as readonly string[]).includes(value)
  );
}

export function isTextReferenceKind(
  kind: ReferenceKind,
): kind is Extract<ReferenceKind, 'transcript' | 'script'> {
  return kind === 'transcript' || kind === 'script';
}
