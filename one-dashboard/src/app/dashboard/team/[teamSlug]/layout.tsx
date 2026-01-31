import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamSlug: string }>;
}) {
  const session = await getSession();
  await params; // Validate params exist

  if (!session) {
    redirect('/auth/login');
  }

  // Layout shell is provided by parent /dashboard/layout.tsx
  // This layout only handles team-level auth checks
  return <>{children}</>;
}
