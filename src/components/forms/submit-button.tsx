'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
};

export function SubmitButton({
  children,
  pendingText,
  className,
  variant = 'default',
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} variant={variant} className={cn(className)}>
      {pending ? pendingText : children}
    </Button>
  );
}
