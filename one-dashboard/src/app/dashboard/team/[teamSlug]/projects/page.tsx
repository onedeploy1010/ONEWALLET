'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'active' | 'inactive';
  client_id: string;
  created_at: string;
  is_demo?: boolean;
  settings?: { is_demo?: boolean };
}

export default function ProjectsListPage() {
  const t = useTranslations('projects');
  const tc = useTranslations('common');
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitleTeam')}
          </p>
        </div>
        <Link
          href={`/dashboard/team/${teamSlug}/projects/new`}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          + {t('createProject')}
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
              <div className="h-5 bg-secondary rounded w-3/4 mb-4" />
              <div className="h-4 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-semibold mb-2">{t('noProjects')}</h3>
          <p className="text-muted-foreground mb-6">
            {t('noProjectsHint')}
          </p>
          <Link
            href={`/dashboard/team/${teamSlug}/projects/new`}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            {t('createFirstProject')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const isDemo = project.is_demo || project.settings?.is_demo || project.slug === 'demo';
            return (
            <Link
              key={project.id}
              href={`/dashboard/team/${teamSlug}/${project.id}`}
              className={`bg-card border rounded-lg p-6 hover:shadow-md transition-shadow ${
                isDemo ? 'border-[#2563EB]/30 ring-1 ring-[#2563EB]/10' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{project.name}</h3>
                    {isDemo && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white">
                        {t('demo')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{project.slug}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  project.status === 'active'
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-gray-500/10 text-gray-500'
                }`}>
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground/60">{t('projectId')}</span>
                  <span className="font-mono">{project.id.slice(0, 8)}...{project.id.slice(-4)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground/60">{t('clientIdLabel')}</span>
                  <span className="font-mono">{project.client_id ? `${project.client_id.slice(0, 12)}...` : '-'}</span>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
