import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WORKSPACE_TRUTHFULNESS_NOTICES } from '@/config/result-workspace';
import type { MockPromptSection } from '@/domain/mockResultWorkspace';
import { WorkspaceSampleBadge } from './workspace-sample-badge';

type WorkspacePromptPreviewProps = {
  sections: MockPromptSection[];
};

export function WorkspacePromptPreview({ sections }: WorkspacePromptPreviewProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>Interface preview</AlertTitle>
        <AlertDescription>{WORKSPACE_TRUTHFULNESS_NOTICES.promptInactiveNotice}</AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.key}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{section.label}</CardTitle>
                <WorkspaceSampleBadge />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{section.sampleContent}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
