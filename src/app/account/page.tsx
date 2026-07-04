import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/layout/section-heading';
import { signOutAction } from '@/app/auth/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in?next=/account');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <main id="main-content" className="flex-1 py-10">
      <PageContainer className="max-w-2xl">
        <SectionHeading
          headingLevel={1}
          title="Account foundation"
          description="Your authenticated Prompt Pilot profile and workspace entry point."
        />

        <Card className="mt-8">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{profile?.display_name ?? 'Creator'}</CardTitle>
              <Badge variant="secondary">Authenticated</Badge>
            </div>
            <CardDescription>Signed in as {user.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Prompt Pilot produces structured plans, recommendations, prompts, and
              instructions. It does not generate videos or images.
            </p>
            <p>
              Project containers are available from the project dashboard. Guided video brief
              creation begins in Phase 6.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/projects">Open projects</Link>
              </Button>
              <form action={signOutAction}>
                <Button type="submit" variant="outline">
                  Sign out
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
