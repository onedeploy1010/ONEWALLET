import { redirect } from 'next/navigation';
import { getSession, getUserTeams } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Get user's teams and redirect to the first one
  const userTeams = await getUserTeams(session.user.id);

  if (userTeams.length > 0) {
    // Redirect to user's first team
    redirect(`/dashboard/team/${userTeams[0].team.slug}`);
  }

  // If user has no teams, show team creation or onboarding
  // For now, redirect to projects page which handles this case
  redirect('/dashboard/projects');
}
