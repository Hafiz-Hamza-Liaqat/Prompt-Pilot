import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WORKSPACE_TRUTHFULNESS_NOTICES } from '@/config/result-workspace';
import type { MockResultWorkspaceViewModel } from '@/domain/mockResultWorkspace';
import { BriefStatusBadge } from '@/components/briefs/brief-status-badge';
import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';

type WorkspaceOverviewProps = {
  project: MockResultWorkspaceViewModel['project'];
  brief: MockResultWorkspaceViewModel['brief'];
};

export function WorkspaceOverview({ project, brief }: WorkspaceOverviewProps) {
  const briefDraft = {
    id: brief.id,
    projectId: brief.projectId,
    workingTitle: brief.workingTitle,
    completedAt: brief.completedAt,
    createdAt: brief.completedAt,
    updatedAt: brief.completedAt,
  } satisfies PartialVideoBriefDraft;

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>Preview status</AlertTitle>
        <AlertDescription className="space-y-1">
          <p>{WORKSPACE_TRUTHFULNESS_NOTICES.overviewPreviewStatus}</p>
          <p>{WORKSPACE_TRUTHFULNESS_NOTICES.overviewNoPlan}</p>
          <p>{WORKSPACE_TRUTHFULNESS_NOTICES.overviewNoRecommendation}</p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Project context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Title:</span> {project.title}
          </p>
          <p>
            <span className="font-medium text-foreground">Description:</span>{' '}
            {project.description ?? 'No description provided.'}
          </p>
          <p>
            <span className="font-medium text-foreground">Project state:</span>{' '}
            {project.status === 'archived' ? 'Archived' : 'Active'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>Completed brief summary</CardTitle>
          <BriefStatusBadge draft={briefDraft} />
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <p>
            <span className="font-medium text-foreground">Working title:</span> {brief.workingTitle}
          </p>
          <p>
            <span className="font-medium text-foreground">Duration:</span> {brief.durationSeconds}s
          </p>
          <p className="sm:col-span-2">
            <span className="font-medium text-foreground">Objective:</span> {brief.objective}
          </p>
          <p>
            <span className="font-medium text-foreground">Audience:</span> {brief.targetAudience}
          </p>
          <p>
            <span className="font-medium text-foreground">Destination:</span>{' '}
            {brief.publishingDestination}
          </p>
          <p>
            <span className="font-medium text-foreground">Aspect ratio:</span> {brief.aspectRatio}
          </p>
          <p>
            <span className="font-medium text-foreground">Category:</span> {brief.videoCategory}
          </p>
          <p>
            <span className="font-medium text-foreground">Visual style:</span> {brief.visualStyle}
          </p>
          <p>
            <span className="font-medium text-foreground">Tone:</span> {brief.tone}
          </p>
          <p>
            <span className="font-medium text-foreground">Budget priority:</span>{' '}
            {brief.budgetPriority}
          </p>
          <p>
            <span className="font-medium text-foreground">Quality priority:</span>{' '}
            {brief.qualityPriority}
          </p>
          <p className="sm:col-span-2">
            <span className="font-medium text-foreground">Source preview:</span> {brief.sourcePreview}
          </p>
          <p>
            <span className="font-medium text-foreground">Source character count:</span>{' '}
            {brief.sourceCharacterCount}
          </p>
          {brief.sourceUrl ? (
            <p className="sm:col-span-2">
              <span className="font-medium text-foreground">Source URL:</span>{' '}
              <a
                href={brief.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand no-underline hover:text-brand/80"
              >
                Open submitted source link
              </a>
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <p className="font-medium text-foreground">Enabled production requirements</p>
            {brief.enabledRequirementLabels.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {brief.enabledRequirementLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1">No optional production requirements selected.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
