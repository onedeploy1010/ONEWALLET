import { redirect } from 'next/navigation';
import { getSession, verifyTeamAccess } from '@/lib/auth';

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamSlug: string }>;
}) {
  const session = await getSession();
  const { teamSlug } = await params;

  if (!session) {
    redirect('/auth/login');
  }

  // Verify user is a member of this team
  const teamContext = await verifyTeamAccess(session.user.id, teamSlug);

  if (!teamContext) {
    // User is not a member of this team - redirect to dashboard
    redirect('/dashboard');
  }

  // Layout shell is provided by parent /dashboard/layout.tsx
  // This layout only handles team-level auth checks
  return <>{children}</>;
}
