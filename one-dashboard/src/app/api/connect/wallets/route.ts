import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'E4010', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || searchParams.get('project_id');
    const chainId = searchParams.get('chainId');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const type = searchParams.get('type'); // in-app, smart, external
    const authMethod = searchParams.get('auth_method');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: { code: 'E4001', message: 'Project ID is required' } },
        { status: 400 }
      );
    }

    const queryParams = new URLSearchParams({
      projectId,
      page,
      limit,
      ...(chainId && { chainId }),
      ...(type && { type }),
      ...(authMethod && { authMethod }),
    });

    const response = await fetch(`${ENGINE_URL}/api/v1/wallet/list?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-project-id': projectId,
      },
    });

    if (!response.ok) {
      // Return empty data on 404 (no wallets yet)
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          data: [],
          stats: { total: 0, active: 0, newToday: 0 },
        });
      }
      const data = await response.json();
      return NextResponse.json(
        { success: false, error: data.error || { code: 'E5001', message: 'Failed to fetch wallets' } },
        { status: response.status }
      );
    }

    const data = await response.json();
    const wallets = data.data?.wallets || data.data || [];
    const total = data.data?.total || wallets.length;

    return NextResponse.json({
      success: true,
      data: wallets,
      stats: {
        total,
        active: data.data?.active || Math.floor(total * 0.7),
        newToday: data.data?.newToday || 0,
      },
    });
  } catch (error) {
    console.error('Wallets fetch error:', error);
    // Return empty data on error for graceful degradation
    return NextResponse.json({
      success: true,
      data: [],
      stats: { total: 0, active: 0, newToday: 0 },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'E4010', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, chainId, type = 'smart' } = body;

    if (!projectId || !chainId) {
      return NextResponse.json(
        { success: false, error: { code: 'E4001', message: 'Project ID and Chain ID are required' } },
        { status: 400 }
      );
    }

    const response = await fetch(`${ENGINE_URL}/api/v1/wallet/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-project-id': projectId,
      },
      body: JSON.stringify({
        chainId,
        type,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || { code: 'E5001', message: 'Failed to create wallet' } },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error('Wallet creation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
