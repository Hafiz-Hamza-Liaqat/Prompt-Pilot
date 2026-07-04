import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/layout/section-heading';
import {
  AUTH_ERROR_MESSAGES,
  isAuthErrorCode,
} from '@/domain/auth';

type AuthErrorPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const errorCode = isAuthErrorCode(params.error) ? params.error : undefined;
  const message = errorCode
    ? AUTH_ERROR_MESSAGES[errorCode]
    : 'Something went wrong during authentication.';

  return (
    <main id="main-content" className="flex-1 py-10">
      <PageContainer className="max-w-md">
        <SectionHeading headingLevel={1} title="Authentication error" />

        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Sign-in could not be completed</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        <Button asChild className="mt-6">
          <Link href="/auth/sign-in">Return to sign in</Link>
        </Button>
      </PageContainer>
    </main>
  );
}
