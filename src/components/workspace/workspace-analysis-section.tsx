import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { AnalysisViewModel } from '@/domain/workspace/analysis-display';
import type { WorkspaceIntelligenceViewModel } from '@/domain/workspace/workspace-display';
import { resolveAnalysisSectionState } from '@/domain/workspace/analysis-section-state';
import { WorkspaceEmptyState } from './workspace-empty-state';
import { WorkspaceAnalysisPanels } from './workspace-analysis-panels';

type WorkspaceAnalysisSectionProps = {
  analysis: AnalysisViewModel | null;
  intelligence: WorkspaceIntelligenceViewModel;
  projectId: string;
};

export function WorkspaceAnalysisSection({
  analysis,
  intelligence,
  projectId,
}: WorkspaceAnalysisSectionProps) {
  const state = resolveAnalysisSectionState({
    analysis,
    activeJobState: intelligence.activeJobState,
  });

  if (state === 'populated' && analysis !== null) {
    return <WorkspaceAnalysisPanels analysis={analysis} />;
  }

  if (state === 'running') {
    return (
      <Alert>
        <AlertTitle>Reference analysis in progress</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            Prompt Pilot is processing the submitted reference. This workspace will show persisted
            analysis when the job completes — no partial analysis is displayed here.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${projectId}`}>Return to project</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (state === 'failed') {
    return (
      <Alert variant="destructive">
        <AlertTitle>Reference analysis did not complete</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            The most recent analysis job did not produce a persisted result. Review the project
            page for job details and retry options when available.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${projectId}`}>Return to project</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <WorkspaceEmptyState
      title="No reference analysis yet"
      description="Submit a reference from the project page to generate persisted analysis for this workspace. Prompt Pilot displays saved analysis only — it does not regenerate content in this view."
    />
  );
}
