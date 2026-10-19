import { WORKSPACE_SECTION_LABELS } from '@/config/result-workspace';
import type { WorkspaceViewModel } from '@/domain/workspace/workspace-display';
import { WorkspaceAudioEditingPreview } from './workspace-audio-editing-preview';
import { WorkspaceAnalysisSection } from './workspace-analysis-section';
import { WorkspaceContinuityPreview } from './workspace-continuity-preview';
import { WorkspaceHeader } from './workspace-header';
import { WorkspaceOverview } from './workspace-overview';
import { WorkspacePreviewNotice } from './workspace-preview-notice';
import { WorkspacePromptPreview } from './workspace-prompt-preview';
import { WorkspaceProviderRecommendations } from './workspace-provider-recommendations';
import { WorkspaceComplexityRisk } from './workspace-complexity-risk';
import { WorkspaceSceneRoadmap } from './workspace-scene-roadmap';
import { WorkspaceSectionHeading } from './workspace-section-heading';
import { WorkspaceSectionNav } from './workspace-section-nav';

type WorkspaceShellProps = {
  workspace: WorkspaceViewModel;
};

function renderActiveSection(workspace: WorkspaceViewModel) {
  switch (workspace.activeSection) {
    case 'analysis':
      return (
        <WorkspaceAnalysisSection
          analysis={workspace.analysis}
          intelligence={workspace.intelligence}
          projectId={workspace.project.id}
        />
      );
    case 'providers':
      return (
        <WorkspaceProviderRecommendations recommendation={workspace.providerRecommendation} />
      );
    case 'scenes':
      return <WorkspaceSceneRoadmap decomposition={workspace.sceneDecomposition} />;
    case 'prompts':
      return <WorkspacePromptPreview sections={workspace.samplePromptSections} />;
    case 'continuity':
      return <WorkspaceContinuityPreview items={workspace.continuityItems} />;
    case 'audio-editing':
      return <WorkspaceAudioEditingPreview items={workspace.audioEditingItems} />;
    case 'quality':
      return <WorkspaceComplexityRisk assessment={workspace.complexityRiskAssessment} />;
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
    </div>
  );
}
