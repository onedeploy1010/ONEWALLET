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
    const period = searchParams.get('period') || searchParams.get('range') || '7d'; // 24h, 7d, 30d, 90d
    const chainId = searchParams.get('chainId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: { code: 'E4001', message: 'Project ID is required' } },
        { status: 400 }
      );
    }

    const queryParams = new URLSearchParams({
      projectId,
      period,
      ...(chainId && { chainId }),
    });

    // Fetch analytics from engine
    const response = await fetch(`${ENGINE_URL}/api/v1/analytics/overview?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-project-id': projectId,
      },
    });

    if (!response.ok) {
      // If engine doesn't have analytics endpoint yet, return mock data
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          data: generateMockAnalytics(period),
        });
      }

      const data = await response.json();
      return NextResponse.json(
        { success: false, error: data.error || { code: 'E5001', message: 'Failed to fetch analytics' } },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    // Return mock data on error for development
    return NextResponse.json({
      success: true,
      data: generateMockAnalytics('7d'),
    });
  }
}

function generateMockAnalytics(period: string) {
  const days = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const now = new Date();

  // Generate connections by day (matches page expectations)
  const connectionsByDay = Array.from({ length: days }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split('T')[0],
      count: 0, // Start with 0 for empty state
    };
  });

  // Return empty data structure matching ConnectStats interface
  return {
    totalConnections: 0,
    uniqueUsers: 0,
    successRate: 0,
    avgSessionDuration: 0,
    connectionsByMethod: {},
    connectionsByDay,
  };
}
