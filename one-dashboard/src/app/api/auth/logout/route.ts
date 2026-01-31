import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseEngine } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    // Invalidate refresh token in database
    if (refreshToken) {
      await supabaseEngine
        .from('refresh_tokens')
        .delete()
        .eq('token', refreshToken);
    }

    // Clear cookies
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');

    return NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E1000', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
