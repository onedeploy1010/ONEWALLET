'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Project {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'pending';
  api_calls_today: number;
  users_count: number;
  created_at: string;
}

const statusColors: Record<Project['status'], string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-400',
  pending: 'bg-yellow-500',
};

export function ProjectsOverview() {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects?limit=5');
      const data = await res.json();
      if (data.success) {
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{t('projectsOverview.title')}</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t('projectsOverview.title')}</h2>
        <Link
          href="/dashboard/projects"
          className="text-sm text-primary hover:underline"
        >
          {tc('actions.viewAll')}
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">{t('projectsOverview.noProjects')}</p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            <span>+</span>
            <span>{t('projectsOverview.createProject')}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.slug}`}
              className="block p-3 rounded-md hover:bg-secondary transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusColors[project.status]}`} />
                  <span className="font-medium">{project.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {t('projectsOverview.calls', { count: project.api_calls_today.toLocaleString() })}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{t('projectsOverview.users', { count: project.users_count })}</span>
                <span>{t('projectsOverview.idPrefix')}{project.id.slice(0, 8)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
