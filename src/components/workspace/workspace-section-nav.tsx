import Link from 'next/link';
import {
  buildWorkspaceSectionHref,
  resultWorkspaceSections,
} from '@/config/result-workspace';
import type { WorkspaceSection } from '@/domain/mockResultWorkspace';

type WorkspaceSectionNavProps = {
  projectId: string;
  activeSection: WorkspaceSection;
};

export function WorkspaceSectionNav({ projectId, activeSection }: WorkspaceSectionNavProps) {
  return (
    <nav aria-label="Result workspace sections" className="rounded-lg border border-border p-3">
      <ul className="flex flex-wrap gap-2">
        {resultWorkspaceSections.map((section) => {
          const isActive = section.value === activeSection;

          return (
            <li key={section.value}>
              <Link
                href={buildWorkspaceSectionHref(projectId, section.value)}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex rounded-md px-3 py-1.5 text-sm font-medium no-underline transition-colors ${
                  isActive
                    ? 'bg-brand-muted text-brand'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
