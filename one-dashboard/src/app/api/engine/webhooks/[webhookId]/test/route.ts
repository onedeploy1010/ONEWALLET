import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3001';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'E4010', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { webhookId } = await params;
    const body = await request.json();

    const response = await fetch(`${ENGINE_URL}/api/v1/engine/webhooks/${webhookId}/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Engine webhook test error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to test webhook' } },
      { status: 500 }
    );
  }
}
