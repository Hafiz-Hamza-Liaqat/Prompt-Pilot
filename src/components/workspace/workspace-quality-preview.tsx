import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WORKSPACE_TRUTHFULNESS_NOTICES } from '@/config/result-workspace';
import type { MockQualityItem } from '@/domain/mockResultWorkspace';
import { WorkspaceEvaluationBadge } from './workspace-evaluation-badge';
import { WorkspaceSampleBadge } from './workspace-sample-badge';

type WorkspaceQualityPreviewProps = {
  items: MockQualityItem[];
};

export function WorkspaceQualityPreview({ items }: WorkspaceQualityPreviewProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>Interface preview</AlertTitle>
        <AlertDescription>{WORKSPACE_TRUTHFULNESS_NOTICES.qualityInactiveNotice}</AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.key}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{item.label}</CardTitle>
                <WorkspaceSampleBadge />
                <WorkspaceEvaluationBadge state={item.evaluationState} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.sampleNote}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
