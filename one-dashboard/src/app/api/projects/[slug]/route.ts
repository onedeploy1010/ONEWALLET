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

    // Support both UUID (projectId) and slug lookup
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    const { data: project, error } = await supabaseEngine
      .from('projects')
      .select('*')
      .eq(isUUID ? 'id' : 'slug', slug)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { success: false, error: { code: 'E2001', message: 'Project not found' } },
        { status: 404 }
      );
    }

    // Get user count (project_users table)
    const { count: usersCount } = await supabaseEngine
      .from('project_users')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project.id);

    // Get API keys
    const { data: apiKeys } = await supabaseEngine
      .from('project_api_keys')
      .select('id, name, key_prefix, key_type, created_at, last_used_at, total_requests')
      .eq('project_id', project.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        project: {
          ...project,
          users_count: usersCount || 0,
          api_calls_today: 0,
        },
        apiKeys: (apiKeys || []).map((k) => ({
          id: k.id,
          name: k.name,
          type: k.key_type === 'secret' ? 'secret' : 'publishable',
          prefix: k.key_prefix,
          last_used_at: k.last_used_at,
          created_at: k.created_at,
          requests_count: k.total_requests || 0,
        })),
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
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
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
      .eq(isUUID ? 'id' : 'slug', slug)
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
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    const { error } = await supabaseEngine
      .from('projects')
      .delete()
      .eq(isUUID ? 'id' : 'slug', slug);

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
