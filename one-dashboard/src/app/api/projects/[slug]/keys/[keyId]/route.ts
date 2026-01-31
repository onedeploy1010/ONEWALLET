import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// DELETE - Revoke API key
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; keyId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { slug, keyId } = await params;

    // Get project
    const { data: project, error: projectError } = await supabaseEngine
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: { code: 'E2001', message: 'Project not found' } },
        { status: 404 }
      );
    }

    // Delete key
    const { error } = await supabaseEngine
      .from('project_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('project_id', project.id);

    if (error) {
      throw error;
    }

    // Log activity
    await supabaseEngine.from('activity_logs').insert({
      user_id: session.user.id,
      action: 'api_key_revoked',
      metadata: { project_id: project.id, key_id: keyId },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'API key revoked' },
    });
  } catch (error) {
    console.error('API key revoke error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E2000', message: 'Failed to revoke API key' } },
      { status: 500 }
    );
  }
}
