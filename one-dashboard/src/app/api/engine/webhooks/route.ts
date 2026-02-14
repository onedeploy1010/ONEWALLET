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

    const queryParams = new URLSearchParams({ projectId });

    const response = await fetch(`${ENGINE_URL}/api/v1/engine/webhooks?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-project-id': projectId,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ success: true, data: [] });
      }
      const errText = await response.text().catch(() => '');
      console.error('Engine webhooks upstream error:', response.status, errText);
      return NextResponse.json(
        { success: false, error: { code: 'E5001', message: 'Engine service unavailable' } },
        { status: response.status }
      );
    }
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Engine webhooks fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch webhooks' } },
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
    const { project_id, projectId: bodyProjectId } = body;
    const projectId = project_id || bodyProjectId;

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

    const response = await fetch(`${ENGINE_URL}/api/v1/engine/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-project-id': projectId,
      },
      body: JSON.stringify({ ...body, projectId }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('Engine webhook create upstream error:', response.status, errText);
      return NextResponse.json(
        { success: false, error: { code: 'E5001', message: 'Failed to create webhook' } },
        { status: response.status }
      );
    }
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Engine webhook create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to create webhook' } },
      { status: 500 }
    );
  }
}
