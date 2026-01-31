/**
 * Usage API Proxy
 * 代理到 one-engine 的使用量统计接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:4000';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');
    const period = searchParams.get('period') || 'daily';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: { code: 'E4001', message: 'project_id is required' } },
        { status: 400 }
      );
    }

    // Build query string
    const params = new URLSearchParams({
      project_id: projectId,
      period,
    });
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);

    // Proxy to engine
    const response = await fetch(`${ENGINE_URL}/api/v1/usage?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Usage proxy error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch usage data' } },
      { status: 500 }
    );
  }
}
