import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, verifyProjectAccess } from '@/lib/auth';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E4010', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('access_token')?.value;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || searchParams.get('project_id');
    const chainId = searchParams.get('chainId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: { code: 'E4001', message: 'Project ID is required' } },
        { status: 400 }
      );
    }

    // Verify user has access to this project
    const access = await verifyProjectAccess(session.user.id, projectId);
    if (!access) {
      return NextResponse.json(
        { success: false, error: { code: 'E1003', message: 'Project access denied' } },
        { status: 403 }
      );
    }

    const queryParams = new URLSearchParams({
      projectId,
      ...(chainId && { chainId }),
    });

    const response = await fetch(`${ENGINE_URL}/api/v1/wallet/backend?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-project-id': projectId,
      },
    });

    if (!response.ok) {
      // Return empty data on 404
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      const data = await response.json();
      return NextResponse.json(
        { success: false, error: data.error || { code: 'E5001', message: 'Failed to fetch wallets' } },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.data?.wallets || data.data || [],
    });
  } catch (error) {
    console.error('Backend wallets fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch wallets' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E4010', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('access_token')?.value;

    const body = await request.json();
    const { project_id, label, type, chain_id } = body;

    if (!project_id || !label) {
      return NextResponse.json(
        { success: false, error: { code: 'E4001', message: 'Project ID and label are required' } },
        { status: 400 }
      );
    }

    // Verify user has access to this project
    const access = await verifyProjectAccess(session.user.id, project_id);
    if (!access) {
      return NextResponse.json(
        { success: false, error: { code: 'E1003', message: 'Project access denied' } },
        { status: 403 }
      );
    }

    const response = await fetch(`${ENGINE_URL}/api/v1/wallet/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-project-id': project_id,
      },
      body: JSON.stringify({
        label,
        type: type || 'local',
        chainId: chain_id,
        isBackend: true,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { success: false, error: data.error || { code: 'E5001', message: 'Failed to create wallet' } },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error('Backend wallet creation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
