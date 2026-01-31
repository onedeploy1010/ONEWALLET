/**
 * Project Management Service
 * Handles project CRUD, API keys, and statistics
 */

import { supabaseEngine } from '@/lib/supabase';
import type { Project, ProjectWithStats, ProjectSettings } from '@/types';
import crypto from 'crypto';

export class ProjectService {
  /**
   * Create a new project
   */
  async createProject(
    ownerId: string,
    name: string,
    slug: string,
    settings?: Partial<ProjectSettings>
  ): Promise<Project> {
    const apiKey = this.generateApiKey();
    const apiSecret = this.generateApiSecret();

    const defaultSettings: ProjectSettings = {
      allowedDomains: [],
      rateLimit: 1000,
      features: {
        wallet: true,
        swap: true,
        contracts: true,
        fiat: true,
        payments: true,
        quant: false,
      },
      ...settings,
    };

    const { data, error } = await supabaseEngine
      .from('projects')
      .insert({
        name,
        slug,
        owner_id: ownerId,
        api_key: apiKey,
        api_secret: apiSecret,
        settings: defaultSettings,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return this.mapProject(data);
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    const { data, error } = await supabaseEngine
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get project: ${error.message}`);
    }

    return data ? this.mapProject(data) : null;
  }

  /**
   * Get project by API key
   */
  async getProjectByApiKey(apiKey: string): Promise<Project | null> {
    const { data, error } = await supabaseEngine
      .from('projects')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get project: ${error.message}`);
    }

    return data ? this.mapProject(data) : null;
  }

  /**
   * Get all projects for a user
   */
  async getUserProjects(userId: string): Promise<ProjectWithStats[]> {
    const { data, error } = await supabaseEngine
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get projects: ${error.message}`);
    }

    const projects = (data || []).map(this.mapProject);

    // Fetch stats for each project
    return Promise.all(
      projects.map(async (project) => {
        const stats = await this.getProjectStats(project.id);
        return { ...project, stats };
      })
    );
  }

  /**
   * Get all projects (admin)
   */
  async getAllProjects(limit = 50, offset = 0): Promise<{ projects: ProjectWithStats[]; total: number }> {
    const { data, error, count } = await supabaseEngine
      .from('projects')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get projects: ${error.message}`);
    }

    const projects = (data || []).map(this.mapProject);
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const stats = await this.getProjectStats(project.id);
        return { ...project, stats };
      })
    );

    return { projects: projectsWithStats, total: count || 0 };
  }

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    updates: Partial<Pick<Project, 'name' | 'settings' | 'isActive'>>
  ): Promise<Project> {
    const updateData: Record<string, unknown> = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.settings) updateData.settings = updates.settings;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabaseEngine
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return this.mapProject(data);
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey(projectId: string): Promise<{ apiKey: string }> {
    const newApiKey = this.generateApiKey();

    const { error } = await supabaseEngine
      .from('projects')
      .update({ api_key: newApiKey })
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to regenerate API key: ${error.message}`);
    }

    return { apiKey: newApiKey };
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    volumeUsd: number;
    lastActivity?: string;
  }> {
    // Get user count
    const { count: userCount } = await supabaseEngine
      .from('wallets')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    // Get transaction count
    const { count: txCount, data: txData } = await supabaseEngine
      .from('transactions')
      .select('created_at', { count: 'exact' })
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    return {
      totalUsers: userCount || 0,
      activeUsers: userCount || 0,
      totalTransactions: txCount || 0,
      volumeUsd: 0, // Would calculate from transactions
      lastActivity: txData?.[0]?.created_at,
    };
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabaseEngine
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  private generateApiKey(): string {
    return `one_${crypto.randomBytes(32).toString('hex')}`;
  }

  private generateApiSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private mapProject(data: Record<string, unknown>): Project {
    return {
      id: data.id as string,
      name: data.name as string,
      slug: data.slug as string,
      description: data.description as string | undefined,
      ownerId: data.owner_id as string,
      apiKey: data.api_key as string,
      apiSecret: data.api_secret as string,
      settings: data.settings as ProjectSettings,
      isActive: data.is_active as boolean,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }
}

export const projectService = new ProjectService();
