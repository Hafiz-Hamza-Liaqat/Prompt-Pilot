import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WORKSPACE_SECTION_LABELS } from '@/config/result-workspace';
import type { MockResultWorkspaceViewModel } from '@/domain/mockResultWorkspace';
import { WorkspaceAudioEditingPreview } from './workspace-audio-editing-preview';
import { WorkspaceContinuityPreview } from './workspace-continuity-preview';
import { WorkspaceHeader } from './workspace-header';
import { WorkspaceOverview } from './workspace-overview';
import { WorkspacePreviewNotice } from './workspace-preview-notice';
import { WorkspacePromptPreview } from './workspace-prompt-preview';
import { WorkspaceProviderReference } from './workspace-provider-reference';
import { WorkspaceQualityPreview } from './workspace-quality-preview';
import { WorkspaceScenePreview } from './workspace-scene-preview';
import { WorkspaceSectionHeading } from './workspace-section-heading';
import { WorkspaceSectionNav } from './workspace-section-nav';

type WorkspaceShellProps = {
  workspace: MockResultWorkspaceViewModel;
};

function renderActiveSection(workspace: MockResultWorkspaceViewModel) {
  switch (workspace.activeSection) {
    case 'providers':
      return <WorkspaceProviderReference providers={workspace.providers} />;
    case 'scenes':
      return <WorkspaceScenePreview scenes={workspace.sampleScenes} />;
    case 'prompts':
      return <WorkspacePromptPreview sections={workspace.samplePromptSections} />;
    case 'continuity':
      return <WorkspaceContinuityPreview items={workspace.continuityItems} />;
    case 'audio-editing':
      return <WorkspaceAudioEditingPreview items={workspace.audioEditingItems} />;
    case 'quality':
      return <WorkspaceQualityPreview items={workspace.qualityItems} />;
    case 'overview':
    default:
      return <WorkspaceOverview project={workspace.project} brief={workspace.brief} />;
  }
}

export function WorkspaceShell({ workspace }: WorkspaceShellProps) {
  return (
    <div className="space-y-8">
      <WorkspacePreviewNotice />
      <WorkspaceHeader project={workspace.project} briefTitle={workspace.brief.workingTitle} />
      <WorkspaceSectionNav
        projectId={workspace.project.id}
        activeSection={workspace.activeSection}
      />
      <section aria-labelledby="workspace-section-heading" className="space-y-6">
        <WorkspaceSectionHeading
          section={workspace.activeSection}
          title={WORKSPACE_SECTION_LABELS[workspace.activeSection]}
        />
        {renderActiveSection(workspace)}
      </section>
      <Alert>
        <AlertTitle>Recommendation not implemented</AlertTitle>
        <AlertDescription>
          Prompt Pilot does not yet generate plans, recommend providers, or compile executable
          prompts for this project.
        </AlertDescription>
      </Alert>
    </div>
  );
}
