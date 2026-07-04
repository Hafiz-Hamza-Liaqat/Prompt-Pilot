import { requireUser } from '@/server/auth/require-user';

export default async function ProjectsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser({ redirectTo: '/projects' });

  return children;
}
