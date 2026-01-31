/**
 * ONE Dashboard Type Definitions
 */

// ============ Auth Types ============

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// ============ Project Types ============

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  apiKey: string;
  apiSecret?: string;
  settings: ProjectSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSettings {
  allowedDomains: string[];
  rateLimit: number;
  features: ProjectFeatures;
  webhookUrl?: string;
}

export interface ProjectFeatures {
  wallet: boolean;
  swap: boolean;
  contracts: boolean;
  fiat: boolean;
  payments: boolean;
  quant: boolean;
}

export interface ProjectStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  volumeUsd: number;
  lastActivity?: string;
}

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

// ============ Ecosystem Types ============

export interface EcosystemApp {
  id: string;
  name: string;
  slug: string;
  description?: string;
  supabaseUrl?: string;
  supabaseProjectId?: string;
  apiEndpoint?: string;
  isActive: boolean;
  syncConfig: SyncConfig;
  createdAt: string;
  updatedAt: string;
}

export interface SyncConfig {
  syncUsers: boolean;
  syncWallets: boolean;
  syncTransactions: boolean;
  syncIntervalSeconds: number;
}

// ============ Migration Types ============

export interface MigrationJob {
  id: string;
  sourceApp: string;
  targetApp: string;
  status: MigrationStatus;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errors: MigrationError[];
  startedAt: string;
  completedAt?: string;
}

export type MigrationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface MigrationError {
  recordId: string;
  error: string;
  timestamp: string;
}

export interface MigrationConfig {
  sourceDatabase: DatabaseConnection;
  targetDatabase: DatabaseConnection;
  tables: string[];
  batchSize: number;
  dryRun: boolean;
}

export interface DatabaseConnection {
  type: 'supabase' | 'postgres' | 'ipv4';
  url: string;
  apiKey?: string;
  ipv4?: string;
  port?: number;
}

// ============ Dashboard Stats ============

export interface DashboardStats {
  overview: OverviewStats;
  users: UserStats;
  transactions: TransactionStats;
  projects: ProjectStatsOverview;
  growth: GrowthData;
}

export interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalVolume: number;
}

export interface UserStats {
  total: number;
  new24h: number;
  active7d: number;
  byTier: Record<string, number>;
}

export interface TransactionStats {
  total: number;
  today: number;
  volume24h: number;
  avgValue: number;
}

export interface ProjectStatsOverview {
  total: number;
  active: number;
  topProjects: Array<{
    id: string;
    name: string;
    users: number;
    volume: number;
  }>;
}

export interface GrowthData {
  users: number[];
  transactions: number[];
  volume: number[];
  labels: string[];
}

// ============ API Types ============

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
    cached?: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
