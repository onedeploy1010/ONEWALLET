import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:4000';

// GET /api/connect/pay/stats - Get pay stats and overview
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
    const period = searchParams.get('period') || '7d';

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: { code: 'E4001', message: 'Project ID is required' } },
        { status: 400 }
      );
    }

    const queryParams = new URLSearchParams({
      projectId,
      period,
    });

    // Fetch pay stats from engine (fiat service)
    const response = await fetch(`${ENGINE_URL}/api/v1/fiat/stats?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-project-id': projectId,
      },
    });

    if (!response.ok) {
      // If engine doesn't have fiat stats endpoint yet, return mock data
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          data: generateMockPayStats(),
        });
      }

      const data = await response.json();
      return NextResponse.json(
        { success: false, error: data.error || { code: 'E5001', message: 'Failed to fetch pay stats' } },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error('Pay stats fetch error:', error);
    return NextResponse.json({
      success: true,
      data: generateMockPayStats(),
    });
  }
}

function generateMockPayStats() {
  return {
    totalVolume: 0,
    transactionCount: 0,
    avgTransactionSize: 0,
    successRate: 0,
  };
}
