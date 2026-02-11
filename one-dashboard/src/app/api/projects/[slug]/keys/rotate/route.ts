import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';
import crypto from 'crypto';

// POST - Rotate (regenerate) an API key
export async function POST(
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
    const { type } = body;

    if (!type || !['publishable', 'secret'].includes(type)) {
      return NextResponse.json(
        { success: false, error: { code: 'E2002', message: 'Invalid key type. Must be "publishable" or "secret".' } },
        { status: 400 }
      );
    }

    // Check if slug is a UUID (projectId) or actual slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    // Get project
    const { data: project, error: projectError } = await supabaseEngine
      .from('projects')
      .select('id, name, client_id')
      .eq(isUUID ? 'id' : 'slug', slug)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: { code: 'E2001', message: 'Project not found' } },
        { status: 404 }
      );
    }

    // Deactivate all existing keys of this type
    const keyType = type === 'secret' ? 'secret' : 'publishable';
    await supabaseEngine
      .from('project_api_keys')
      .update({ is_active: false })
      .eq('project_id', project.id)
      .eq('key_type', keyType);

    // Generate new key
    const keyPrefix = type === 'secret' ? 'one_sk_' : 'one_pk_';
    const newKey = `${keyPrefix}${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(newKey).digest('hex');
    const prefix = newKey.slice(0, keyPrefix.length + 8);

    // If rotating publishable key, also update project client_id
    if (type === 'publishable') {
      await supabaseEngine
        .from('projects')
        .update({ client_id: newKey })
        .eq('id', project.id);
    }

    // Insert new key
    const { data: keyRecord, error: keyError } = await supabaseEngine
      .from('project_api_keys')
      .insert({
        project_id: project.id,
        name: `${type === 'secret' ? 'Secret' : 'Publishable'} Key (rotated)`,
        key_hash: keyHash,
        key_prefix: prefix,
        key_type: keyType,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (keyError) {
      throw keyError;
    }

    // Log activity
    await supabaseEngine.from('activity_logs').insert({
      user_id: session.user.id,
      action: 'api_key_rotated',
      metadata: {
        project_id: project.id,
        key_id: keyRecord.id,
        key_type: keyType,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: keyRecord.id,
        type: keyType,
        prefix: keyRecord.key_prefix,
        key: newKey, // Only returned once during rotation
        created_at: keyRecord.created_at,
      },
    });
  } catch (error) {
    console.error('Key rotation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E2000', message: 'Failed to rotate API key' } },
      { status: 500 }
    );
  }
}
