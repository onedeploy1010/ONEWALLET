import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, verifyProjectAccess } from '@/lib/auth';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:4000';

// GET /api/connect/pay/transactions - List fiat transactions
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
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const type = searchParams.get('type'); // onramp, offramp, all
    const status = searchParams.get('status'); // pending, completed, failed

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
      ...(type && { type }),
      ...(status && { status }),
    });

    // Fetch transactions from engine (fiat service)
    const response = await fetch(`${ENGINE_URL}/api/v1/fiat/transactions?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-project-id': projectId,
      },
    });

    if (!response.ok) {
      // If engine doesn't have fiat transactions endpoint yet, return mock data
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          data: generateMockTransactions(parseInt(page), parseInt(limit)),
        });
      }

      const data = await response.json();
      return NextResponse.json(
        { success: false, error: data.error || { code: 'E5001', message: 'Failed to fetch transactions' } },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error('Pay transactions fetch error:', error);
    return NextResponse.json({
      success: true,
      data: generateMockTransactions(1, 20),
    });
  }
}

function generateMockTransactions(_page: number, _limit: number) {
  // Return empty array for clean empty state
  return [];
}
