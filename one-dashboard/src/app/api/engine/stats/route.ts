import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3001';

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
    const queryString = searchParams.toString();

    const response = await fetch(`${ENGINE_URL}/api/v1/engine/stats?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('Engine stats upstream error:', response.status, errText);
      return NextResponse.json(
        { success: false, error: { code: 'E5001', message: 'Engine service unavailable' } },
        { status: response.status }
      );
    }
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Engine stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch engine stats' } },
      { status: 500 }
    );
  }
}
