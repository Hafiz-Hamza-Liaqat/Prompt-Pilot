import { WORKSPACE_SECTION_DESCRIPTIONS } from '@/config/result-workspace';
import type { WorkspaceSection } from '@/domain/mockResultWorkspace';

type WorkspaceSectionHeadingProps = {
  section: WorkspaceSection;
  title: string;
};

export function WorkspaceSectionHeading({ section, title }: WorkspaceSectionHeadingProps) {
  return (
    <div id="workspace-section-heading" className="space-y-2">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{WORKSPACE_SECTION_DESCRIPTIONS[section]}</p>
    </div>
  );
}
