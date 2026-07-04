import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/layout/section-heading';
import {
  AUTH_ERROR_MESSAGES,
  AUTH_NOTICE_MESSAGES,
  isAuthErrorCode,
  isAuthNoticeCode,
  sanitizeRedirectPath,
} from '@/domain/auth';
import { signInAction } from '../actions';

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    notice?: string;
    next?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const next = sanitizeRedirectPath(params.next);
  const errorCode = isAuthErrorCode(params.error) ? params.error : undefined;
  const noticeCode = isAuthNoticeCode(params.notice) ? params.notice : undefined;

  return (
    <main id="main-content" className="flex-1 py-10">
      <PageContainer className="max-w-md">
        <SectionHeading
          headingLevel={1}
          title="Sign in"
          description="Access your Prompt Pilot account foundation."
        />

        {errorCode ? (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Unable to sign in</AlertTitle>
            <AlertDescription>{AUTH_ERROR_MESSAGES[errorCode]}</AlertDescription>
          </Alert>
        ) : null}

        {noticeCode ? (
          <Alert className="mt-6">
            <AlertTitle>Account created</AlertTitle>
            <AlertDescription>{AUTH_NOTICE_MESSAGES[noticeCode]}</AlertDescription>
          </Alert>
        ) : null}

        <form action={signInAction} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={next} />

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Need an account?{' '}
          <Link href="/auth/sign-up" className="font-medium text-brand hover:underline">
            Create account
          </Link>
        </p>
      </PageContainer>
    </main>
  );
}
