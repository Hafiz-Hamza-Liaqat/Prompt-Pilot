'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { completeBriefAction } from '@/app/projects/[projectId]/brief/actions';
import { initialBriefFormState } from '@/app/projects/[projectId]/brief/form-state';
import { BriefActionMessage } from '@/components/briefs/brief-action-message';
import { useBriefFormRedirect } from '@/components/briefs/use-brief-form-redirect';
import { SubmitButton } from '@/components/forms/submit-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ASPECT_RATIO_OPTIONS,
  BUDGET_PRIORITY_OPTIONS,
  CATEGORY_OPTIONS,
  DESTINATION_OPTIONS,
  getOptionLabel,
  PRODUCTION_REQUIREMENT_OPTIONS,
  QUALITY_PRIORITY_OPTIONS,
  REVIEW_SCRIPT_PREVIEW_LENGTH,
  SOURCE_TYPE_OPTIONS,
} from '@/config/video-brief-wizard';
import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';

type BriefReviewProps = {
  projectId: string;
  draft: PartialVideoBriefDraft;
};

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[180px_1fr]">
      <dt className="text-sm font-medium text-foreground">{label}</dt>
      <dd className="text-sm text-muted-foreground">{value}</dd>
    </div>
  );
}

function renderSourceSummary(draft: PartialVideoBriefDraft): React.ReactNode {
  if (draft.sourceType === 'idea' || draft.sourceType === 'script') {
    const text = draft.sourceText ?? '';
    const isTruncated = text.length > REVIEW_SCRIPT_PREVIEW_LENGTH;
    const preview = isTruncated ? `${text.slice(0, REVIEW_SCRIPT_PREVIEW_LENGTH)}…` : text;

    return (
      <span>
        {preview}
        {isTruncated ? (
          <span className="mt-1 block text-xs text-muted-foreground">
            Showing first {REVIEW_SCRIPT_PREVIEW_LENGTH} of {text.length} characters. Full text
            remains saved in your brief.
          </span>
        ) : null}
      </span>
    );
  }

  if (draft.sourceUrl) {
    return (
      <a
        href={draft.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-brand underline-offset-4 hover:underline"
      >
        {draft.sourceUrl}
      </a>
    );
  }

  return 'Not set';
}

function renderEnabledRequirements(draft: PartialVideoBriefDraft): React.ReactNode {
  const requirements = draft.productionRequirements;

  if (!requirements) {
    return 'None selected';
  }

  const enabled = PRODUCTION_REQUIREMENT_OPTIONS.filter(
    (option) => requirements[option.value],
  ).map((option) => option.label);

  return enabled.length > 0 ? enabled.join(', ') : 'None selected';
}

export function BriefReview({ projectId, draft }: BriefReviewProps) {
  const [state, formAction] = useActionState(completeBriefAction, initialBriefFormState);
  useBriefFormRedirect(state);

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>Review your saved brief</AlertTitle>
        <AlertDescription>
          Provider recommendations and production planning are added in later phases.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Brief summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <ReviewRow
              label="Source type"
              value={getOptionLabel(SOURCE_TYPE_OPTIONS, draft.sourceType ?? undefined)}
            />
            <ReviewRow label="Source input" value={renderSourceSummary(draft)} />
            <ReviewRow label="Working title" value={draft.workingTitle ?? 'Not set'} />
            <ReviewRow label="Objective" value={draft.objective ?? 'Not set'} />
            <ReviewRow label="Target audience" value={draft.targetAudience ?? 'Not set'} />
            <ReviewRow
              label="Publishing destination"
              value={getOptionLabel(DESTINATION_OPTIONS, draft.publishingDestination ?? undefined)}
            />
            <ReviewRow
              label="Aspect ratio"
              value={getOptionLabel(ASPECT_RATIO_OPTIONS, draft.aspectRatio ?? undefined)}
            />
            <ReviewRow
              label="Video category"
              value={getOptionLabel(CATEGORY_OPTIONS, draft.videoCategory ?? undefined)}
            />
            <ReviewRow
              label="Duration"
              value={
                draft.durationSeconds ? `${draft.durationSeconds} seconds` : 'Not set'
              }
            />
            <ReviewRow label="Visual style" value={draft.visualStyle ?? 'Not set'} />
            <ReviewRow label="Tone" value={draft.tone ?? 'Not set'} />
            <ReviewRow
              label="Production requirements"
              value={renderEnabledRequirements(draft)}
            />
            <ReviewRow
              label="Budget priority"
              value={getOptionLabel(BUDGET_PRIORITY_OPTIONS, draft.budgetPriority ?? undefined)}
            />
            <ReviewRow
              label="Quality priority"
              value={getOptionLabel(QUALITY_PRIORITY_OPTIONS, draft.qualityPriority ?? undefined)}
            />
            <ReviewRow
              label="Optional constraints"
              value={draft.userConstraints ?? 'None provided'}
            />
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}/brief/source`}>Edit source</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}/brief/objective`}>Edit objective</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}/brief/destination`}>Edit destination</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}/brief/category`}>Edit category</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}/brief/duration`}>Edit duration</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}/brief/style`}>Edit style</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}/brief/requirements`}>Edit requirements</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}/brief/priorities`}>Edit priorities</Link>
        </Button>
      </div>

      <form action={formAction} className="rounded-lg border border-border p-4">
        <input type="hidden" name="projectId" value={projectId} />
        <BriefActionMessage status={state.status} />
        <SubmitButton pendingText="Marking brief ready...">Mark brief ready</SubmitButton>
      </form>
    </div>
  );
}
