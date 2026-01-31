import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';
import crypto from 'crypto';

// GET - List projects
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get user's teams
    const { data: teamMemberships } = await supabaseEngine
      .from('team_members')
      .select('team_id')
      .eq('user_id', session.user.id);

    const teamIds = teamMemberships?.map(t => t.team_id) || [];

    if (teamIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { total: 0, limit, offset },
      });
    }

    // Get projects for user's teams
    const { data: projects, error, count } = await supabaseEngine
      .from('projects')
      .select('*', { count: 'exact' })
      .in('team_id', teamIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get user counts for each project
    const projectsWithCounts = await Promise.all(
      (projects || []).map(async (project) => {
        const { count: usersCount } = await supabaseEngine
          .from('project_users')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id);

        return {
          ...project,
          users_count: usersCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: projectsWithCounts,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Projects fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E2000', message: 'Failed to fetch projects' } },
      { status: 500 }
    );
  }
}

// POST - Create project
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description, settings } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: { code: 'E2001', message: 'Project name is required' } },
        { status: 400 }
      );
    }

    // Get or create team for user
    let teamId: string;
    const { data: existingTeam } = await supabaseEngine
      .from('team_members')
      .select('team_id')
      .eq('user_id', session.user.id)
      .eq('role', 'owner')
      .single();

    if (existingTeam) {
      teamId = existingTeam.team_id;
    } else {
      // Create default team
      const teamSlug = `team-${crypto.randomBytes(8).toString('hex')}`;
      const { data: newTeam, error: teamError } = await supabaseEngine
        .from('teams')
        .insert({
          name: `${session.user.email}'s Team`,
          slug: teamSlug,
          owner_id: session.user.id,
        })
        .select('id')
        .single();

      if (teamError) throw teamError;
      teamId = newTeam.id;

      // Add user as team owner
      await supabaseEngine.from('team_members').insert({
        team_id: teamId,
        user_id: session.user.id,
        role: 'owner',
      });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug exists in team
    const { data: existing } = await supabaseEngine
      .from('projects')
      .select('id')
      .eq('team_id', teamId)
      .eq('slug', slug)
      .single();

    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    // Generate client_id
    const clientId = `one_pk_${crypto.randomBytes(24).toString('hex')}`;

    // Create project
    const { data: project, error } = await supabaseEngine
      .from('projects')
      .insert({
        team_id: teamId,
        name,
        slug: finalSlug,
        description: description || null,
        client_id: clientId,
        settings: settings || {},
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Project insert error:', error);
      throw error;
    }

    // Create default API key
    const apiKey = `one_sk_${crypto.randomBytes(32).toString('hex')}`;
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    await supabaseEngine.from('project_api_keys').insert({
      project_id: project.id,
      name: 'Default Secret Key',
      key_type: 'secret',
      key_hash: apiKeyHash,
      key_prefix: apiKey.slice(0, 15),
    });

    // Log activity
    await supabaseEngine.from('activity_logs').insert({
      user_id: session.user.id,
      action: 'project_created',
      metadata: { project_id: project.id, project_name: name },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        apiKey, // Return API key only on creation
      },
    });
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E2000', message: 'Failed to create project' } },
      { status: 500 }
    );
  }
}
