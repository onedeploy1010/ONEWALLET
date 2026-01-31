import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine, supabaseWallet } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { source, target, type, dryRun = true } = body;

    // Validate inputs
    if (!['one_wallet', 'one_engine'].includes(source) ||
        !['one_wallet', 'one_engine'].includes(target)) {
      return NextResponse.json(
        { success: false, error: { code: 'E3001', message: 'Invalid source or target' } },
        { status: 400 }
      );
    }

    if (source === target) {
      return NextResponse.json(
        { success: false, error: { code: 'E3002', message: 'Source and target cannot be the same' } },
        { status: 400 }
      );
    }

    // Get record counts
    let totalRecords = 0;
    const sourceClient = source === 'one_wallet' ? supabaseWallet : supabaseEngine;

    if (!sourceClient) {
      return NextResponse.json(
        { success: false, error: { code: 'E3003', message: 'Source database not configured' } },
        { status: 400 }
      );
    }

    if (type === 'users' || type === 'all') {
      const tableName = source === 'one_wallet' ? 'user_profiles' : 'users';
      const { count } = await sourceClient
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      totalRecords += count || 0;
    }

    if (type === 'transactions' || type === 'all') {
      const { count } = await sourceClient
        .from('transactions')
        .select('*', { count: 'exact', head: true });
      totalRecords += count || 0;
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        data: {
          dryRun: true,
          source,
          target,
          type,
          totalRecords,
          message: `Dry run: Would migrate ${totalRecords} records from ${source} to ${target}`,
        },
      });
    }

    // Create migration job
    const { data: job, error: jobError } = await supabaseEngine
      .from('migration_jobs')
      .insert({
        source,
        target,
        type,
        status: 'pending',
        total_records: totalRecords,
        migrated_records: 0,
        failed_records: 0,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (jobError) {
      throw jobError;
    }

    // Start migration in background (using Edge Function in production)
    // For now, we'll do it inline for simplicity
    startMigrationProcess(job.id, source, target, type).catch(console.error);

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Migration start error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E3000', message: 'Failed to start migration' } },
      { status: 500 }
    );
  }
}

async function startMigrationProcess(
  jobId: string,
  source: 'one_wallet' | 'one_engine',
  target: 'one_wallet' | 'one_engine',
  type: 'users' | 'transactions' | 'all'
) {
  const sourceClient = source === 'one_wallet' ? supabaseWallet : supabaseEngine;
  const targetClient = target === 'one_wallet' ? supabaseWallet : supabaseEngine;

  if (!sourceClient || !targetClient) {
    await supabaseEngine
      .from('migration_jobs')
      .update({ status: 'failed', error_message: 'Database not configured' })
      .eq('id', jobId);
    return;
  }

  // Update status to running
  await supabaseEngine
    .from('migration_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', jobId);

  let migratedCount = 0;
  let failedCount = 0;

  try {
    // Migrate users
    if (type === 'users' || type === 'all') {
      const sourceTable = source === 'one_wallet' ? 'user_profiles' : 'users';
      const targetTable = target === 'one_wallet' ? 'user_profiles' : 'users';

      const { data: users, error: fetchError } = await sourceClient
        .from(sourceTable)
        .select('*');

      if (fetchError) throw fetchError;

      for (const user of users || []) {
        try {
          // Transform data based on source/target schemas
          const transformedUser = transformUserData(user, source, target);

          await targetClient
            .from(targetTable)
            .upsert(transformedUser, { onConflict: 'email' });

          migratedCount++;

          // Update progress every 100 records
          if (migratedCount % 100 === 0) {
            await supabaseEngine
              .from('migration_jobs')
              .update({ migrated_records: migratedCount })
              .eq('id', jobId);
          }
        } catch (e) {
          failedCount++;
        }
      }
    }

    // Update final status
    await supabaseEngine
      .from('migration_jobs')
      .update({
        status: 'completed',
        migrated_records: migratedCount,
        failed_records: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  } catch (error) {
    await supabaseEngine
      .from('migration_jobs')
      .update({
        status: 'failed',
        error_message: (error as Error).message,
        migrated_records: migratedCount,
        failed_records: failedCount,
      })
      .eq('id', jobId);
  }
}

function transformUserData(
  user: Record<string, unknown>,
  source: 'one_wallet' | 'one_engine',
  target: 'one_wallet' | 'one_engine'
): Record<string, unknown> {
  if (source === 'one_wallet' && target === 'one_engine') {
    // Transform from One Wallet schema to One Engine schema
    return {
      email: user.email,
      role: 'user',
      wallet_address: user.wallet_address,
      metadata: {
        source: 'one_wallet',
        original_id: user.id,
        referral_code: user.referral_code,
      },
      created_at: user.created_at,
    };
  }

  if (source === 'one_engine' && target === 'one_wallet') {
    // Transform from One Engine schema to One Wallet schema
    return {
      email: user.email,
      wallet_address: user.wallet_address,
      engine_user_id: user.id,
      created_at: user.created_at,
    };
  }

  return user;
}
