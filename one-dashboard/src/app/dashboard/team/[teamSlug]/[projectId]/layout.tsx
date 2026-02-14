import { redirect } from 'next/navigation';
import { getSession, verifyTeamAccess, verifyProjectBelongsToTeam, verifyProjectAccess } from '@/lib/auth';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamSlug: string; projectId: string }>;
}) {
  const session = await getSession();
  const { teamSlug, projectId } = await params;

  if (!session) {
    redirect('/auth/login');
  }

  // Verify user is a member of this team
  const teamContext = await verifyTeamAccess(session.user.id, teamSlug);

  if (!teamContext) {
    // User is not a member of this team - redirect to dashboard
    redirect('/dashboard');
  }

  // Verify project belongs to this team
  const projectBelongsToTeam = await verifyProjectBelongsToTeam(projectId, teamSlug);

  if (!projectBelongsToTeam) {
    // Project doesn't belong to this team - redirect to team projects
    redirect(`/dashboard/team/${teamSlug}/projects`);
  }

  // Verify user has access to this project (through team membership)
  const projectAccess = await verifyProjectAccess(session.user.id, projectId);

  if (!projectAccess) {
    // User doesn't have access to this project
    redirect(`/dashboard/team/${teamSlug}/projects`);
  }

  // Layout shell is provided by parent /dashboard/layout.tsx
  // This layout only handles project-level access verification
  return <>{children}</>;
}
