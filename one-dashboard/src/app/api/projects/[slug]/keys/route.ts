import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';
import crypto from 'crypto';

// GET - List API keys for a project
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

    // Check if slug is a UUID (projectId) or actual slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    // Get project by id or slug
    const { data: project, error: projectError } = await supabaseEngine
      .from('projects')
      .select('id')
      .eq(isUUID ? 'id' : 'slug', slug)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: { code: 'E2001', message: 'Project not found' } },
        { status: 404 }
      );
    }

    // Get all API keys for this project
    const { data: keys, error: keysError } = await supabaseEngine
      .from('project_api_keys')
      .select('id, name, key_type, key_prefix, allowed_domains, last_used_at, total_requests, is_active, created_at')
      .eq('project_id', project.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (keysError) {
      throw keysError;
    }

    // Map to frontend expected format
    const formattedKeys = (keys || []).map(key => ({
      id: key.id,
      name: key.name,
      type: key.key_type === 'secret' ? 'secret' : 'publishable',
      prefix: key.key_prefix,
      domains: key.allowed_domains || [],
      last_used_at: key.last_used_at,
      created_at: key.created_at,
      requests_count: key.total_requests || 0,
    }));

    return NextResponse.json({
      success: true,
      data: formattedKeys,
    });
  } catch (error) {
    console.error('API keys fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E2000', message: 'Failed to fetch API keys' } },
      { status: 500 }
    );
  }
}

// POST - Generate new API key
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
    const { name = 'Default Key', type = 'publishable', domains = [] } = body;

    // Validate key type
    const keyType = type === 'secret' ? 'secret' : 'publishable';

    // Check if slug is a UUID (projectId) or actual slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    // Get project by id or slug
    const { data: project, error: projectError } = await supabaseEngine
      .from('projects')
      .select('id')
      .eq(isUUID ? 'id' : 'slug', slug)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: { code: 'E2001', message: 'Project not found' } },
        { status: 404 }
      );
    }

    // Generate API key
    const apiKey = `one_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const prefix = apiKey.slice(0, 12);

    // Store key
    const { data: keyRecord, error: keyError } = await supabaseEngine
      .from('project_api_keys')
      .insert({
        project_id: project.id,
        name,
        key_hash: keyHash,
        key_prefix: prefix,
        key_type: keyType,
        allowed_domains: domains,
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
      action: 'api_key_generated',
      metadata: { project_id: project.id, key_id: keyRecord.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: keyRecord.id,
        name: keyRecord.name,
        type: keyRecord.key_type,
        prefix: keyRecord.key_prefix,
        domains: keyRecord.allowed_domains || [],
        apiKey, // Only returned on creation - store it securely!
        created_at: keyRecord.created_at,
      },
    });
  } catch (error) {
    console.error('API key generation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E2000', message: 'Failed to generate API key' } },
      { status: 500 }
    );
  }
}
