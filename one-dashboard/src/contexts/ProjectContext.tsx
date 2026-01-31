'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Project {
  id: string;
  name: string;
  slug: string;
  teamId: string;
  teamSlug: string;
  apiKeyPrefix: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'member';
}

interface ProjectContextType {
  currentTeam: Team | null;
  currentProject: Project | null;
  teams: Team[];
  projects: Project[];
  setCurrentTeam: (team: Team | null) => void;
  setCurrentProject: (project: Project | null) => void;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeamsAndProjects();
  }, []);

  const fetchTeamsAndProjects = async () => {
    try {
      const [teamsRes, projectsRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/projects'),
      ]);

      const [teamsData, projectsData] = await Promise.all([
        teamsRes.json(),
        projectsRes.json(),
      ]);

      if (teamsData.success) {
        setTeams(teamsData.data || []);
        // Set first team as current if none selected
        if (!currentTeam && teamsData.data?.length > 0) {
          setCurrentTeam(teamsData.data[0]);
        }
      }

      if (projectsData.success) {
        setProjects(projectsData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch teams/projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProjects = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    if (data.success) {
      setProjects(data.data || []);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        currentTeam,
        currentProject,
        teams,
        projects,
        setCurrentTeam,
        setCurrentProject,
        refreshProjects,
        isLoading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
