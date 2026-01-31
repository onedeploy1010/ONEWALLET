import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

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

  // Verify project exists and user has access
  const { data: project } = await supabaseEngine
    .from('projects')
    .select('id, name, slug')
    .eq('id', projectId)
    .single();

  if (!project) {
    redirect(`/dashboard/team/${teamSlug}/projects`);
  }

  // Layout shell is provided by parent /dashboard/layout.tsx
  // This layout only handles project-level access verification
  return <>{children}</>;
}
