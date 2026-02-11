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
        role: 'admin',
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

    return NextResponse.json({
      success: true,
      data: {
        message: 'Account created. Please verify your email.',
        userId: newUser.id,
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
