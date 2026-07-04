import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WORKSPACE_TRUTHFULNESS_NOTICES } from '@/config/result-workspace';

export function WorkspacePreviewNotice() {
  return (
    <Alert variant="destructive">
      <AlertTitle>{WORKSPACE_TRUTHFULNESS_NOTICES.previewTitle}</AlertTitle>
      <AlertDescription>{WORKSPACE_TRUTHFULNESS_NOTICES.sampleDisclaimer}</AlertDescription>
    </Alert>
  );
}
