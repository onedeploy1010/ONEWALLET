import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3001';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
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

    const { tokenId } = await params;
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const response = await fetch(`${ENGINE_URL}/api/v1/engine/access/tokens/${tokenId}?${queryString}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Engine access token delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to delete access token' } },
      { status: 500 }
    );
  }
}
