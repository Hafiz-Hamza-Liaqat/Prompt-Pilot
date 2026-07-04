import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MockAudioEditingItem } from '@/domain/mockResultWorkspace';
import { WorkspaceEvaluationBadge } from './workspace-evaluation-badge';
import { WorkspaceSampleBadge } from './workspace-sample-badge';

type WorkspaceAudioEditingPreviewProps = {
  items: MockAudioEditingItem[];
};

export function WorkspaceAudioEditingPreview({ items }: WorkspaceAudioEditingPreviewProps) {
  return (
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
  );
}
