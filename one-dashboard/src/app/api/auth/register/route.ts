import { NextRequest, NextResponse } from 'next/server';
import { supabaseEngine } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, name, company } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Email and name are required' } },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseEngine
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'E1005', message: 'User already exists. Please login instead.' } },
        { status: 409 }
      );
    }

    // Create new user with admin role for dashboard access
    const { data: newUser, error: createError } = await supabaseEngine
      .from('users')
      .insert({
        email,
        role: 'admin', // Dashboard users are admins
        metadata: {
          name,
          company: company || null,
          registered_from: 'dashboard',
        },
      })
      .select('id, email')
      .single();

    if (createError) {
      console.error('Failed to create user:', createError);
      return NextResponse.json(
        { success: false, error: { code: 'E1006', message: 'Failed to create account' } },
        { status: 500 }
      );
    }

    // Generate 6-digit OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: otpError } = await supabaseEngine
      .from('otp_codes')
      .upsert({
        user_id: newUser.id,
        code: otp,
        type: 'email_verification',
        expires_at: expiresAt.toISOString(),
        used: false,
      }, {
        onConflict: 'user_id,type',
      });

    if (otpError) {
      console.error('Failed to store OTP:', otpError);
      return NextResponse.json(
        { success: false, error: { code: 'E1004', message: 'Failed to generate verification code' } },
        { status: 500 }
      );
    }

    // In production, send OTP via email
    console.log(`[DEV] Registration OTP for ${email}: ${otp}`);

    // TODO: Send verification email in production
    // await sendVerificationEmail(email, otp, name);

    // TODO: In production, send OTP via email service
    // For now, return OTP directly (remove this in production!)
    return NextResponse.json({
      success: true,
      data: {
        message: 'Account created. Please verify your email.',
        expiresIn: 600,
        otp, // Remove in production when email service is ready
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E1000', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
