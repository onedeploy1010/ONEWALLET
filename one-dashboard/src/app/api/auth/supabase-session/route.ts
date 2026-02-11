import { NextRequest, NextResponse } from 'next/server';
import { supabaseEngine } from '@/lib/supabase';
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '@/lib/auth';
import { env } from '@/config/env';

export async function POST(req: NextRequest) {
  try {
    const { userId, email, accessToken } = await req.json();

    if (!userId || !email || !accessToken) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'userId, email, and accessToken are required' } },
        { status: 400 }
      );
    }

    // Look up user in our users table and verify admin role (include wallet_address)
    let { data: user, error: userError } = await supabaseEngine
      .from('users')
      .select('id, email, role, wallet_address')
      .eq('email', email)
      .single();

    // If user doesn't exist in public.users but exists in auth.users (Supabase Auth),
    // auto-create them with admin role (they verified their email via Supabase OTP)
    if (userError || !user) {
      const { data: newUser, error: createError } = await supabaseEngine
        .from('users')
        .insert({
          email,
          role: 'admin',
          metadata: {
            registered_from: 'supabase_auth',
            auto_created: true,
          },
        })
        .select('id, email, role, wallet_address')
        .single();

      if (createError || !newUser) {
        console.error('Failed to auto-create user:', createError);
        return NextResponse.json(
          { success: false, error: { code: 'E1002', message: 'User not found' } },
          { status: 401 }
        );
      }

      user = newUser;
    }

    // Only admin and super_admin can access dashboard
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'E1003', message: 'Insufficient permissions. Dashboard access requires admin role.' } },
        { status: 403 }
      );
    }

    // Generate dashboard JWT tokens
    const userForToken = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: new Date().toISOString(),
    };

    const dashboardAccessToken = await generateAccessToken(userForToken);
    const dashboardRefreshToken = await generateRefreshToken(userForToken);

    // Store refresh token
    await supabaseEngine.from('refresh_tokens').insert({
      user_id: user.id,
      token: dashboardRefreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Set httpOnly cookies
    await setAuthCookies(dashboardAccessToken, dashboardRefreshToken);

    // Auto-create wallet for admin user if they don't have one yet
    if (!user.wallet_address) {
      try {
        const engineRes = await fetch(`${env.ONE_ENGINE_API_URL}/api/v1/wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dashboardAccessToken}`,
          },
          body: JSON.stringify({ chainId: 8453 }),
        });

        if (engineRes.ok) {
          const walletData = await engineRes.json();
          console.log('Auto-created wallet for admin user:', user.id, walletData.data?.smartAccountAddress);
        } else {
          console.warn('Failed to auto-create wallet for admin:', user.id, engineRes.status);
        }
      } catch (walletError) {
        // Don't fail login if wallet creation fails
        console.error('Error auto-creating wallet for admin:', walletError);
      }
    }

    // Log login activity
    await supabaseEngine.from('activity_logs').insert({
      user_id: user.id,
      action: 'dashboard_login',
      metadata: {
        method: 'supabase_otp',
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
        accessToken: dashboardAccessToken,
      },
    });
  } catch (error) {
    console.error('Supabase session error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E1000', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
