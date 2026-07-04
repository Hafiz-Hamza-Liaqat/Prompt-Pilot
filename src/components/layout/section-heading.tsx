import { cn } from '@/lib/utils';

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  headingLevel: 2 | 3;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  headingLevel,
  className,
}: SectionHeadingProps) {
  const HeadingTag = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <div className={cn('max-w-2xl', className)}>
      {eyebrow ? (
        <p className="mb-2 text-sm font-medium tracking-wide text-brand uppercase">{eyebrow}</p>
      ) : null}
      <HeadingTag className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </HeadingTag>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
