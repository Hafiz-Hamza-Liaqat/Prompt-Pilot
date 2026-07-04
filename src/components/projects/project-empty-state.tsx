type ProjectEmptyStateProps = {
  title: string;
  description: string;
};

export function ProjectEmptyState({ title, description }: ProjectEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-subtle p-8 text-center">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
