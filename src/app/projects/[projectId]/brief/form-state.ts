import type { BriefActionStatus } from '@/domain/videoBriefDraft';

export type BriefFormState = {
  status: BriefActionStatus;
  redirectTo?: string;
  fieldErrors?: Record<string, string | undefined>;
  values?: Record<string, string | boolean | null | undefined>;
};

export const initialBriefFormState: BriefFormState = { status: 'idle' };
