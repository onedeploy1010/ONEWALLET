import { NextRequest, NextResponse } from 'next/server';
import { supabaseEngine } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Email is required' } },
        { status: 400 }
      );
    }

    // Check if user exists and has admin role
    const { data: user, error: userError } = await supabaseEngine
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'E1002', message: 'User not found or not authorized' } },
        { status: 401 }
      );
    }

    // Only admin and super_admin can access dashboard
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'E1003', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: otpError } = await supabaseEngine
      .from('otp_codes')
      .upsert({
        user_id: user.id,
        code: otp,
        type: 'dashboard_login',
        expires_at: expiresAt.toISOString(),
        used: false,
      }, {
        onConflict: 'user_id,type',
      });

    if (otpError) {
      console.error('Failed to store OTP:', otpError);
      return NextResponse.json(
        { success: false, error: { code: 'E1004', message: 'Failed to generate OTP' } },
        { status: 500 }
      );
    }

    // In production, send OTP via email
    console.log(`[DEV] OTP for ${email}: ${otp}`);

    // TODO: Send email via SendGrid/Resend in production
    // await sendOTPEmail(email, otp);

    return NextResponse.json({
      success: true,
      data: {
        message: 'OTP sent successfully',
        expiresIn: 600,
        otp, // Remove in production when email service is ready
      },
    });
  } catch (error) {
    console.error('OTP error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E1000', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
