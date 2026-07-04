import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  WORKSPACE_DETERMINISTIC_BADGE_LABEL,
  WORKSPACE_SCENE_ROADMAP_NOTICE,
} from '@/config/result-workspace';
import type { SceneDecomposition } from '@/domain/sceneDecomposition';
import { formatSceneBoundary } from '@/domain/sceneDecomposition';

type WorkspaceSceneRoadmapProps = {
  decomposition: SceneDecomposition;
};

const PACING_LABELS: Record<SceneDecomposition['scenes'][number]['pacingEmphasis'], string> = {
  hook: 'Hook',
  setup: 'Setup',
  develop: 'Develop',
  focus: 'Focus',
  proof: 'Proof',
  close: 'Close',
};

export function WorkspaceSceneRoadmap({ decomposition }: WorkspaceSceneRoadmapProps) {
  const totalDuration = decomposition.totalDurationSeconds;

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>Deterministic duration decomposition</AlertTitle>
        <AlertDescription>{WORKSPACE_SCENE_ROADMAP_NOTICE}</AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{WORKSPACE_DETERMINISTIC_BADGE_LABEL}</Badge>
        <span>
          Total duration: {formatSceneBoundary(totalDuration)} ({totalDuration}s)
        </span>
        <span aria-hidden="true">·</span>
        <span>Scene count: {decomposition.sceneCount}</span>
      </div>

      <div className="grid gap-4">
        {decomposition.scenes.map((scene) => {
          const widthPercent = (scene.durationSeconds / totalDuration) * 100;

          return (
            <Card key={scene.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">
                    {scene.order}. {scene.label}
                  </CardTitle>
                  <Badge variant="outline">{WORKSPACE_DETERMINISTIC_BADGE_LABEL}</Badge>
                  <Badge variant="outline">{PACING_LABELS[scene.pacingEmphasis]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-foreground">Start</dt>
                    <dd>{formatSceneBoundary(scene.startSecond)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">End</dt>
                    <dd>{formatSceneBoundary(scene.endSecond)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Duration</dt>
                    <dd>{scene.durationSeconds}s</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Pacing emphasis</dt>
                    <dd>{PACING_LABELS[scene.pacingEmphasis]}</dd>
                  </div>
                </dl>
                <div
                  role="img"
                  aria-label={`Scene ${scene.order} occupies ${scene.durationSeconds} of ${totalDuration} seconds`}
                  className="h-2 w-full overflow-hidden rounded-full border bg-muted"
                >
                  <div
                    className="h-full bg-foreground/70"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
