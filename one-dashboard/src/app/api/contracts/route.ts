import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, verifyProjectAccess } from '@/lib/auth';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:4000';

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
    const status = searchParams.get('status');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';

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
      page,
      limit,
      ...(chainId && { chainId }),
      ...(status && { status }),
    });

    const response = await fetch(`${ENGINE_URL}/api/v1/contracts?${queryParams}`, {
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
        { success: false, error: data.error || { code: 'E5001', message: 'Failed to fetch contracts' } },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.data?.contracts || data.data || [],
    });
  } catch (error) {
    console.error('Contracts fetch error:', error);
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}
