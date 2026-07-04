import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { BriefActionStatus } from '@/domain/videoBriefDraft';

type BriefActionMessageProps = {
  status: BriefActionStatus;
};

const STATUS_MESSAGES: Partial<
  Record<BriefActionStatus, { title: string; description: string; destructive?: boolean }>
> = {
  not_authenticated: {
    title: 'Sign in required',
    description: 'Sign in to continue editing your video brief.',
    destructive: true,
  },
  not_found: {
    title: 'Brief unavailable',
    description: 'This video brief could not be found.',
    destructive: true,
  },
  forbidden: {
    title: 'Brief unavailable',
    description: 'This video brief could not be found.',
    destructive: true,
  },
  project_archived: {
    title: 'Project archived',
    description: 'Restore this project before editing the video brief.',
    destructive: true,
  },
  persistence_error: {
    title: 'Unable to save brief',
    description: 'Try again in a moment.',
    destructive: true,
  },
};

export function BriefActionMessage({ status }: BriefActionMessageProps) {
  const message = STATUS_MESSAGES[status];

  if (!message || status === 'idle' || status === 'success' || status === 'validation_error') {
    return null;
  }

  return (
    <Alert variant={message.destructive ? 'destructive' : 'default'}>
      <AlertTitle>{message.title}</AlertTitle>
      <AlertDescription>{message.description}</AlertDescription>
    </Alert>
  );
}
