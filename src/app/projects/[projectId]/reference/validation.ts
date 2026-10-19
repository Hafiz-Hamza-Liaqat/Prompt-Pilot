import { z } from 'zod';
import { projectIdSchema } from '@/domain/project';
import {
  REFERENCE_ATTESTATION_VERSION,
  REFERENCE_INTAKE_KINDS,
  REFERENCE_INTAKE_TEXT_MAX_LENGTH,
  REFERENCE_INTAKE_TEXT_MIN_LENGTH,
} from '@/config/reference-intake';

const attestationAcceptedSchema = z.literal(true, {
  message: 'Rights attestation is required before submitting a reference.',
});

const baseIntakeSchema = z.object({
  projectId: projectIdSchema,
  referenceKind: z.enum(REFERENCE_INTAKE_KINDS),
  attestationAccepted: attestationAcceptedSchema,
  attestationVersion: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .default(REFERENCE_ATTESTATION_VERSION),
});

const textBodySchema = z
  .string()
  .trim()
  .min(
    REFERENCE_INTAKE_TEXT_MIN_LENGTH,
    `Text must be at least ${REFERENCE_INTAKE_TEXT_MIN_LENGTH} characters.`,
  )
  .max(
    REFERENCE_INTAKE_TEXT_MAX_LENGTH,
    `Text must be at most ${REFERENCE_INTAKE_TEXT_MAX_LENGTH} characters.`,
  );

export const referenceIntakeFormSchema = z.discriminatedUnion('referenceKind', [
  baseIntakeSchema.extend({
    referenceKind: z.literal('transcript'),
    bodyText: textBodySchema,
  }),
  baseIntakeSchema.extend({
    referenceKind: z.literal('script'),
    bodyText: textBodySchema,
  }),
  baseIntakeSchema.extend({
    referenceKind: z.literal('youtube_url'),
    canonicalUrl: z.string().trim().min(1, 'YouTube URL is required.'),
  }),
]);

export type ReferenceIntakeFormInput = z.infer<typeof referenceIntakeFormSchema>;

export function mapReferenceIntakeFieldErrors(
  error: z.ZodError,
): Record<string, string | undefined> {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string | undefined> = {};

  for (const [key, messages] of Object.entries(flattened)) {
    if (Array.isArray(messages) && messages[0]) {
      fieldErrors[key] = messages[0];
    }
  }

  return fieldErrors;
}

export function parseReferenceIntakeForm(
  input: Record<string, unknown>,
):
  | { ok: true; data: ReferenceIntakeFormInput }
  | { ok: false; fieldErrors: Record<string, string | undefined> } {
  const parsed = referenceIntakeFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, fieldErrors: mapReferenceIntakeFieldErrors(parsed.error) };
  }

  return { ok: true, data: parsed.data };
}

export function parseReferenceIntakeFormData(formData: FormData):
  | { ok: true; data: ReferenceIntakeFormInput }
  | { ok: false; fieldErrors: Record<string, string | undefined> } {
  const attestationAccepted = formData.get('attestationAccepted') === 'on';

  return parseReferenceIntakeForm({
    projectId: formData.get('projectId'),
    referenceKind: formData.get('referenceKind'),
    attestationAccepted,
    attestationVersion: formData.get('attestationVersion') ?? REFERENCE_ATTESTATION_VERSION,
    bodyText: formData.get('bodyText') ?? undefined,
    canonicalUrl: formData.get('canonicalUrl') ?? undefined,
  });
}

export const startAnalysisJobFormSchema = z.object({
  projectId: projectIdSchema,
  referenceId: z.string().uuid('Reference ID must be a valid UUID.'),
  referenceKind: z.enum(REFERENCE_INTAKE_KINDS),
});

export type StartAnalysisJobFormInput = z.infer<typeof startAnalysisJobFormSchema>;

export function parseStartAnalysisJobForm(
  input: Record<string, unknown>,
):
  | { ok: true; data: StartAnalysisJobFormInput }
  | { ok: false; fieldErrors: Record<string, string | undefined> } {
  const parsed = startAnalysisJobFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, fieldErrors: mapReferenceIntakeFieldErrors(parsed.error) };
  }

  return { ok: true, data: parsed.data };
}

export function parseStartAnalysisJobFormData(formData: FormData):
  | { ok: true; data: StartAnalysisJobFormInput }
  | { ok: false; fieldErrors: Record<string, string | undefined> } {
  return parseStartAnalysisJobForm({
    projectId: formData.get('projectId'),
    referenceId: formData.get('referenceId'),
    referenceKind: formData.get('referenceKind'),
  });
}

export const jobStatusQuerySchema = z.object({
  projectId: projectIdSchema,
});

export type JobStatusQueryInput = z.infer<typeof jobStatusQuerySchema>;

export function parseJobStatusQuery(
  input: Record<string, unknown>,
):
  | { ok: true; data: JobStatusQueryInput }
  | { ok: false; fieldErrors: Record<string, string | undefined> } {
  const parsed = jobStatusQuerySchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, fieldErrors: mapReferenceIntakeFieldErrors(parsed.error) };
  }

  return { ok: true, data: parsed.data };
}
