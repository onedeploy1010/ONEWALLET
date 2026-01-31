import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine, supabaseWallet } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const status = {
      one_wallet: {
        connected: false,
        latency: null as number | null,
        version: null as string | null,
      },
      one_engine: {
        connected: false,
        latency: null as number | null,
        version: null as string | null,
      },
    };

    // Test One Engine connection
    try {
      const engineStart = Date.now();
      const { data, error } = await supabaseEngine
        .from('users')
        .select('count', { count: 'exact', head: true });

      if (!error) {
        status.one_engine.connected = true;
        status.one_engine.latency = Date.now() - engineStart;
        status.one_engine.version = 'PostgreSQL 15 (Supabase)';
      }
    } catch (e) {
      console.error('Engine connection test failed:', e);
    }

    // Test One Wallet connection
    try {
      if (supabaseWallet) {
        const walletStart = Date.now();
        const { data, error } = await supabaseWallet
          .from('user_profiles')
          .select('count', { count: 'exact', head: true });

        if (!error) {
          status.one_wallet.connected = true;
          status.one_wallet.latency = Date.now() - walletStart;
          status.one_wallet.version = 'PostgreSQL 15 (Supabase)';
        }
      }
    } catch (e) {
      console.error('Wallet connection test failed:', e);
    }

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Migration status error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E3000', message: 'Failed to get connection status' } },
      { status: 500 }
    );
  }
}
