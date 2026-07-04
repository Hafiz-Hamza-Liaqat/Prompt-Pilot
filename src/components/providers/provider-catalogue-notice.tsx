import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

type ProviderCatalogueNoticeProps = {
  notice: string | null;
  sunsetAt?: string | null;
  lifecycleStatus?: string;
};

export function ProviderCatalogueNotice({
  notice,
  sunsetAt,
  lifecycleStatus,
}: ProviderCatalogueNoticeProps) {
  const showSunset = lifecycleStatus === 'sunsetting' && sunsetAt;

  if (!notice && !showSunset) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showSunset ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>Sunsetting offering</AlertTitle>
          <AlertDescription>
            Official sources document a sunset date of{' '}
            {new Date(sunsetAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            . This catalogue entry remains visible but is not a normal long-term recommendation
            candidate.
          </AlertDescription>
        </Alert>
      ) : null}
      {notice ? (
        <Alert>
          <AlertTitle>Catalogue notice</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
