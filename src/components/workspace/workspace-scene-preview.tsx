import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WORKSPACE_TRUTHFULNESS_NOTICES } from '@/config/result-workspace';
import type { MockScene } from '@/domain/mockResultWorkspace';
import { WorkspaceSampleBadge } from './workspace-sample-badge';

type WorkspaceScenePreviewProps = {
  scenes: MockScene[];
};

export function WorkspaceScenePreview({ scenes }: WorkspaceScenePreviewProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>Interface preview</AlertTitle>
        <AlertDescription>{WORKSPACE_TRUTHFULNESS_NOTICES.sceneFutureNotice}</AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {scenes.map((scene) => (
          <Card key={scene.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">
                  {scene.order}. {scene.label}
                </CardTitle>
                <WorkspaceSampleBadge />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Purpose:</span> {scene.purpose}
              </p>
              <p>{scene.sampleContent}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
