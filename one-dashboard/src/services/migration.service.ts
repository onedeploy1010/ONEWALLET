/**
 * Data Migration Service
 * Handles data sync between One-Wallet and One-Engine via direct IPv4 connection
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseEngine, supabaseWallet } from '@/lib/supabase';
import { env } from '@/config/env';
import type { MigrationJob, MigrationConfig, MigrationError } from '@/types';

export interface MigrationProgress {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  currentTable: string;
  errors: MigrationError[];
  startedAt: Date;
  estimatedTimeRemaining?: number;
}

export class MigrationService {
  private walletClient: SupabaseClient<any, any, any> | null = null;
  private engineClient: SupabaseClient<any, any, any>;

  constructor() {
    this.engineClient = supabaseEngine as SupabaseClient<any, any, any>;
    this.walletClient = supabaseWallet as SupabaseClient<any, any, any> | null;
  }

  /**
   * Initialize direct IPv4 connection to One-Wallet database
   */
  async initializeWalletConnection(config: {
    supabaseUrl: string;
    supabaseKey: string;
    ipv4?: string;
  }): Promise<boolean> {
    try {
      // Use IPv4 direct URL if provided
      const url = config.ipv4
        ? `http://${config.ipv4}:54321` // Direct Supabase PostgREST port
        : config.supabaseUrl;

      this.walletClient = createClient(url, config.supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Test connection
      const { error } = await this.walletClient.from('user_profiles').select('id').limit(1);
      if (error) {
        console.error('Wallet connection test failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize wallet connection:', error);
      return false;
    }
  }

  /**
   * Get migration status overview
   */
  async getMigrationStatus(): Promise<{
    walletConnected: boolean;
    engineConnected: boolean;
    pendingUsers: number;
    syncedUsers: number;
    lastSync?: string;
  }> {
    const walletConnected = this.walletClient !== null;
    let engineConnected = false;
    let pendingUsers = 0;
    let syncedUsers = 0;
    let lastSync: string | undefined;

    try {
      // Test engine connection
      const { error } = await this.engineClient.from('users').select('id').limit(1);
      engineConnected = !error;

      // Get sync status from engine
      const { data: mappings } = await this.engineClient
        .from('user_app_mappings')
        .select('synced_at')
        .order('synced_at', { ascending: false })
        .limit(1);

      if (mappings?.[0]) {
        lastSync = mappings[0].synced_at;
      }

      // Count synced users
      const { count } = await this.engineClient
        .from('user_app_mappings')
        .select('*', { count: 'exact', head: true });
      syncedUsers = count || 0;

      // Get pending users from wallet
      if (this.walletClient) {
        const { count: walletCount } = await this.walletClient
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });
        pendingUsers = Math.max(0, (walletCount || 0) - syncedUsers);
      }
    } catch (error) {
      console.error('Failed to get migration status:', error);
    }

    return {
      walletConnected,
      engineConnected,
      pendingUsers,
      syncedUsers,
      lastSync,
    };
  }

  /**
   * Fetch users from One-Wallet for migration preview
   */
  async fetchWalletUsers(limit = 100, offset = 0): Promise<{
    users: Array<{
      id: string;
      email: string;
      walletAddress?: string;
      kycStatus?: string;
      membershipTier?: string;
      createdAt: string;
      synced: boolean;
    }>;
    total: number;
  }> {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized');
    }

    const { data, count, error } = await this.walletClient
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch wallet users: ${error.message}`);
    }

    // Check which users are already synced
    const userIds = (data || []).map((u: { id: string }) => u.id);
    const { data: mappings } = await this.engineClient
      .from('user_app_mappings')
      .select('external_user_id')
      .in('external_user_id', userIds);

    const syncedIds = new Set((mappings || []).map((m: { external_user_id: string }) => m.external_user_id));

    return {
      users: (data || []).map((u: Record<string, unknown>) => ({
        id: u.id as string,
        email: u.email as string,
        walletAddress: u.wallet_address as string | undefined,
        kycStatus: u.kyc_status as string | undefined,
        membershipTier: u.membership_tier as string | undefined,
        createdAt: u.created_at as string,
        synced: syncedIds.has(u.id as string),
      })),
      total: count || 0,
    };
  }

  /**
   * Migrate users from One-Wallet to One-Engine
   */
  async migrateUsers(options: {
    batchSize?: number;
    dryRun?: boolean;
    userIds?: string[];
  } = {}): Promise<MigrationProgress> {
    const { batchSize = 100, dryRun = false, userIds } = options;

    if (!this.walletClient) {
      throw new Error('Wallet client not initialized');
    }

    const jobId = crypto.randomUUID();
    const progress: MigrationProgress = {
      jobId,
      status: 'running',
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
      currentTable: 'user_profiles',
      errors: [],
      startedAt: new Date(),
    };

    try {
      // Fetch users to migrate
      let query = this.walletClient
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (userIds && userIds.length > 0) {
        query = query.in('id', userIds);
      }

      const { data: users, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      progress.totalRecords = users?.length || 0;

      if (dryRun) {
        progress.status = 'completed';
        return progress;
      }

      // Process in batches
      for (let i = 0; i < (users?.length || 0); i += batchSize) {
        const batch = users!.slice(i, i + batchSize);

        for (const user of batch) {
          try {
            await this.migrateUser(user);
            progress.processedRecords++;
          } catch (err) {
            progress.failedRecords++;
            progress.errors.push({
              recordId: user.id,
              error: (err as Error).message,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      progress.status = progress.failedRecords > 0 ? 'completed' : 'completed';
    } catch (error) {
      progress.status = 'failed';
      progress.errors.push({
        recordId: 'batch',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }

    return progress;
  }

  /**
   * Migrate a single user
   */
  private async migrateUser(walletUser: Record<string, unknown>): Promise<string> {
    // Check if user already exists in engine by email
    const { data: existingUser } = await this.engineClient
      .from('users')
      .select('id')
      .eq('email', walletUser.email)
      .single();

    let engineUserId: string;

    if (existingUser) {
      // Update existing user
      engineUserId = existingUser.id;
      await this.engineClient
        .from('users')
        .update({
          wallet_address: walletUser.wallet_address,
          thirdweb_user_id: walletUser.thirdweb_user_id,
          kyc_status: walletUser.kyc_status || 'none',
          kyc_level: walletUser.kyc_level || 0,
          membership_tier: walletUser.membership_tier || 'free',
          agent_level: walletUser.agent_level || 0,
          referral_code: walletUser.referral_code,
          total_referrals: walletUser.total_referrals || 0,
          total_team_volume: walletUser.total_team_volume || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', engineUserId);
    } else {
      // Create new user
      const { data: newUser, error } = await this.engineClient
        .from('users')
        .insert({
          email: walletUser.email,
          wallet_address: walletUser.wallet_address,
          smart_account_address: walletUser.wallet_address,
          thirdweb_user_id: walletUser.thirdweb_user_id,
          role: 'user',
          kyc_status: walletUser.kyc_status || 'none',
          kyc_level: walletUser.kyc_level || 0,
          membership_tier: walletUser.membership_tier || 'free',
          agent_level: walletUser.agent_level || 0,
          referral_code: walletUser.referral_code || this.generateReferralCode(),
          total_referrals: walletUser.total_referrals || 0,
          total_team_volume: walletUser.total_team_volume || 0,
          metadata: walletUser.metadata || {},
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create user: ${error.message}`);
      }

      engineUserId = newUser.id;
    }

    // Create user app mapping
    const { data: app } = await this.engineClient
      .from('ecosystem_apps')
      .select('id')
      .eq('slug', 'one-wallet')
      .single();

    if (app) {
      await this.engineClient
        .from('user_app_mappings')
        .upsert({
          user_id: engineUserId,
          app_id: app.id,
          external_user_id: walletUser.id as string,
          app_specific_data: {
            wallet_status: walletUser.wallet_status,
            wallet_type: walletUser.wallet_type,
            original_referred_by: walletUser.referred_by,
          },
          synced_at: new Date().toISOString(),
        }, {
          onConflict: 'app_id,external_user_id',
        });
    }

    return engineUserId;
  }

  /**
   * Sync referral relationships after migration
   */
  async syncReferralRelationships(): Promise<{ updated: number; errors: MigrationError[] }> {
    const errors: MigrationError[] = [];
    let updated = 0;

    try {
      // Get all mappings with original_referred_by
      const { data: mappings } = await this.engineClient
        .from('user_app_mappings')
        .select('user_id, external_user_id, app_specific_data')
        .not('app_specific_data->original_referred_by', 'is', null);

      for (const mapping of mappings || []) {
        const originalReferredBy = (mapping.app_specific_data as Record<string, unknown>)?.original_referred_by;
        if (!originalReferredBy) continue;

        // Find the referrer's engine user ID
        const { data: referrerMapping } = await this.engineClient
          .from('user_app_mappings')
          .select('user_id')
          .eq('external_user_id', originalReferredBy)
          .single();

        if (referrerMapping) {
          const { error } = await this.engineClient
            .from('users')
            .update({ referred_by: referrerMapping.user_id })
            .eq('id', mapping.user_id);

          if (error) {
            errors.push({
              recordId: mapping.user_id,
              error: error.message,
              timestamp: new Date().toISOString(),
            });
          } else {
            updated++;
          }
        }
      }
    } catch (error) {
      errors.push({
        recordId: 'batch',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }

    return { updated, errors };
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}

export const migrationService = new MigrationService();
