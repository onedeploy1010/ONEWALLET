import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET - List ecosystem apps
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { data: apps, error } = await supabaseEngine
      .from('ecosystem_apps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: apps || [],
    });
  } catch (error) {
    console.error('Ecosystem apps fetch error:', error);
    // Return empty array if table doesn't exist
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}

// POST - Add ecosystem app
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
    const { name, type, api_endpoint } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: { code: 'E2001', message: 'Name is required' } },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data: app, error } = await supabaseEngine
      .from('ecosystem_apps')
      .insert({
        name,
        slug,
        type: type || 'external',
        api_endpoint: api_endpoint || null,
        status: 'active',
        users_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: app,
    });
  } catch (error) {
    console.error('Ecosystem app create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E2000', message: 'Failed to create app' } },
      { status: 500 }
    );
  }
}
