import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { data: jobs, error } = await supabaseEngine
      .from('migration_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: jobs || [],
    });
  } catch (error) {
    console.error('Migration jobs fetch error:', error);
    return NextResponse.json({
      success: true,
      data: [], // Return empty array if table doesn't exist
    });
  }
}
