import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/layout/section-heading';
import {
  AUTH_ERROR_MESSAGES,
  isAuthErrorCode,
} from '@/domain/auth';
import { signUpAction } from '../actions';

type SignUpPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const errorCode = isAuthErrorCode(params.error) ? params.error : undefined;

  return (
    <main id="main-content" className="flex-1 py-10">
      <PageContainer className="max-w-md">
        <SectionHeading
          headingLevel={1}
          title="Create account"
          description="Create a Prompt Pilot account to save your planning foundation."
        />

        {errorCode ? (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Unable to create account</AlertTitle>
            <AlertDescription>{AUTH_ERROR_MESSAGES[errorCode]}</AlertDescription>
          </Alert>
        ) : null}

        <form action={signUpAction} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />
          </div>

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
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
            <p className="text-sm text-muted-foreground">
              Use 8 to 72 characters. Prompt Pilot does not generate videos or images.
            </p>
          </div>

          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/sign-in" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </PageContainer>
    </main>
  );
}
