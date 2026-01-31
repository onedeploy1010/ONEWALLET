import { NextRequest, NextResponse } from 'next/server';
import { supabaseEngine } from '@/lib/supabase';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Email and OTP are required' } },
        { status: 400 }
      );
    }

    // Get user
    const { data: user, error: userError } = await supabaseEngine
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'E1002', message: 'User not found' } },
        { status: 401 }
      );
    }

    // Verify OTP (check both login and registration types)
    const { data: otpRecord, error: otpError } = await supabaseEngine
      .from('otp_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('code', otp)
      .in('type', ['dashboard_login', 'email_verification'])
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { success: false, error: { code: 'E1005', message: 'Invalid or expired OTP' } },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await supabaseEngine
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // Generate tokens
    const userForToken = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: new Date().toISOString(),
    };

    const accessToken = await generateAccessToken(userForToken);
    const refreshToken = await generateRefreshToken(userForToken);

    // Store refresh token
    await supabaseEngine.from('refresh_tokens').insert({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });

    // Set cookies
    const cookieStore = await cookies();

    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    // Log login activity
    await supabaseEngine.from('activity_logs').insert({
      user_id: user.id,
      action: 'dashboard_login',
      metadata: {
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        accessToken,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E1000', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
