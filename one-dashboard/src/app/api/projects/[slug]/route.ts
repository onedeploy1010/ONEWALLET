import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET - Get project details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { slug } = await params;

    const { data: project, error } = await supabaseEngine
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { success: false, error: { code: 'E2001', message: 'Project not found' } },
        { status: 404 }
      );
    }

    // Get user count
    const { count: usersCount } = await supabaseEngine
      .from('user_projects')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project.id);

    // Get API usage today
    const today = new Date().toISOString().split('T')[0];
    const { count: apiCallsToday } = await supabaseEngine
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .gte('created_at', today);

    // Get API keys
    const { data: apiKeys } = await supabaseEngine
      .from('project_api_keys')
      .select('id, name, prefix, created_at, last_used_at')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        project: {
          ...project,
          users_count: usersCount || 0,
          api_calls_today: apiCallsToday || 0,
        },
        apiKeys: apiKeys || [],
      },
    });
  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E2000', message: 'Failed to fetch project' } },
      { status: 500 }
    );
  }
}

// PATCH - Update project
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const body = await req.json();
    const { name, description, settings, status } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (settings !== undefined) updateData.settings = settings;
    if (status !== undefined) updateData.status = status;

    const { data: project, error } = await supabaseEngine
      .from('projects')
      .update(updateData)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E2000', message: 'Failed to update project' } },
      { status: 500 }
    );
  }
}

// DELETE - Delete project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { slug } = await params;

    const { error } = await supabaseEngine
      .from('projects')
      .delete()
      .eq('slug', slug);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Project deleted' },
    });
  } catch (error) {
    console.error('Project delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E2000', message: 'Failed to delete project' } },
      { status: 500 }
    );
  }
}
